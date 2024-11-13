import express from "express";
import authRoutes from "./routes/authRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import axios from "axios";
import Consul from "consul";
import client from "prom-client";

const consul = new Consul({ host: "consul", port: 8500 });
const consul_url = "http://consul:8500";
const docker_api_url = "http://localhost";

const app = express();
const collectDefaultMetrics = client.collectDefaultMetrics;
let authServiceIndex = 0;
let flashcardsServiceIndex = 0;

// Round Robin Service Discovery
const getServiceAddress = async (serviceName) => {
  try {
    console.log(`Querying Consul for service: ${serviceName}`);
    const services = await axios.get(
      `${consul_url}/v1/catalog/service/${serviceName}`
    );

    // If we get a list of service instances
    if (services.data && services.data.length > 0) {
      if (serviceName === "auth-service") {
        // Get the next auth-service instance in Round Robin fashion
        const service = services.data[authServiceIndex % services.data.length];
        authServiceIndex++; // Move to the next instance
        const address = `${service.ServiceAddress}:${service.ServicePort}`;
        console.log(`Resolved auth-service address: ${address}`);
        return address;
      } else if (serviceName === "flashcards-service") {
        // Get the next flashcards-service instance in Round Robin fashion
        const service =
          services.data[flashcardsServiceIndex % services.data.length];
        flashcardsServiceIndex++; // Move to the next instance
        const address = `${service.ServiceAddress}:${service.ServicePort}`;
        console.log(`Resolved flashcards-service address: ${address}`);
        return address;
      }
    } else {
      throw new Error(`Service ${serviceName} not found`);
    }
  } catch (error) {
    console.error(`Error fetching service ${serviceName}:`, error);
    throw error;
  }
};

app.use(express.json());

app.get("/status", (req, res) => {
  res.json({
    status: "Gateway is running",
  });
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

app.get("/discovery-status", async (req, res) => {
  try {
    // Querying service statuses from Consul using the Catalog API
    const authServiceAddress = await getServiceAddress("auth-service");
    const flashcardsServiceAddress = await getServiceAddress(
      "flashcards-service"
    );

    res.json({
      status: "Discovery Service is running",
      services: {
        "auth-service": {
          address: authServiceAddress,
          status: "reachable",
        },
        "flashcards-service": {
          address: flashcardsServiceAddress,
          status: "reachable",
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching service status",
      error: error.message,
    });
  }
});
// Configure Axios for Docker Unix socket access
const axiosInstance = axios.create({
  baseURL: "http://localhost", // Placeholder, ignored due to socketPath
  socketPath: "/var/run/docker.sock",
  timeout: 10000,
});
app.get("/get_websocket_url", async (req, res) => {
  try {
    const dockerResponse = await axiosInstance.get("/containers/json");
    const flashcardsContainers = dockerResponse.data.filter(
      (container) =>
        container.Names.some((name) => name.includes("flashcards-service")) &&
        container.Ports.some(
          (port) => port.PrivatePort === 5001 && port.PublicPort
        )
    );

    if (flashcardsContainers.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * flashcardsContainers.length
      );
      const selectedContainer = flashcardsContainers[randomIndex];

      const portMapping = selectedContainer.Ports.find(
        (port) => port.PrivatePort === 5001
      );

      const websocket_url = `ws://localhost:${portMapping.PublicPort}`;
      return res.json({ websocket_url });
    } else {
      return res.status(503).json({
        error:
          "No available flashcards-service instances with public WebSocket port",
      });
    }
  } catch (error) {
    console.error("Error fetching WebSocket URL:", error);
    return res.status(500).json({ error: "Failed to retrieve WebSocket URL" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/flashcards", flashcardRoutes);

app.listen(8080, () => {
  console.log("Gateway running on port 8080");
});

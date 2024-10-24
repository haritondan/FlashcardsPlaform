import express from "express";
import authRoutes from "./routes/authRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
const consul = new Consul({ host: "consul", port: 8500 });
const consul_url = "http://consul:8500";
import axios from "axios";
import Consul from "consul";

const app = express();
const getServiceAddress = async (serviceName) => {
  try {
    console.log(`Querying Consul Catalog for service: ${serviceName}`);

    // Fetch all services and their details from Consul Catalog
    const services = await axios.get(
      `${consul_url}/v1/catalog/service/${serviceName}`
    );

    // If the service exists, extract the first available instance
    if (services.data && services.data.length > 0) {
      const service = services.data[0]; // Take the first instance of the service
      const address = `${service.ServiceAddress}:${service.ServicePort}`; // Get the service address and port
      console.log(`Resolved service address: ${address}`);
      return address;
    } else {
      throw new Error(`Service ${serviceName} not found in Consul Catalog`);
    }
  } catch (error) {
    console.error(
      `Error fetching service ${serviceName} from Consul Catalog:`,
      error
    );
    throw error;
  }
};

app.use(express.json());

app.get("/status", (req, res) => {
  res.json({
    status: "Gateway is running",
  });
});

app.get("/discovery-status", async (req, res) => {
  try {
    // Querying service statuses from Consul using the Catalog API
    const authServiceAddress = await getServiceAddress("auth-service");
    const flashcardsServiceAddress = await getServiceAddress(
      "flashcards-service"
    );

    res.json({
      status: "Gateway is running",
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
app.use("/api/auth", authRoutes);
app.use("/api/flashcards", flashcardRoutes);

app.listen(8080, () => {
  console.log("Gateway running on port 8080");
});

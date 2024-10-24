import express from "express";
import axios from "axios";
import Consul from "consul";

const router = express.Router();
const consul = new Consul({ host: "consul", port: 8500 }); // Connect to Consul
const consul_url = "http://consul:8500";
const axiosInstance = axios.create({
  timeout: 15000,
});

// Function to get service address from Consul
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

router.post("/login", async (req, res) => {
  try {
    const authServiceAddress = await getServiceAddress("auth-service");
    const response = await axiosInstance.post(
      `http://${authServiceAddress}/api/auth/login`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      res.status(408).json({ message: "Request Timeout" });
    } else {
      res
        .status(error.response?.status || 500)
        .json(error.response?.data || { message: "Server error" });
    }
  }
});

router.post("/register", async (req, res) => {
  try {
    const authServiceAddress = await getServiceAddress("auth-service");
    const response = await axiosInstance.post(
      `http://${authServiceAddress}/api/auth/register`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      res.status(408).json({ message: "Request Timeout" });
    } else {
      res
        .status(error.response?.status || 500)
        .json(error.response?.data || { message: "Server error" });
    }
  }
});

router.post("/logout", async (req, res) => {
  try {
    const authServiceAddress = await getServiceAddress("auth-service");
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Missing token" });
    }
    const response = await axiosInstance.post(
      `http://${authServiceAddress}/api/auth/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      res.status(408).json({ message: "Request Timeout" });
    } else {
      res
        .status(error.response?.status || 500)
        .json(error.response?.data || { message: "Server error" });
    }
  }
});

router.put("/:userId", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization token required" });
  }
  try {
    const authServiceAddress = await getServiceAddress("auth-service");
    const response = await axiosInstance.put(
      `http://auth-service:5000/api/auth/users/${req.params.userId}`,
      req.body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      res.status(408).json({ message: "Request Timeout" });
    } else {
      res
        .status(error.response?.status || 500)
        .json(error.response?.data || { message: "Server error" });
    }
  }
});

router.get("/status", async (req, res) => {
  try {
    const authServiceAddress = await getServiceAddress("auth-service");
    console.log(`Auth service address resolved: ${authServiceAddress}`); // Add this log
    const response = await axiosInstance.get(
      `http://${authServiceAddress}/api/auth/status`
    );
    res.json(response.data);
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      res.status(408).json({ message: "Request Timeout" });
    } else {
      res
        .status(error.response?.status || 500)
        .json(error.response?.data || { message: "Server error" });
    }
  }
});

router.get("/users", async (req, res) => {
  try {
    const authServiceAddress = await getServiceAddress("auth-service");
    const response = await axiosInstance.get(
      `http://${authServiceAddress}/api/auth/users`
    );
    res.json(response.data);
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      res.status(408).json({ message: "Request Timeout" });
    } else {
      res
        .status(error.response?.status || 500)
        .json(error.response?.data || { message: "Server error" });
    }
  }
});

export default router;

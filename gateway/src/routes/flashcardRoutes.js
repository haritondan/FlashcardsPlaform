import express from "express";
import axios from "axios";
import Consul from "consul";
import CircuitBreaker from "../circuitBreaker.js"; // Import Circuit Breaker
const router = express.Router();
const consul = new Consul({ host: "consul", port: 8500 });
const consul_url = "http://consul:8500";
const axiosInstance = axios.create({
  timeout: 5000,
});

let authServiceIndex = 0;
let flashcardsServiceIndex = 0;

const flashcardsServiceBreaker = new CircuitBreaker(5000); // 5 seconds timeout

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

router.get("/", async (req, res) => {
  try {
    if (flashcardsServiceBreaker.isCircuitOpen()) {
      return res
        .status(503)
        .json({ message: "Service unavailable due to repeated failures." });
    }

    const flashcardsServiceAddress = await getServiceAddress(
      "flashcards-service"
    );
    const response = await axiosInstance.get(
      `http://${flashcardsServiceAddress}/api/flashcards`
    );
    res.json(response.data);
  } catch (error) {
    flashcardsServiceBreaker.recordFailure();
    flashcardsServiceBreaker.recordFailure();
    if (error.code === "ECONNABORTED") {
      res.status(408).json({ message: "Request Timeout" });
    } else {
      res
        .status(error.response?.status || 500)
        .json(error.response?.data || { message: "Server error" });
    }
  }
});

router.post("/", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization token is required" });
  }
  try {
    if (flashcardsServiceBreaker.isCircuitOpen()) {
      return res
        .status(503)
        .json({ message: "Service unavailable due to repeated failures." });
    }

    const flashcardsServiceAddress = await getServiceAddress(
      "flashcards-service"
    );
    const response = await axiosInstance.post(
      `http://${flashcardsServiceAddress}/api/flashcards`,
      req.body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    flashcardsServiceBreaker.recordFailure();
    if (error.code === "ECONNABORTED") {
      res.status(408).json({ message: "Request Timeout" });
    } else {
      res
        .status(error.response?.status || 500)
        .json(error.response?.data || { message: "Server error" });
    }
  }
});

router.put("/:setId", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization token is required" });
  }
  try {
    if (flashcardsServiceBreaker.isCircuitOpen()) {
      return res
        .status(503)
        .json({ message: "Service unavailable due to repeated failures." });
    }

    const flashcardsServiceAddress = await getServiceAddress(
      "flashcards-service"
    );
    const response = await axiosInstance.put(
      `http://flashcards-service:5001/api/flashcards/${req.params.setId}`,
      req.body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    flashcardsServiceBreaker.recordFailure();
    if (error.code === "ECONNABORTED") {
      res.status(408).json({ message: "Request Timeout" });
    } else {
      res
        .status(error.response?.status || 500)
        .json(error.response?.data || { message: "Server error" });
    }
  }
});

router.get("/:setId", async (req, res) => {
  try {
    if (flashcardsServiceBreaker.isCircuitOpen()) {
      return res
        .status(503)
        .json({ message: "Service unavailable due to repeated failures." });
    }

    const flashcardsServiceAddress = await getServiceAddress(
      "flashcards-service"
    );
    const response = await axiosInstance.get(
      `http://flashcards-service:5001/api/flashcards/${req.params.setId}`
    );
    res.json(response.data);
  } catch (error) {
    flashcardsServiceBreaker.recordFailure();
    if (error.code === "ECONNABORTED") {
      res.status(408).json({ message: "Request Timeout" });
    } else {
      res
        .status(error.response?.status || 500)
        .json(error.response?.data || { message: "Server error" });
    }
  }
});

router.delete("/:setId", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization token is required" });
  }
  try {
    if (flashcardsServiceBreaker.isCircuitOpen()) {
      return res
        .status(503)
        .json({ message: "Service unavailable due to repeated failures." });
    }

    const flashcardsServiceAddress = await getServiceAddress(
      "flashcards-service"
    );
    const response = await axiosInstance.delete(
      `http://flashcards-service:5001/api/flashcards/${req.params.setId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    flashcardsServiceBreaker.recordFailure();
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
    if (flashcardsServiceBreaker.isCircuitOpen()) {
      return res
        .status(503)
        .json({ message: "Service unavailable due to repeated failures." });
    }

    const flashcardsServiceAddress = await getServiceAddress(
      "flashcards-service"
    );
    const response = await axiosInstance.get(
      `http://${flashcardsServiceAddress}/api/flashcards/status`
    );
    res.json(response.data);
  } catch (error) {
    flashcardsServiceBreaker.recordFailure();
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

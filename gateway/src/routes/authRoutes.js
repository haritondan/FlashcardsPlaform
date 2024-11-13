import express from "express";
import axios from "axios";
import Consul from "consul";

const router = express.Router();
const consul = new Consul({ host: "consul", port: 8500 }); // Connect to Consul
const consul_url = "http://consul:8500";
const axiosInstance = axios.create({
  timeout: 5000,
});

let authServiceIndex = 0;

const retryRequest = async (fn, retries = 3, delay = 500) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i + 1} of ${retries}`);
      return await fn(); // Attempt the request
    } catch (error) {
      const statusCode = error.response?.status;
      console.warn(
        `Request failed with status ${statusCode} on attempt ${i + 1}.`
      );

      // Retry only if it's a 5xx error and we haven't exhausted retries
      if (statusCode >= 500 && i < retries - 1) {
        console.warn(`Retrying in ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay)); // Wait before retrying
      } else {
        console.error(
          "All retries failed or encountered a non-retriable error:",
          statusCode
        );
        throw error;
      }
    }
  }
};

const retryRequestAcrossReplicas = async (
  fn,
  retries = 3,
  delay = 500,
  serviceName = "auth-service"
) => {
  for (let i = 0; i < retries; i++) {
    try {
      const serviceAddress = await getServiceAddress(serviceName);
      return await fn(serviceAddress);
    } catch (error) {
      const statusCode = error.response?.status;
      for (let i = 0; i < 3; i++) {
        console.warn(
          `Request failed with status ${statusCode} on attempt ${i + 1}.`
        );
      }
      if (statusCode >= 500 && i < retries - 1) {
        console.warn(`Retrying on a new replica in ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error(
          "All retries failed or encountered a non-retriable error:",
          statusCode
        );
        throw error;
      }
    }
  }

  throw new Error(
    "Circuit breaker tripped: Service unavailable due to repeated failures across replicas."
  );
};

// const retryRequestAcrossReplicas = async (fn, replicas = 3, retriesPerReplica = 3, delay = 500, serviceName = "auth-service") => {
//   for (let replicaIndex = 0; replicaIndex < replicas; replicaIndex++) {
//     try {
//       // Get the address for the current replica
//       const serviceAddress = await getServiceAddress(serviceName);
//       console.log(`Trying replica ${replicaIndex + 1} at ${serviceAddress}`);

//       // Attempt retries on the current replica
//       for (let attempt = 0; attempt < retriesPerReplica; attempt++) {
//         try {
//           console.log(`Attempt ${attempt + 1} of ${retriesPerReplica} on replica ${replicaIndex + 1}`);
//           // Call the provided request function with the current replica address
//           return await fn(serviceAddress); // Return response on success

//         } catch (error) {
//           const statusCode = error.response?.status;
//           console.warn(`Attempt ${attempt + 1} failed on replica ${replicaIndex + 1} with status ${statusCode}`);

//           // Retry only if it's a 5xx error and we haven't exhausted retries for this replica
//           if (statusCode >= 500 && attempt < retriesPerReplica - 1) {
//             console.warn(`Retrying in ${delay}ms on the same replica...`);
//             await new Promise((res) => setTimeout(res, delay)); // Wait before retrying
//           } else {
//             console.warn(`Non-retriable error or max retries reached on replica ${replicaIndex + 1}`);
//             break; // Stop retrying on this replica if it’s a non-retriable error or retries exhausted
//           }
//         }
//       }
//       console.warn(`Moving to the next replica after ${retriesPerReplica} attempts on replica ${replicaIndex + 1}`);

//     } catch (error) {
//       console.error(`Failed to retrieve address for replica ${replicaIndex + 1}:`, error.message);
//     }
//   }

//   // If all replicas and retries fail, trigger circuit breaker
//   console.error("Circuit breaker tripped: Service unavailable after exhausting all replicas.");
//   throw new Error("Circuit breaker tripped: Service unavailable due to repeated failures across all replicas.");
// };

// Round Robin Service Discovery
const getServiceAddress = async (serviceName) => {
  try {
    console.log(`Querying Consul for service: ${serviceName}`);
    const services = await axios.get(
      `${consul_url}/v1/catalog/service/${serviceName}`
    );

    // If we get a list of service instances
    if (services.data && services.data.length > 0) {
      // Get the next auth-service instance in Round Robin fashion
      const service = services.data[authServiceIndex % services.data.length];
      authServiceIndex++; // Move to the next instance
      const address = `${service.ServiceAddress}:${service.ServicePort}`;
      console.log(`Resolved auth-service address: ${address}`);
      return address;
    } else {
      throw new Error(`Service ${serviceName} not found`);
    }
  } catch (error) {
    console.error(`Error fetching service ${serviceName}:`, error);
    throw error;
  }
};

router.post("/login", async (req, res) => {
  try {
    // Define the request function with dynamic service address
    const requestFunction = async (serviceAddress) => {
      return await axiosInstance.post(
        `http://${serviceAddress}/api/auth/login`,
        req.body
      );
    };

    // Use the retryRequestAcrossReplicas function
    const response = await retryRequestAcrossReplicas(
      requestFunction,
      3,
      500,
      "auth-service"
    );

    res.json(response.data);
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      res.status(408).json({ message: "Request Timeout" });
    } else if (error.response) {
      const statusCode = error.response.status;

      if (statusCode >= 500) {
        console.error(
          "Circuit breaker tripped: Service unavailable due to repeated 5xx failures."
        );
        res
          .status(503)
          .json({ message: "Service unavailable due to repeated failures." });
      } else {
        // Return other HTTP error statuses as is (e.g., 4xx errors)
        res.status(statusCode).json(error.response.data);
      }
    } else {
      // Non-HTTP or unknown errors
      console.error("Unexpected error encountered:", error.message);
      res.status(500).json({ message: "Server error" });
    }
  }
});

router.post("/register", async (req, res) => {
  try {
    // Define the request function with dynamic service address
    const requestFunction = async (serviceAddress) => {
      return await axiosInstance.post(
        `http://${serviceAddress}/api/auth/register`,
        req.body
      );
    };

    // Use the retryRequestAcrossReplicas function
    const response = await retryRequestAcrossReplicas(
      requestFunction,
      3,
      500,
      "auth-service"
    );

    res.json(response.data);
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      res.status(408).json({ message: "Request Timeout" });
    } else if (error.response) {
      const statusCode = error.response.status;

      if (statusCode >= 500) {
        console.error(
          "Circuit breaker tripped: Service unavailable due to repeated 5xx failures."
        );
        res
          .status(503)
          .json({ message: "Service unavailable due to repeated failures." });
      } else {
        // Return other HTTP error statuses as is (e.g., 4xx errors)
        res.status(statusCode).json(error.response.data);
      }
    } else {
      // Non-HTTP or unknown errors
      console.error("Unexpected error encountered:", error.message);
      res.status(500).json({ message: "Server error" });
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
    const response = await retryRequest(() =>
      axiosInstance.post(
        `http://${authServiceAddress}/api/auth/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
    );
    res.json(response.data);
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      res.status(408).json({ message: "Request Timeout" });
    } else if (error.response) {
      const statusCode = error.response.status;

      if (statusCode >= 500) {
        console.error(
          "Circuit breaker tripped: Service unavailable due to repeated 5xx failures."
        );
        res
          .status(503)
          .json({ message: "Service unavailable due to repeated failures." });
      } else {
        // Return other HTTP error statuses as is (e.g., 4xx errors)
        res.status(statusCode).json(error.response.data);
      }
    } else {
      // Non-HTTP or unknown errors
      console.error("Unexpected error encountered:", error.message);
      res.status(500).json({ message: "Server error" });
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
    const response = await retryRequest(() =>
      axiosInstance.put(
        `http://auth-service:5000/api/auth/users/${req.params.userId}`,
        req.body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
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
    const response = await retryRequestAcrossReplicas(() =>
      axiosInstance.get(
        `http://${authServiceAddress}/api/auth/status`,
        req.body
      )
    );
    res.json(response.data);
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      res.status(408).json({ message: "Request Timeout" });
    } else if (error.response) {
      const statusCode = error.response.status;

      if (statusCode >= 500) {
        console.error(
          "Circuit breaker tripped: Service unavailable due to repeated 5xx failures."
        );
        res
          .status(503)
          .json({ message: "Service unavailable due to repeated failures." });
      } else {
        // Return other HTTP error statuses as is (e.g., 4xx errors)
        res.status(statusCode).json(error.response.data);
      }
    } else {
      // Non-HTTP or unknown errors
      console.error("Unexpected error encountered:", error.message);
      res.status(500).json({ message: "Server error" });
    }
  }
});

router.get("/users", async (req, res) => {
  try {
    const authServiceAddress = await getServiceAddress("auth-service");
    const response = await retryRequest(() =>
      axiosInstance.get(`http://${authServiceAddress}/api/auth/users`)
    );
    res.json(response.data);
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      res.status(408).json({ message: "Request Timeout" });
    } else if (error.response) {
      const statusCode = error.response.status;

      if (statusCode >= 500) {
        console.error(
          "Circuit breaker tripped: Service unavailable due to repeated 5xx failures."
        );
        res
          .status(503)
          .json({ message: "Service unavailable due to repeated failures." });
      } else {
        // Return other HTTP error statuses as is (e.g., 4xx errors)
        res.status(statusCode).json(error.response.data);
      }
    } else {
      // Non-HTTP or unknown errors
      console.error("Unexpected error encountered:", error.message);
      res.status(500).json({ message: "Server error" });
    }
  }
});

export default router;

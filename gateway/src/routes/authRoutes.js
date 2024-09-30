import express from "express";
import axios from "axios";

const router = express.Router();

const axiosInstance = axios.create({
  timeout: 5000,
});

// router.use((req, res, next) => {
//   req.setTimeout(5000, () => {
//     res.status(408).json({ message: "Request Timeout" });
//   });
//   next();
// });

router.post("/login", async (req, res) => {
  try {
    const response = await axiosInstance.post(
      "http://auth-service:5000/api/auth/login",
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
    const response = await axiosInstance.post(
      "http://auth-service:5000/api/auth/register",
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
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Missing token" });
    }
    const response = await axiosInstance.post(
      "http://auth-service:5000/api/auth/logout",
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
    const response = await axiosInstance.get(
      "http://auth-service:5000/api/auth/status"
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
    const response = await axiosInstance.get(
      "http://auth-service:5000/api/auth/users"
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

// router.delete("users/:userId", async (req, res) => {
//   const token = req.headers.authorization?.split(" ")[1];
//   if (!token) {
//     return res
//       .status(401)
//       .json({ message: "Authorization token required" }, { timeout: 5000 });
//   }
//   try {
//     const response = await axios.delete(
//       `http://auth-service:5000/api/users/${req.params.userId}`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );
//     res.json(response.data);
//   } catch (error) {
//     res.status(error.response?.status || 500).json({
//       message: error.response?.data?.message || "Server error",
//     });
//   }
// });

export default router;

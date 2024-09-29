import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const response = await axios.post(
      "http://auth-service:5000/api/auth/login",
      req.body
    );
    res.json(response.data);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { message: "Server error" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const response = await axios.post(
      "http://auth-service:5000/api/auth/register",
      req.body
    );
    res.json(response.data);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { message: "Server error" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Missing token" });
    }
    const response = await axios.post(
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
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { message: "Server error" });
  }
});

// Update user route in the gateway (authRoutes.js)
router.put("/users/:userId", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization token required" });
  }
  try {
    const response = await axios.put(
      `http://auth-service:5000/api/auth/users/${req.params.userId}`, // Make sure this URL is correct
      req.body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error updating user:",
      error.response?.data || error.message
    );
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { message: "Server error" });
  }
});

router.get("/status", async (req, res) => {
  try {
    const response = await axios.get(
      "http://auth-service:5000/api/auth/status"
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Auth service is down" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const response = await axios.get("http://auth-service:5000/api/auth/users");
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || "Server error",
    });
  }
});

router.delete("/:userId", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization token required" });
  }
  try {
    const response = await axios.delete(
      `http://auth-service:5000/api/users/${req.params.userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || "Server error",
    });
  }
});

export default router;

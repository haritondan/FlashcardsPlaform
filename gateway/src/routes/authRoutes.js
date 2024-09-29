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

router.put("/:userId", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const response = await axios.put(
      `http://auth-service:5000/api/auth/${req.params.userId}`,
      req.body,
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

export default router;

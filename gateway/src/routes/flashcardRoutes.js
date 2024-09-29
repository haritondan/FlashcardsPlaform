import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const response = await axios.get(
      "http://flashcards-service:5001/api/flashcards"
    );
    res.json(response.data);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization token is required" });
  }
  try {
    const response = await axios.post(
      "http://flashcards-service:5001/api/flashcards",
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

router.put("/:setId", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization token is required" });
  }
  try {
    const response = await axios.put(
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
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { message: "Server error" });
  }
});

router.get("/:setId", async (req, res) => {
  try {
    const response = await axios.get(
      `http://flashcards-service:5001/api/flashcards/${req.params.setId}`
    );
    res.json(response.data);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { message: "Server error" });
  }
});

router.delete("/:setId", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authorization token is required" });
  }
  try {
    const response = await axios.delete(
      `http://flashcards-service:5001/api/flashcards/${req.params.setId}`,
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
      "http://flashcards-service:5001/api/flashcards/status"
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Flashcards service is down" });
  }
});

export default router;

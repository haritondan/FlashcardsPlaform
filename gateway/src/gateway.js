import express from "express";
const app = express();

app.get("/status", (req, res) => {
  res.status(200).json({ service: "gateway", status: "running" });
});

app.listen(8080, () => {
  console.log("Gateway is running on port 8080");
});

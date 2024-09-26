const { createServer } = require("http");

const server = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Gateway is working");
});

server.listen(8080, () => {
  console.log("Gateway running on port 8080");
});

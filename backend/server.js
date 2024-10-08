const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");
const mysql = require("mysql2");
require("dotenv").config();
// console.log(process.env);
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const host = "127.0.0.1";

// console.log(process.env.DB_PASSWORD);
let connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

const corsOptions = {
  origin: "http://127.0.0.1:5500",
};

// const requestListner = function (req, res) {
//   res.writeHead(200);
//   res.end("My first server");
// };

// const server = http.createServer(requestListner);

// server.listen(PORT, host, () => {
//   console.log(`Server is running on http://${host}:${port}}`);
// });
// // Serve static files from the frontend directory

app.use(express.static(path.join(__dirname, "../frontend/")));
// app.use(
//   "/frontend/index.html",
//   express.static(path.join(__dirname, "../frontend/index.html"))
// );

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });
// console.log(path.join(__dirname, "../frontend"));
// app.get("/frontend/index.html", (req, res) => {
//   //   return res.end(
//   //     fs.readFileSync(path.join(__dirname, "../frontend") + "/index.html")
//   //   );
//   return res.end(fs.readFileSync("/index.html"));
// });
// Example API endpoint
app.get("/api/data", cors(corsOptions), (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

// app.listen(PORT, () => {
//   console.log(`Server is running of http://localhost:${PORT}`);
// });
app.listen(PORT, host, () => {
  console.log(`Server is running of ${PORT}`);
});

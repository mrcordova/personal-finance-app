const express = require("express");
const data = require("./data.json");
const path = require("path");
const cors = require("cors");
const http = require("http");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
require("dotenv").config();
// console.log(process.env);
const fs = require("fs");
const { error } = require("console");

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
//   bodyParser.urlencoded({
//     extended: true,
//   })
// );
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ type: "*/*" }));

// Assume you have a MySQL connection called `connection`
// const transactions = data["transactions"];
// transactions.forEach((transaction) => {
//   const { avatar, name, category, date, amount, recurring } = transaction;
//   // Create a Date object
//   const dateObj = new Date(date);

//   // Format the date to 'YYYY-MM-DD HH:MM:SS'
//   const mysqlDate = dateObj.toISOString().slice(0, 19).replace("T", " ");
//   const query = `
//     INSERT INTO transactions (avatar, name, category, date, amount, recurring)
//     VALUES (?, ?, ?, ?, ?, ?)
//   `;
//   connection.query(
//     query,
//     [avatar, name, category, mysqlDate, amount, recurring],
//     (error, results) => {
//       if (error) throw error;
//       console.log("Inserted transaction", results.insertId);
//     }
//   );
// });
// const budgets = data["budgets"];
// budgets.forEach((budget) => {
//   const { category, maximum, theme } = budget;
//   const query = `INSERT INTO budgets (category, maximum, theme) VALUES (?, ?, ?)`;

//   connection.query(query, [category, maximum, theme], (error, results) => {
//     if (error) throw error;
//     console.log("Inserted budget", results.insertId);
//   });
// });
// const pots = data["pots"];
// pots.forEach((pot) => {
//   const { name, target, total, theme } = pot;
//   const query = `INSERT INTO pots (name, target, total, theme) VALUES (?, ?, ?, ?)`;

//   connection.query(query, [name, target, total, theme], (error, results) => {
//     if (error) throw error;
//     console.log("Inserted pot", results.insertId);
//   });
// });

// Example API endpoint
app.get("/api/data", cors(corsOptions), (req, res) => {
  res.json({ ...data });
});

app.post("/api/budget", cors(corsOptions), (req, res) => {
  console.log(req.body);
  // console.log(connection);
  // const sql = "INSERT INTO `users`(`name`, `age`) VALUES (?, ?), (?,?)";
  // const values = ["Josh", 19, "Page", 45];
  // const [result, fields] = connection.execute({ sql, values });
  res.send("good");
});
// app.listen(PORT, () => {
//   console.log(`Server is running of http://localhost:${PORT}`);
// });
app.listen(PORT, host, () => {
  console.log(`Server is running of ${PORT}`);
});

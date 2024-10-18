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
  typeCast: function (field, next) {
    if (field.type === "NEWDECIMAL") {
      return parseFloat(field.string());
    }
    return next();
  },
});

connection.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

// Allow requests from this origin
const corsOptions = {
  origin: "http://127.0.0.1:5500",
  methods: ["GET", "POST", "PUT", "DELETE"],
};

app.use(cors(corsOptions));

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
app.get("/api/data", cors(corsOptions), async (req, res) => {
  const balanceQuery = `SELECT * FROM balance`;
  const transactionsQuery = `SELECT * FROM transactions`;
  const budgetsQuery = `SELECT * FROM budgets`;
  const potsQuery = `SELECT * FROM pots`;

  try {
    const [balanceRows] = await connection.promise().execute(balanceQuery);
    const [transactionRows] = await connection
      .promise()
      .execute(transactionsQuery);
    const [budgetRows] = await connection.promise().execute(budgetsQuery);
    const [potsRows] = await connection.promise().execute(potsQuery);
    // transactions = await connection.promise().query(transactionsQuery);
    // console.log(balanceRows[0]);
    // console.log(transactionRows);
    // console.log(budgetRows);
    // console.log(potsRows);

    // console.log({
    //   balance: balanceRows[0],
    //   transactions: transactionRows,
    //   budgets: budgetRows,
    //   pots: potsRows,
    // });
    res.json({
      balance: balanceRows[0],
      transactions: transactionRows,
      budgets: budgetRows,
      pots: potsRows,
    });
  } catch {}
  // console.log(transactions[0]);
});

app.post("/api/addbudget", async (req, res) => {
  // console.log(req.body);
  // console.log(connection);
  try {
    const budgetQuery =
      "INSERT INTO `budgets`(`category`, `theme`, `maximum`) VALUES (?, ?, ?)";
    const { category, theme, maximum } = req.body;
    // console.log(category);
    // const values = [[category, theme, maximum]];
    const [results, fields] = await connection.promise().execute({
      sql: budgetQuery,
      values: [category, theme, maximum],
    });
    // console.log(results.insertId);
    res.status(201).json({ success: true, budgetId: results.insertId });
  } catch (error) {
    console.error(error);
    res.sendStatus(500).json({ error: "Database error" });
  }
});

app.post("/api/editbudget", async (req, res) => {
  try {
    const query =
      "UPDATE `budgets` SET `category` = ?, `theme` = ?, `maximum` = ? WHERE `id` = ? LIMIT 1 ";
    const { id, category, theme, maximum } = req.body;
    const [results, fields] = await connection.promise().execute({
      sql: query,
      values: [category, theme, maximum, id],
    });
    // console.log(results);
    res.status(201).json({ success: true, id: id });
  } catch (error) {
    res.status(500).json({ error: "edit budget error" });
  }
});
app.post("/api/deletebudget", async (req, res) => {
  try {
    const query = "DELETE FROM `budgets` WHERE `id` = ? LIMIT 1 ";
    const { id } = req.body;
    const [results, fields] = await connection.promise().execute({
      sql: query,
      values: [id],
    });
    // console.log(results);
    res.status(201).json({ success: true, id: id });
  } catch (error) {
    res.status(500).json({ error: "edit budget error" });
  }
});

app.post("/api/addpot", async (req, res) => {
  // console.log(req.body);
  // console.log(connection);
  try {
    const potQuery =
      "INSERT INTO `pots`(`name`, `target`, `total`, `theme`) VALUES (?, ?, ?, ?)";
    const { name, target, total, theme } = req.body;
    // console.log(category);
    // const values = [[category, theme, maximum]];
    const [results, fields] = await connection.promise().execute({
      sql: potQuery,
      values: [name, target, total, theme],
    });
    // console.log(results.insertId);
    res.status(201).json({ success: true, id: results.insertId });
  } catch (error) {
    console.error(error);
    res.sendStatus(500).json({ error: "Database error" });
  }
});

app.post("/api/editpot", async (req, res) => {
  try {
    const query =
      "UPDATE `pots` SET `name` = ?, `theme` = ?, `target` = ? WHERE `id` = ? LIMIT 1 ";
    const { id, name, theme, target } = req.body;
    const [results, fields] = await connection.promise().execute({
      sql: query,
      values: [name, theme, target, id],
    });
    // console.log(results);
    res.status(201).json({ success: true, id: id });
  } catch (error) {
    res.status(500).json({ error: "edit budget error" });
  }
});
// app.listen(PORT, () => {
//   console.log(`Server is running of http://localhost:${PORT}`);
// });
app.listen(PORT, host, () => {
  console.log(`Server is running of ${PORT}`);
});

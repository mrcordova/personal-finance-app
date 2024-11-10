const express = require("express");
const path = require("path");
const cors = require("cors");

const mysql = require("mysql2");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3003;
// const host = "127.0.0.1";

const pool = mysql.createPool({
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
const poolPromise = pool.promise();
// connection.connect(function (err) {
//   if (err) throw err;
//   console.log("Connected!");
// });

// Allow requests from this origin
// const corsOptions = {
//   origin: "http://127.0.0.1:5500",
//   methods: ["GET", "POST", "PUT", "DELETE"],
// };
// const corsOptions = {
//   origin: "https://personal-finance-app-1.onrender.com",
//   methods: ["GET", "POST", "PUT", "DELETE"],
// };

// app.use(cors(corsOptions));

const allowedOrigins = [
  "https://personal-finance-app-1.onrender.com",
  "http://127.0.0.1:5500",
];

// const corsOptions = {
//   origin: function (origin, callback) {
//     if (allowedOrigins.includes(origin) || !origin) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   methods: ["GET", "POST", "PUT", "DELETE"],
// };

const corsOptions = {
  origin: 'https://product-feedback-app-ikpg.onrender.com', // allow only this origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // allowed methods
  allowedHeaders: ['Content-Type', 'Authorization', 'bypass-tunnel-reminder', "localtunnel-agent-ips"], // allowed headers
  credentials: true // allow cookies to be sent
};

app.use(cors(corsOptions));

// For preflight requests (OPTIONS)
app.options('*', cors(corsOptions));
// // Serve static files from the frontend directory

app.use(express.static(path.join(__dirname, "../frontend/")));

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ type: "*/*" }));

// app.use((req, res, next) => {
//   res.set("Cache-Control", "no-store, no-cache, must-revalidate");
//   next();
// });

// const balance = data["balance"];
// const { current, income, expenses } = balance;
// const query = `INSERT INTO balance(current, income, expenses) VALUES (?,?,?)`;
// connection.query(query, [current, income, expenses], (error, results) => {
//   if (error) throw error;
//   console.log("INserted balance", results.insertId);
// });
// // Assume you have a MySQL connection called `connection`
// const transactions = data["transactions"];
// transactions.forEach((transaction) => {
//   const { avatar, name, category, date, amount, recurring } = transaction;
//   // Create a Date object3
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
    const [balanceRows] = await poolPromise.query(balanceQuery);
    const [transactionRows] = await poolPromise.query(transactionsQuery);
    const [budgetRows] = await poolPromise.query(budgetsQuery);
    const [potsRows] = await poolPromise.query(potsQuery);

    res.json({
      balance: balanceRows[0],
      transactions: transactionRows,
      budgets: budgetRows,
      pots: potsRows,
    });
  } catch {}
});

app.post("/api/addbudget", async (req, res) => {
  try {
    const budgetQuery =
      "INSERT INTO `budgets`(`category`, `theme`, `maximum`) VALUES (?, ?, ?)";
    const { category, theme, maximum } = req.body;

    const [results, fields] = await poolPromise.query({
      sql: budgetQuery,
      values: [category, theme, maximum],
    });
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
    const [results, fields] = await poolPromise.query({
      sql: query,
      values: [category, theme, maximum, id],
    });
    res.status(201).json({ success: true, id: id });
  } catch (error) {
    res.status(500).json({ error: "edit budget error" });
  }
});
app.post("/api/deletebudget", async (req, res) => {
  try {
    const query = "DELETE FROM `budgets` WHERE `id` = ? LIMIT 1 ";
    const { id } = req.body;
    const [results, fields] = await poolPromise.query({
      sql: query,
      values: [id],
    });
    res.status(201).json({ success: true, id: id });
  } catch (error) {
    res.status(500).json({ error: "delete budget error" });
  }
});

app.post("/api/addpot", async (req, res) => {
  try {
    const potQuery =
      "INSERT INTO `pots`(`name`, `target`, `total`, `theme`) VALUES (?, ?, ?, ?)";
    const { name, target, total, theme } = req.body;

    const [results, fields] = await poolPromise.query({
      sql: potQuery,
      values: [name, target, total, theme],
    });
    res.status(201).json({ success: true, id: results.insertId });
  } catch (error) {
    console.error(error);
    res.sendStatus(500).json({ error: "Database error" });
  }
});

app.post("/api/editpot", async (req, res) => {
  try {
    const query =
      "UPDATE `pots` SET `name` = ?, `theme` = ?, `target` = ? , `total` = ? WHERE `id` = ? LIMIT 1 ";
    const { id, name, theme, target, total } = req.body;
    const [results, fields] = await poolPromise.query({
      sql: query,
      values: [name, theme, target, total, id],
    });
    res.status(201).json({ success: true, id: id });
  } catch (error) {
    res.status(500).json({ error: "edit pot error" });
  }
});
app.post("/api/deletepot", async (req, res) => {
  try {
    const query = "DELETE FROM `pots` WHERE `id` = ? LIMIT 1 ";
    const { id } = req.body;
    const [results, fields] = await poolPromise.query({
      sql: query,
      values: [id],
    });
    res.status(201).json({ success: true, id: id });
  } catch (error) {
    res.status(500).json({ error: "delete pot error" });
  }
});
app.post("/api/updatebalance", async (req, res) => {
  try {
    const query = "UPDATE `balance` SET `current` = ? WHERE `id` = 1 LIMIT 1";
    const { current } = req.body;
    const [results, fields] = await poolPromise.query({
      sql: query,
      values: [current],
    });
    res.status(201).json({ success: true, id: results.insertId });
  } catch (error) {
    console.error(error);
  }
});

// Express example
app.get("/health-check", async (req, res) => {

  try {
   
    const potsQuery = "Select 1 from pots LIMIT 1";
   
    const [pots] = await poolPromise.query(potsQuery);
  
    res.json({ success: true });
    
  } catch (error) {
    console.error(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running of ${PORT}`);
});

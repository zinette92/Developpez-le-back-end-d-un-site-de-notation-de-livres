const express = require("express");
const helmet = require("helmet");
const mongoose = require("./models/index");
const routes = require("./routes/index");
const path = require("path");
const app = express();

app.use(express.json());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

app.use("/api", routes);
app.use("/images", express.static(path.join(__dirname, "images")));

module.exports = app;

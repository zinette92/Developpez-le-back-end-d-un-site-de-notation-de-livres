const express = require("express");
const mongoose = require("../backend/models/index");
const routes = require("../backend/routes/index");
const path = require("path");
const app = express();

app.use(express.json());

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

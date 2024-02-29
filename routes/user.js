const express = require("express");
const router = express.Router();
const userCtrl = require("../controllers/user");
const checkFields = require("../middleware/check-fields");

router.post("/signup", checkFields("signup"), userCtrl.signup);
router.post("/login", checkFields("login"), userCtrl.login);

module.exports = router;

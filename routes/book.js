const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");
const sharp = require("../middleware/sharp-config");
const bookCtrl = require("../controllers/book");
const checkFields = require("../middleware/check-fields");

router.get("/", bookCtrl.getAllBooks);
router.get("/bestrating", bookCtrl.getBestRatedBooks);
router.get("/:id", bookCtrl.getOneBook);
router.post("/", auth, multer, sharp, checkFields("createBook"), bookCtrl.createBook);
router.post("/:id/rating", auth, checkFields("rate"), bookCtrl.rateBook);
router.put("/:id", auth, multer, sharp, checkFields("updateBook"), bookCtrl.updateBook);
router.delete("/:id", auth, bookCtrl.deleteBook);

module.exports = router;

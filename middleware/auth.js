const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.TOKEN);
    const userId = decodedToken.userId;
    req.auth = {
      userId: userId,
    };
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Your token is invalid." });
    } else {
      return res.status(500).json({
        message:
          error.message || "An error occurred during token verification.",
      });
    }
  }

  next();
};


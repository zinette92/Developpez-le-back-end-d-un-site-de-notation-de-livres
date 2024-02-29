const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.signup = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then((existingUser) => {
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "This email address is already used." });
      } else {
        bcrypt
          .hash(req.body.password, 10)
          .then((hash) => {
            const user = new User({
              email: req.body.email,
              password: hash,
            });
            user
              .save()
              .then(() =>
                res
                  .status(201)
                  .json({ message: "Your account has been created." })
              )
              .catch((error) =>
                res.status(500).json({
                  message:
                    error.message ||
                    "An error occurred during account creation.",
                })
              );
          })
          .catch((error) =>
            res.status(500).json({
              message:
                error.message ||
                "An error has occurred while hashing the password.",
            })
          );
      }
    })
    .catch((error) =>
      res.status(500).json({
        message:
          error.message ||
          "An error occurred during the email address verification process.",
      })
    );
};

exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (user === null) {
        return res.status(401).json({
          message: "The email address/password combination is wrong.",
        });
      } else {
        bcrypt
          .compare(req.body.password, user.password)
          .then((valid) => {
            if (!valid) {
              return res.status(401).json({
                message: "The email address/password combination is wrong.",

              });
            } else {
              res.status(200).json({
                userId: user._id,
                token: jwt.sign({ userId: user._id }, process.env.TOKEN, {
                  expiresIn: "4h",
                }),
              });
            }
          })
          .catch((error) =>
            res.status(500).json({
              message:
                error.message ||
                "An error has occurred during the login verification process.",
            })
          );

      }
    })
    .catch((error) =>
      res.status(500).json({
        message:
          error.message ||
          "An error has occurred during the login verification process.",
      })
    );
};

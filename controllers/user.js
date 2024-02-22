const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.signup = (req, res, next) => {
  if (req.body.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({ message: "Adresse e-mail invalide" });
    }
  } else {
    return res
      .status(400)
      .json({ message: "Veuillez saisir une adresse e-mail" });
  }

  if (req.body.password) {
    if (req.body.password.length < 6) {
      return res.status(400).json({ message: "Votre mot de passe doit contenir au moins 6 caractères" });
    }

    if (req.body.password.includes(" ")) {
      return res
        .status(400)
        .json({ message: "Le mot de passe ne peut pas contenir d'espaces" });
    }
  }
  else {
    return res
    .status(400)
    .json({ message: "Veuillez saisir un mot de passe" });
  }

  bcrypt
  .hash(req.body.password, 10)
  .then((hash) => {
    User.findOne({ email: req.body.email })
      .then((existingUser) => {
        if (existingUser) {
          return res.status(400).json({ error: "Cette adresse e-mail est déjà prise." });
        } else {
          const user = new User({
            email: req.body.email,
            password: hash,
          });
          user
            .save()
            .then(() => res.status(201).json({ message: "Utilisateur créé" }))
            .catch((error) => res.status(500).json({ error }));
        }
      })
      .catch((error) => res.status(500).json({ error }));
  })
  .catch((error) => res.status(500).json({ error }));
};

exports.login = (req, res, next) => {
 
  if (req.body.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({ message: "Adresse e-mail invalide" });
    }
  } else {
    return res
      .status(400)
      .json({ message: "Veuillez saisir une adresse e-mail" });
  }

  if (req.body.password) {
    if (req.body.password.length < 6) {
      return res.status(400).json({ message: "Votre mot de passe doit contenir au moins 6 caractères" });
    }

    if (req.body.password.includes(" ")) {
      return res
        .status(400)
        .json({ message: "Le mot de passe ne peut pas contenir d'espaces" });
    }
  }
  else {
    return res
    .status(400)
    .json({ message: "Veuillez saisir un mot de passe" });
  }

  User.findOne({ email: req.body.email })
    .then((user) => {
      if (user === null) {
        res.status(401).json({
          message: "La combinaison identifiant/mot de passe est fausse",
        });
      } else {
        bcrypt
          .compare(req.body.password, user.password)
          .then((password) => {
            if (!password) {
              res.status(401).json({
                message: "La combinaison identifiant/mot de passe est fausse",
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
          .catch((error) => res.status(400).json({ error }));
      }
    })
    .catch((error) => res.status(500).json({ error }));
};

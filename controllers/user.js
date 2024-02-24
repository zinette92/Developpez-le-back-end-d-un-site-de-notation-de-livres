const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.signup = (req, res, next) => {

  if (!req.body.email) {
    return res.status(400).json({ error: "Veuillez saisir une adresse email." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
    return res.status(400).json({ error: "Adresse email invalide." });
  }

  if (!req.body.password) {
    return res.status(400).json({ error: "Veuillez saisir un mot de passe." });
  }

  if (req.body.password.length < 6) {
    return res.status(400).json({ error: "Votre mot de passe doit contenir au moins 6 caractères." });
  }

  if (req.body.password.includes(' ')) {
    return res.status(400).json({ error: "Votre mot de passe ne peut pas contenir d'espace." });
  }

  User.findOne({ email: req.body.email })
    .then((existingUser) => {
      if (existingUser) {
        return res.status(400).json({ message: "Cette adresse email est déjà utilisée." });
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
                  .json({ message: "Votre compte a bien été créé." })
              )
              .catch((error) => res.status(400).json({ error }));
          })
          .catch((error) => res.status(500).json({ error }));
      }
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.login = (req, res, next) => {

  if (!req.body.email) {
    return res.status(400).json({ error: "Veuillez saisir une adresse email." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
    return res.status(400).json({ error: "Adresse email invalide." });
  }

  if (!req.body.password) {
    return res.status(400).json({ error: "Veuillez saisir un mot de passe." });
  }

  if (req.body.password.length < 6) {
    return res.status(400).json({ error: "Votre mot de passe doit contenir au moins 6 caractères." });
  }

  if (req.body.password.includes(' ')) {
    return res.status(400).json({ error: "Votre mot de passe ne peut pas contenir d'espace." });
  }
  
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (user === null) {
        return res.status(401).json({
          message: "La combinaison identifiant/mot de passe est fausse.",
        });
      } else {
        bcrypt
          .compare(req.body.password, user.password)
          .then((valid) => {
            if (!valid) {
              return res.status(401).json({
                message: "La combinaison identifiant/mot de passe est fausse.",
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
          .catch((error) => res.status(500).json({ error }));
      }
    })
    .catch((error) => res.status(500).json({ error }));
};

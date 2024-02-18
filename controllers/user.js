const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.signup = (req, res, next) => {
    bcrypt.hash(req.body.password, 10)
    .then((hash) => {
        const user = new User({
            email: req.body.email,
            password: hash
        });
        user.save()
        .then(() => res.status(201).json({ message: 'Utilisatuer créé'}))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }))
};

exports.login = (req, res, next) => {
    User.findOne({email: req.body.email})
    .then(user => {
        if( user === null) {
            res.status(401).json({ message: "La combinaison identifiant/mot de passe est fausse" });
        }
        else {
            bcrypt.compare(req.body.password, user.password)
            .then(valid => {
                if(!valid) {
                    res.status(401).json({ message: "La combinaison identifiant/mot de passe est fausse" });
                }
                else {
                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign(
                           { userId: user._id },
                           process.env.TOKEN,
                           { expiresIn: '4h'}
                        )
                    });
                }
            })
            .catch((error) => res.status(500).json({ error }))
        }

    })
    .catch((error) => res.status(500).json({ error }))
};
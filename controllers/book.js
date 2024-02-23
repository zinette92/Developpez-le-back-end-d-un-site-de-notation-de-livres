const Book = require("../models/Book");
const fs = require("fs");
const sharp = require("sharp");

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => {
      if (books.length === 0) {
        return res.status(404).json({
          message: "Aucun livre existant",
        });
      }
      res.status(200).json(books);
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      res.status(200).json(book);
    })
    .catch((error) => {
      if (error.name === "CastError" && error.kind === "ObjectId") {
        return res.status(404).json({
          message: "Le livre que vous recherchez n'existe pas.",
        });
      } 
      
      res.status(500).json({ error });
     
    });
};

exports.getBestRatedBooks = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((bestRatedBooks) => {
      if (bestRatedBooks.length === 0) {
        return res.status(404).json({
          message: "Aucun livre existant",
        });
      }
      res.status(200).json(bestRatedBooks);
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject.userId;

  if (!bookObject.title) {
    return res.status(400).json({ message: "Veuillez saisir un titre" });
  }

  if (!bookObject.author) {
    return res.status(400).json({ message: "Veuillez saisir un nom d'auteur" });
  }

  if (!bookObject.year) {
    return res
      .status(400)
      .json({ message: "Veuillez saisir une date de parution" });
  }

  if (!bookObject.genre) {
    return res.status(400).json({ message: "Veuillez saisir un genre" });
  }

  if (!bookObject.ratings[0].grade) {
    return res.status(400).json({ message: "Veuillez saisir une note" });
  }

  if (!bookObject.averageRating) {
    return res.status(400).json({ message: "Veuillez saisir une note" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "Veuillez ajouter une image" });
  }



  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });

  book
    .save()
    .then(() => {
      res.status(201).json({ message: "Livre ajouté" });
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.rateBook = (req, res, next) => {
  const userId = req.auth.userId;
  const bookId = req.params.id;
  const grade = req.body.rating;

  Book.findOne({ _id: bookId, "ratings.userId": userId })
    .then((book) => {
      if (book) {
        res.status(403).json({ message: "Vous avez déjà noté ce livre." });
      } else {
        Book.findOneAndUpdate(
          { _id: bookId },
          { $push: { ratings: { userId: userId, grade: grade } } },
          { new: true }
        )
          .then((updatedBook) => {
            if (!updatedBook) {
              return res
                .status(404)
                .json({ message: "Le livre n'a pas pu être récupéré" });
            }
            const totalRatings = updatedBook.ratings.length;
            const sumOfRatings = updatedBook.ratings.reduce(
              (acc, rating) => acc + rating.grade,
              0
            );
            const averageRating = (sumOfRatings / totalRatings).toPrecision(2);

            updatedBook.averageRating = averageRating;

            updatedBook
              .save()
              .then(() => {
                if (!updatedBook) {
                  return res
                    .status(404)
                    .json({ message: "Le livre n'a pas pu être mis à jour" });
                }
                res.status(200).json(updatedBook);
              })
              .catch((error) => {
                res.status(500).json({ error });
              });
          })
          .catch((error) => {
            res.status(500).json({ error });
          });
      }
    })
    .catch((error) => {
      if (error.name === "CastError" && error.kind === "ObjectId") {
        return res.status(404).json({
          message: "Le livre que vous essayer de noter n'existe pas.",
        });
      } 
      res.status(500).json({ error });
    });
};

exports.updateBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete bookObject.userId;


  if (!bookObject.title) {
    return res.status(400).json({ message: "Veuillez saisir un titre" });
  }

  if (!bookObject.author) {
    return res.status(400).json({ message: "Veuillez saisir un nom d'auteur" });
  }

  if (!bookObject.year) {
    return res
      .status(400)
      .json({ message: "Veuillez saisir une date de parution" });
  }

  if (!bookObject.genre) {
    return res.status(400).json({ message: "Veuillez saisir un genre" });
  }

  if (!bookObject.ratings[0].grade) {
    return res.status(400).json({ message: "Veuillez saisir une note" });
  }

  if (!bookObject.averageRating) {
    return res.status(400).json({ message: "Veuillez saisir une note" });
  }

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        return res.status(403).json({ message: "Modification non-autorisé" });
      } else {
        const previousImage = book.imageUrl.split("/images/")[1];
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => {
            if (!book) {
              return res
                .status(404)
                .json({ message: "Le livre n'a pas pu être mis à jour" });
            }
            res.status(200).json({ message: "Livre modifié" });
            if (req.file) {
              fs.unlink("images/" + previousImage, (error) => {
                if (error) {
                  console.log(
                    "Une erreur s'est produite lors de la suppression de l'image: ",
                    error
                  );
                } else {
                  console.log("L'ancienne image a bien été supprimée");
                }
              });
            }
          })
          .catch((error) => res.status(500).json({ error }));
      }
    })
    .catch((error) =>{ 
      if (error.name === "CastError" && error.kind === "ObjectId") {
        return res.status(404).json({
          message: "Le livre que vous essayer de modifier n'existe pas.",
        });
      } 
      res.status(500).json({ error })});
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({
          message:
            "Échec de la suppression : le livre que vous essayez de supprimer n'existe pas.",
        });
      } else {
        if (book.userId != req.auth.userId) {
          res.status(403).json({ message: "Suppression non-autorisé" });
        } else {
          const filename = book.imageUrl.split("/images/")[1];

          fs.unlink(`images/${filename}`, () => {
            Book.deleteOne({ _id: req.params.id })
              .then(() => res.status(200).json({ message: "Livre supprimé" }))
              .catch((error) => res.status(404).json({ error }));
          });
        }
      }
    })
    .catch((error) => {
      if (error.name === "CastError" && error.kind === "ObjectId") {
        return res.status(404).json({
          message:
            "Échec de la suppression : le livre que vous essayez de supprimer n'existe pas.",
        });
      } else {
        return res.status(500).json({ error });
      }
    });
};

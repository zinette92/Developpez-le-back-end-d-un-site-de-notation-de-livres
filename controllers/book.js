const Book = require("../models/Book");
const fs = require("fs");

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => res.status(404).json({ error }));
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

exports.getBestRatedBooks = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((bestRatesBooks) => {
      res.status(200).json(bestRatesBooks);
    })
    .catch((error) => res.status(404).json({ error }));
};

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject.userId;
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });

  book
    .save()
    .then(() => res.status(201).json({ message: "Livre créé" }))
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
              return res.status(404).json({ message: "Livre non trouvé." });
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
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(403).json({ message: "Non-autorisé" });
      } else {
        const previousImage = book.imageUrl.split("/images/")[1];
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => {
            res.status(200).json({ message: "Livre modifié" });
            fs.unlink("images/" + previousImage, () => {
              if (error) {
                console.log(
                  "Une erreur s'est produite lors de la suppression de l'image: ",
                  error
                );
              } else {
                console.log("L'image a bien été supprimée");
              }
            });
          })
          .catch((error) => res.status(500).json({ error }));
      }
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(403).json({ message: "Non-autorisé" });
      } else {
        const filename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => res.status(200).json({ message: "Livre supprimé" }))
            .catch((error) => res.status(404).json({ error }));
        });
      }
    })
    .catch((error) => res.status(500).json({ error }));
};

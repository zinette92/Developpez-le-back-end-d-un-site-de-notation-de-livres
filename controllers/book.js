const Book = require("../models/Book");
const fs = require("fs");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) =>
      res.status(500).json({
        message:
          error.message || "An error occurred when retrieving the books.",
      })
    );
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({
          message: "The book has not been found.",
        });
      }
      res.status(200).json(book);
    })
    .catch((error) => {
      if (error.name === "CastError" && error.kind === "ObjectId") {
        return res.status(400).json({
          message: "The book ID is invalid.",
        });
      }
      res.status(500).json({
        message: error.message || "An error occurred when retrieving the book.",
      });
    });
};

exports.getBestRatedBooks = (req, res, next) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((bestRatedBooks) => {
      res.status(200).json(bestRatedBooks);
    })
    .catch((error) =>
      res.status(500).json({
        message:
          error.message || "An error occurred when retrieving the books.",
      })
    );
};

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject.userId;
  delete bookObject.ratings[0].userId;

  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    ratings: [{ userId: req.auth.userId, ...bookObject.ratings[0] }],
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });

  book
    .save()
    .then(() => {
      res.status(201).json({ message: "Your book has been added." });
    })
    .catch((error) =>
      res.status(500).json({
        message: error.message || "An error occurred when creating the book.",
      })
    );
};

exports.rateBook = (req, res, next) => {
  const userId = req.auth.userId;
  const bookId = req.params.id;
  const grade = req.body.rating;

  Book.findOne({ _id: bookId, "ratings.userId": userId })
    .then((book) => {
      if (book) {
        res.status(403).json({ message: "You have already rated this book." });
      } else {
        Book.findOneAndUpdate(
          { _id: bookId },
          { $push: { ratings: { userId: userId, grade: grade } } },
          { new: true }
        )
          .then((updatedBook) => {
            if (!updatedBook) {
              return res.status(400).json({
                message: "An error has occurred in the book's rating.",
              });
            }

            Book.aggregate([
              { $match: { _id: new ObjectId(`${bookId}`) } },
              { $unwind: "$ratings" },
              {
                $group: {
                  _id: "$_id",
                  averageRating: { $avg: "$ratings.grade" },
                },
              },
            ])
              .then((result) => {
                updatedBook.averageRating =
                  result[0].averageRating.toPrecision(2);

                updatedBook
                  .save()
                  .then((savedBook) => {
                    if (!savedBook) {
                      return res.status(400).json({
                        message:
                          "The average rating of the book could not be updated.",
                      });
                    }
                    res.status(200).json(savedBook);
                  })
                  .catch((error) => {
                    res.status(500).json({
                      message:
                        error.message ||
                        "An error occurred when retrieving the updated book.",
                    });
                  });
              })
              .catch((error) => {
                res.status(500).json({
                  message:
                    error.message ||
                    "An error occurred when updating the average rating of the book.",
                });
              });
          })
          .catch((error) => {
            res.status(500).json({
              message:
                error.message || "An error has occurred in the book's rating.",
            });
          });
      }
    })
    .catch((error) => {
      if (error.name === "CastError" && error.kind === "ObjectId") {
        return res.status(400).json({
          message: "The book ID is invalid.",
        });
      }
      res.status(500).json({
        message: error.message || "An error occurred when retrieving the book.",
      });
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
      if (!book) {
        return res
          .status(404)
          .json({ message: "The book could not be retrieved." });
      }

      if (book.userId != req.auth.userId) {
        return res.status(403).json({ message: "Unauthorized book update." });
      } else {
        const previousImage = book.imageUrl.split("/images/")[1];
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => {
            if (req.file) {
              fs.unlink("images/" + previousImage, (error) => {
                if (error) {
                  res.status(200).json({
                    message:
                      "The book was successfully updated but the old image could not be deleted.",
                  });
                } else {
                  res.status(200).json({
                    message: "The book has been successfully updated.",
                  });
                }
              });
            } else {
              res
                .status(200)
                .json({ message: "The book has been successfully updated." });
            }
          })
          .catch((error) =>
            res.status(500).json({
              message:
                error.message || "An error occurred when updating the book.",
            })
          );
      }
    })
    .catch((error) => {
      if (error.name === "CastError" && error.kind === "ObjectId") {
        return res.status(404).json({
          message: "The book ID is invalid.",
        });
      }
      res.status(500).json({
        message: error.message || "An error occurred when retrieving the book.",
      });
    });
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({
          message: "The book you are trying to delete does not exist.",
        });
      } else {
        if (book.userId != req.auth.userId) {
          res.status(403).json({ message: "Unauthorized book deletion." });
        } else {
          const filename = book.imageUrl.split("/images/")[1];

          fs.unlink(`images/${filename}`, () => {
            Book.deleteOne({ _id: req.params.id })
              .then(() => res.status(204).send())
              .catch((error) => res.status(500).json({ error }));
          });
        }
      }
    })
    .catch((error) => {
      if (error.name === "CastError" && error.kind === "ObjectId") {
        return res.status(400).json({
          message: "The book ID is invalid.",
        });
      }
      res.status(500).json({
        message: error.message || "An error occurred when retrieving the book.",
      });
    });
};

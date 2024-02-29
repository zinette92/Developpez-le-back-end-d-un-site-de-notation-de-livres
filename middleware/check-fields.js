module.exports = (fields) => {
  return (req, res, next) => {
    if (fields === "login" || fields === "signup") {
      if (!req.body.email) {
        return res
          .status(400)
          .json({ message: "Please enter an email address." });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
        return res.status(400).json({ message: "Email address invalid." });
      }

      if (!req.body.password) {
        return res.status(400).json({ message: "Please enter a password." });
      }

      if (req.body.password.length < 6) {
        return res.status(400).json({
          message: "Your password must contain at least 6 characters.",
        });
      }

      if (req.body.password.includes(" ")) {
        return res
          .status(400)
          .json({ message: "Your password must not contain spaces." });
      }
    }

    if (fields === "createBook") {
      const bookObject = JSON.parse(req.body.book);

      if (!bookObject.title) {
        return res.status(400).json({ message: "Please enter a title." });
      }

      if (!bookObject.author) {
        return res
          .status(400)
          .json({ message: "Please enter an author name." });
      }

      if (!bookObject.year) {
        return res
          .status(400)
          .json({ message: "Please enter a date of publication." });
      }

      if (!bookObject.genre) {
        return res.status(400).json({ message: "Please enter a genre." });
      }

      if (bookObject.ratings[0].grade === undefined) {       

        return res.status(400).json({
          message: "Please rate the book.",
        });
      }

      if (bookObject.ratings[0].grade < 0 || bookObject.ratings[0].grade > 5) {
        return res.status(400).json({
          message: "The book's rating must be between 0 and 5.",
        });
      }

      if (bookObject.averageRating === undefined) {
        return res
          .status(400)
          .json({ message: "The average rate must be between 0 and 5." });
      }

      if (bookObject.ratings[0].grade != bookObject.averageRating) {
        return res
          .status(400)
          .json({ message: "The average rate must not be changed." });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Please add an image." });
      }
    }

    if (fields === "rate") {
      if (!req.body.rating) {
        return res.status(400).json({ message: "Please enter a rating." });
      }

      if (req.body.rating < 0 || req.body.rating > 5) {
        return res.status(400).json({
          message: "The book's rating must be between 0 and 5.",
        });
      }
    }

    if (fields === "updateBook") {
      const bookObject = req.file
        ? { ...JSON.parse(req.body.book) }
        : { ...req.body };

      if (bookObject.ratings || bookObject.averageRating) {
        return res
          .status(400)
          .json({ message: "You can't change your rating." });
      }
      if (!bookObject.title) {
        return res.status(400).json({ message: "Please enter a title." });
      }

      if (!bookObject.author) {
        return res
          .status(400)
          .json({ message: "Please enter an author name." });
      }

      if (!bookObject.year) {
        return res
          .status(400)
          .json({ message: "Please enter a date of publication." });
      }

      if (!bookObject.genre) {
        return res.status(400).json({ message: "Please enter a genre." });
      }
    }

    next();
  };
};

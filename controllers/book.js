const  Book = require('../models/Book');
const fs = require('fs');

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) =>{ 
      console.log('CCContenu de req.body.book:' + books);
      res.status(200).json(books)
    })
    .catch((error) => res.status(404).json({ error }));
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject.userId;
    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });

    book.save()
    .then(() => res.status(201).json({ message: 'Livre créé'}))
    .catch((error) => res.status(500).json({ message: 'non' }));

  };

  exports.updateBook = (req, res, next) => {
    const bookObject = req.file ? {
      ...JSON.parse(req.body.book),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };

    delete bookObject.userId;
    Book.findOne({ _id: req.params.id })
    .then((book) => {
      if(book.userId != req.auth.userId) {
          res.status(403).json({ message: 'Non-autorisé'})
      } else {
          Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Livre modifié' }))
          .catch(error => res.status(401).json({ error }));
      }
    })
    .catch((error) => res.status(400).json({ error }));
};

exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
    .then(book => {
      if(book.userId != req.auth.userId){
          res.status(403).json({ message: 'Non-autorisé'});
      } else {
        const filename = book.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
            Book.deleteOne({ _id: req.params.id})
            .then(() => res.status(200).json({ message: 'Livre supprimé'}))
            .catch(error => res.status(404).json({ error }));
        })
      }
    })
    .catch(error => res.status(500).json({ error }));
};


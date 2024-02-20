const sharp = require("sharp");
const fs = require("fs");

const processImage = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  sharp(req.file.path)
    .resize(800)
    .toFormat("webp")
    .toFile(req.file.path.replace(/\.([^.]*)$/, ".webp"), (error) => {
      if (error) {
        console.log("error");
        return next(error);
      }
      fs.unlink("images/" + req.file.filename, () => {
        if (error) {
          console.log(
            "Une erreur s'est produite lors de la suppression de l'image: ",
            error
          );
        } else {
          console.log("L'image a bien été supprimée");
        }
      });
      next();
    });
};

module.exports = processImage;

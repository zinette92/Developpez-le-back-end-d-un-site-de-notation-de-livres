const sharp = require("sharp");
const fs = require("fs");

const processImage = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  sharp.cache(false);
  sharp(req.file.path)
    .resize(800, 800)
    .toFormat("webp")
    .webp({ quality: 50 })
    .toFile(req.file.path.replace(/\.([^.]*)$/, ".webp"), (error) => {
      if (error) {
        console.log(
          "Une erreur est survenue lors de la modification de l'extension de l'image."
        );
        return next();
      }

      req.file.filename = req.file.filename.replace(/\.([^.]*)$/, ".webp");

      fs.unlink(req.file.path, (error) => {
        if (error) {
          console.log(
            "Une erreur est survenue lors de la suppression de l'image d'origine : ",
            error
          );
        } else {
          console.log("L'image d'origine a bien été supprimée.");
        }
      });
      next();
    });
};

module.exports = processImage;

const sharp = require("sharp");
const fs = require("fs");

module.exports = (req, res, next) => {
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
        return res.status(500).json({
          message:
            error.message ||
            "An error occurred while modifying the image extension.",
        });
      }

      req.file.filename = req.file.filename.replace(/\.([^.]*)$/, ".webp");

      fs.unlink(req.file.path, (error) => {
        if (error) {
          return res.status(500).json({
            message:
              error.message ||
              "An error occurred when deleting the original image",
          });
        }
      });
      next();
    });
};

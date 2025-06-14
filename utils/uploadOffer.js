// uploadOffer.js
const fs = require("fs");
const path = require("path");
const multer = require("multer");

// Ensure the /uploads/offers/temp folder exists
const offersTemp = path.join(__dirname, "../uploads/offers/temp");
if (!fs.existsSync(offersTemp)) {
  fs.mkdirSync(offersTemp, { recursive: true });
}

const offerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, offersTemp);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const uploadOffer = multer({
  storage: offerStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (
      !file.originalname.match(
        /\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx)$/i
      )
    ) {
      return cb(
        new Error(
          "Only image, pdf, doc, docx, xls, xlsx, ppt, pptx files are allowed!"
        ),
        false
      );
    }
    cb(null, true);
  },
}).array("attachments", 10);

module.exports = uploadOffer;

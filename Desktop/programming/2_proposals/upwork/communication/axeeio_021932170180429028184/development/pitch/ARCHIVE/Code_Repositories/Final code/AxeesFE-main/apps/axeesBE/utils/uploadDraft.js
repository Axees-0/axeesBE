// uploadDraft.js

const fs = require("fs");
const path = require("path");

const multer = require("multer");

// Ensure the /uploads/drafts/temp folder exists
const draftsTemp = path.join(__dirname, "../uploads/drafts/temp");
if (!fs.existsSync(draftsTemp)) {
  fs.mkdirSync(draftsTemp, { recursive: true });
}

const draftStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, draftsTemp);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const uploadDraft = multer({
  storage: draftStorage,
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

module.exports = uploadDraft;

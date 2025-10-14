// middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const newName = Date.now() + '-' + file.originalname.replace(/\s+/g,'-');
    cb(null, newName);
  }
});

const upload = multer({ storage });

module.exports = upload;

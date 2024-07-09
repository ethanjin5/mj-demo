const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads'); // Directory to save the uploaded files
    },
    filename: (req, file, cb) => {
        // Use original file name
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Serve static files (e.g., HTML, CSS, JS) from the current directory
app.use(express.static(__dirname));

// Handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
    if (req.file) {
        res.json({ message: 'File uploaded successfully!', filename: req.file.filename, url: "localhost:3000/uploads/"+req.file.filename });
    } else {
        res.status(400).json({ message: 'No file uploaded.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

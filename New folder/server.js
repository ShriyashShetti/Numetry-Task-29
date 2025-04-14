const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = 5000; // Change to your desired port number

// Ensure uploads directory exists
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use(express.json());
app.use(cors());

// Serve static files (resumes) from the uploads folder
app.use('/uploads', express.static('uploads'));

// Set up file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Store files in the "uploads" folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },  // Max file size 10MB
});

// MySQL Database Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'shriyash27@', // Replace with your MySQL password
  database: 'user_profile_db', // Replace with your database name
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ', err);
    throw err; // Terminate the server if DB connection fails
  }
  console.log('Connected to MySQL Database');
});

// API to upload a resume
app.post('/users/:id/upload-resume', upload.single('resume'), (req, res) => {
  try {
    const userId = req.params.id;
    const filePath = `/uploads/${req.file.filename}`;
    const uploadedAt = new Date();

    const query = 'INSERT INTO resumes (user_id, file_path, uploaded_at) VALUES (?, ?, ?)';
    db.query(query, [userId, filePath, uploadedAt], (err, result) => {
      if (err) {
        console.error('Database error: ', err);  // Log specific error
        return res.status(500).json({ message: 'Failed to upload resume', error: err.message });
      }
      console.log('Resume uploaded successfully:', result);
      res.status(200).json({ message: 'Resume uploaded successfully', filePath });
    });
  } catch (err) {
    console.error('Error during upload process: ', err);  // Log error that occurred during upload
    res.status(500).json({ message: 'Failed to upload resume', error: err.message });
  }
});

// API to list all resumes for admin
app.get('/resumes', (req, res) => {
  const query = 'SELECT resumes.id, users.name, users.email, resumes.file_path, resumes.uploaded_at FROM resumes JOIN users ON resumes.user_id = users.id';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database query error: ', err);  // Log specific error
      return res.status(500).json({ message: 'Failed to retrieve resumes', error: err.message });
    }
    res.status(200).json(results);
  });
});

// API to download a specific resume
app.get('/resumes/:id/download', (req, res) => {
  const resumeId = req.params.id;
  const query = 'SELECT file_path FROM resumes WHERE id = ?';
  db.query(query, [resumeId], (err, result) => {
    if (err || !result.length) {
      console.error('Error or resume not found: ', err || 'No result found');  // Log specific error
      return res.status(404).json({ message: 'Resume not found', error: err ? err.message : 'No result found' });
    }
    res.download(`.${result[0].file_path}`);
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

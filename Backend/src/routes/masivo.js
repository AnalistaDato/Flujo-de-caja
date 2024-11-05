const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');

const router = express.Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
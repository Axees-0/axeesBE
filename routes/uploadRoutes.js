const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middlewares/authenticate');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/documents');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files per request
  }
});

/**
 * @swagger
 * /api/uploads:
 *   post:
 *     summary: Upload files
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               category:
 *                 type: string
 *                 description: Upload category (document, image, proof, etc.)
 *               description:
 *                 type: string
 *                 description: Optional description for the upload
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       originalName:
 *                         type: string
 *                       filename:
 *                         type: string
 *                       url:
 *                         type: string
 *                       size:
 *                         type: number
 *                       mimetype:
 *                         type: string
 *       400:
 *         description: Invalid file or upload error
 *       413:
 *         description: File too large
 */
router.post('/', authenticate, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedFiles = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      url: `/uploads/documents/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date(),
      uploadedBy: req.user.id
    }));

    // Log upload activity
    console.log(`User ${req.user.id} uploaded ${uploadedFiles.length} files`);

    res.json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      files: uploadedFiles
    });

  } catch (error) {
    console.error('File upload error:', error);
    
    // Clean up any uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          console.error('Error cleaning up file:', unlinkError);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Upload failed: ' + error.message
    });
  }
});

/**
 * @swagger
 * /api/uploads/progress/{uploadId}:
 *   get:
 *     summary: Get upload progress
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uploadId
 *         required: true
 *         schema:
 *           type: string
 *         description: Upload session ID
 *     responses:
 *       200:
 *         description: Upload progress information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 progress:
 *                   type: object
 *                   properties:
 *                     percentage:
 *                       type: number
 *                     bytesUploaded:
 *                       type: number
 *                     totalBytes:
 *                       type: number
 *                     status:
 *                       type: string
 */
router.get('/progress/:uploadId', authenticate, (req, res) => {
  const uploadId = req.params.uploadId;
  
  // In a real implementation, this would track upload progress
  // For now, return a mock response
  res.json({
    success: true,
    progress: {
      percentage: 100,
      bytesUploaded: 1024000,
      totalBytes: 1024000,
      status: 'completed'
    }
  });
});

/**
 * @swagger
 * /api/uploads/chunked/init:
 *   post:
 *     summary: Initialize chunked upload
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filename:
 *                 type: string
 *               fileSize:
 *                 type: number
 *               chunkSize:
 *                 type: number
 *               mimetype:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chunked upload initialized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 uploadId:
 *                   type: string
 *                 chunkSize:
 *                   type: number
 */
router.post('/chunked/init', authenticate, (req, res) => {
  const { filename, fileSize, chunkSize, mimetype } = req.body;
  
  // Generate upload session ID
  const uploadId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  // Store upload session info (in production, use Redis or database)
  const uploadSession = {
    uploadId,
    filename,
    fileSize,
    chunkSize: chunkSize || 1024 * 1024, // Default 1MB chunks
    mimetype,
    userId: req.user.id,
    chunksReceived: [],
    createdAt: new Date()
  };
  
  // In production, store this in Redis or database
  global.uploadSessions = global.uploadSessions || new Map();
  global.uploadSessions.set(uploadId, uploadSession);
  
  res.json({
    success: true,
    uploadId,
    chunkSize: uploadSession.chunkSize
  });
});

/**
 * @swagger
 * /api/uploads/chunked/upload:
 *   post:
 *     summary: Upload file chunk
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               chunk:
 *                 type: string
 *                 format: binary
 *               uploadId:
 *                 type: string
 *               chunkIndex:
 *                 type: number
 *     responses:
 *       200:
 *         description: Chunk uploaded successfully
 */
router.post('/chunked/upload', authenticate, upload.single('chunk'), (req, res) => {
  const { uploadId, chunkIndex } = req.body;
  
  if (!global.uploadSessions || !global.uploadSessions.has(uploadId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid upload session'
    });
  }
  
  const session = global.uploadSessions.get(uploadId);
  session.chunksReceived.push(parseInt(chunkIndex));
  
  const totalChunks = Math.ceil(session.fileSize / session.chunkSize);
  const progress = (session.chunksReceived.length / totalChunks) * 100;
  
  res.json({
    success: true,
    chunkIndex: parseInt(chunkIndex),
    progress: Math.round(progress),
    completed: session.chunksReceived.length === totalChunks
  });
});

/**
 * @swagger
 * /api/uploads/chunked/complete:
 *   post:
 *     summary: Complete chunked upload
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uploadId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Upload completed successfully
 */
router.post('/chunked/complete', authenticate, (req, res) => {
  const { uploadId } = req.body;
  
  if (!global.uploadSessions || !global.uploadSessions.has(uploadId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid upload session'
    });
  }
  
  const session = global.uploadSessions.get(uploadId);
  
  // In production, combine all chunks into final file
  const finalFilename = Date.now() + '-' + session.filename;
  const finalUrl = `/uploads/documents/${finalFilename}`;
  
  // Clean up session
  global.uploadSessions.delete(uploadId);
  
  res.json({
    success: true,
    file: {
      originalName: session.filename,
      filename: finalFilename,
      url: finalUrl,
      size: session.fileSize,
      mimetype: session.mimetype
    }
  });
});

module.exports = router;
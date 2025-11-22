const express = require('express');
const multer = require('multer');
const {uploadMedia,getAllMedia} = require('../controllers/media-controller');

const { authenticateRequest} = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB file size limit
}).single('file');

router.post('/upload', authenticateRequest, (req, res, next) => {
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            logger.error('Multer Error during file upload:', err);
            return res.status(400).json({ success: false, message: err.message, stack: err.stack });
        } else if (err) {
            logger.error('Unknown Error during file upload:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error', stack: err.stack });
        }
        if (!req.file) {
            logger.warn('No file provided in the upload request');
            return res.status(400).json({ success: false, message: 'No file provided' });
        }
        next();
    });
}, uploadMedia);
router.get('/all', authenticateRequest, uploadMedia);

module.exports = router;
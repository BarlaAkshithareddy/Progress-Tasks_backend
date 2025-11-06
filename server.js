const express = require('express');
const cors = require('cors');
const multer = require('multer');
const AWS = require('aws-sdk');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.REGION_NAME || 'us-east-1'
});

const BUCKET_NAME = process.env.BUCKET_NAME;

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const params = {
            Bucket: BUCKET_NAME,
            Key: req.file.originalname,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        };

        // Upload to S3
        await s3.upload(params).promise();

        // Generate presigned URL (valid for 1 hour)
        const fileUrl = s3.getSignedUrl('getObject', {
            Bucket: BUCKET_NAME,
            Key: req.file.originalname,
            Expires: 3600
        });

        res.json({
            success: true,
            file_url: fileUrl,
            filename: req.file.originalname
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});
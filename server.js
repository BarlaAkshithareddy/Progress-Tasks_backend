const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Configure AWS S3 v3
const s3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    region: process.env.REGION_NAME || 'us-east-1',
    forcePathStyle: false,
    useAccelerateEndpoint: false
});

const BUCKET_NAME = process.env.BUCKET_NAME;

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        console.log('Upload request received');
        console.log('Environment check:', {
            hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
            hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
            bucketName: process.env.BUCKET_NAME,
            region: process.env.REGION_NAME
        });

        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        if (!BUCKET_NAME) {
            return res.status(500).json({ error: 'Bucket name not configured' });
        }

        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            return res.status(500).json({ error: 'AWS credentials not configured' });
        }

        const putCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: req.file.originalname,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        });

        // Upload to S3
        await s3Client.send(putCommand);

        // Generate presigned URL (valid for 1 hour)
        const getCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: req.file.originalname
        });
        
        const fileUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

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
    console.log('Environment variables loaded:', {
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
        bucketName: process.env.BUCKET_NAME,
        region: process.env.REGION_NAME
    });
});
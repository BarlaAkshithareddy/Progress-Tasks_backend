# Flask File Uploader Backend

## Setup Instructions

### 1. Create S3 Bucket
```bash
# Using AWS CLI
aws s3 mb s3://varun-smart-bucket --region us-east-1
# No need to set public ACL - using presigned URLs instead
```

### 2. IAM Policy Setup
- Go to AWS IAM Console
- Create new user with programmatic access
- Attach policy: `AmazonS3FullAccess`
- Save Access Key ID and Secret Access Key

### 3. Local Development
```bash
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your AWS credentials
python app.py
```

### 4. Deploy Options

#### Option A: Render
1. Connect GitHub repo to Render
2. Set environment variables in Render dashboard
3. Deploy as Web Service

#### Option B: AWS Elastic Beanstalk
```bash
pip install awsebcli
eb init
eb create
eb deploy
```

## API Endpoints
- `POST /upload` - Upload file to S3
- `GET /health` - Health check
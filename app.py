from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
from botocore.exceptions import NoCredentialsError
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# AWS S3 Configuration
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('REGION_NAME', 'us-east-1')
)

BUCKET_NAME = os.getenv('BUCKET_NAME')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Upload file to S3 bucket and return public URL"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Upload to S3 (without public ACL)
        s3_client.upload_fileobj(
            file,
            BUCKET_NAME,
            file.filename
        )
        
        # Generate presigned URL (valid for 1 hour)
        file_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': BUCKET_NAME, 'Key': file.filename},
            ExpiresIn=3600
        )
        
        return jsonify({
            'success': True,
            'file_url': file_url,
            'filename': file.filename
        })
        
    except NoCredentialsError:
        return jsonify({'error': 'AWS credentials not found'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
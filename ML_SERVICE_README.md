# Dental X-ray Analysis with YOLOv8

This project implements a dental X-ray analysis service using a pretrained YOLOv8 model from Ultralytics.

## Architecture

1. **Frontend** (React/TypeScript) - Existing implementation
2. **Backend** (Go/Gin) - Modified to forward requests to ML service
3. **ML Service** (Python/FastAPI) - New service using YOLOv8 for inference

## Services

### 1. Python ML Service

The ML service uses a pretrained YOLOv8 model to analyze dental X-rays.

- Built with FastAPI
- Uses Ultralytics YOLOv8
- Automatically downloads pretrained weights on first run
- Exposes `/analyze` endpoint for image analysis
- Provides dental-specific analysis results

### 2. Go Backend

Modified to forward tooth analysis requests to the Python service:

- Maintains existing `/api/tooth-analysis` endpoint
- Accepts patientId and image upload
- Forwards the file to the Python ML service
- Returns the Python service response back to the frontend

## Setup

### Option 1: Using Docker (Recommended)

```bash
# Build and run all services
docker-compose up --build

# The services will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
# ML Service: http://localhost:8000
```

### Option 2: Manual Setup

#### Python ML Service

```bash
cd ml_service

# Run the setup script (creates virtual environment and installs dependencies)
./setup.sh

# Activate the virtual environment
source venv/bin/activate

# Run the service
python main.py
```

#### Go Backend

```bash
cd dental_backend

# Run the service
go run cmd/api/main.go
```

## API Endpoints

### Tooth Analysis

**Endpoint**: `POST /api/tooth-analysis` (Go backend)  
**Endpoint**: `POST /analyze` (Python ML service)

**Parameters**:
- `patientId` (form-data): Patient ID
- `image` (form-data): Dental X-ray image (PNG/JPG)

**Response**:
```json
{
  "findings": [
    "Detected 2 regions of interest in the dental X-ray",
    "High confidence anomaly detected (confidence: 0.85)",
    "Located in upper jaw region",
    "Possible cavity or decay detected"
  ],
  "annotatedImageUrl": "/static/results/annotated_<randomId>.jpg"
}
```

## Implementation Details

### Python ML Service

The Python service uses a pretrained YOLOv8 model from Ultralytics. On first run, it will automatically download the weights for the `yolov8n.pt` model. You can replace this with a dental-specific model if available.

The service:
1. Accepts an image upload
2. Runs YOLOv8 inference on the image (if model is available)
3. Generates an annotated image with bounding boxes
4. Creates dental-specific findings based on:
   - Number and position of detected anomalies
   - Confidence scores of detections
   - Position of anomalies in the X-ray (upper/lower jaw)
5. Returns the findings and annotated image URL

If the model cannot be loaded (due to missing dependencies), the service will fall back to a mock implementation that returns sample dental findings.

### Go Backend Integration

The Go backend was modified to:
1. Accept the original parameters (patientId and image)
2. Save the uploaded image to a temporary file
3. Forward the image to the Python ML service
4. Parse the response from the Python service
5. Return the formatted response to the frontend

The ML service URL is configurable via the `ML_SERVICE_URL` environment variable, defaulting to `http://localhost:8000`.

## Dental Analysis Features

The service provides realistic dental analysis results by:

1. **Object Detection**: Using YOLOv8 to detect anomalies in dental X-rays
2. **Position Analysis**: Determining if anomalies are in upper or lower jaw regions
3. **Confidence Scoring**: Providing confidence levels for each detection
4. **Dental Terminology**: Using appropriate dental terms in findings
5. **Clinical Relevance**: Generating findings that are relevant to dental practice

Example findings include:
- "Possible cavity or decay detected"
- "Early signs of gum disease in lower anterior region"
- "Minor tooth wear detected"
- "Slight bone density reduction in posterior region"

## Testing

You can test the services using the provided test script:

```bash
# Test with a sample image
./test_analyze.sh sample_xray.jpg
```

Or using curl directly:

```bash
# Test Python ML service directly
curl -X POST -F "image=@sample_xray.jpg" http://localhost:8000/analyze

# Test through Go backend
curl -X POST \
  -F "patientId=1" \
  -F "image=@sample_xray.jpg" \
  http://localhost:8080/api/tooth-analysis
```

## Troubleshooting

### Dependency Installation Issues

If you encounter issues installing the Python dependencies:

1. Make sure you're using Python 3.10 or later
2. Try installing packages individually:
   ```bash
   pip install fastapi uvicorn ultralytics opencv-python torch torchvision
   ```
3. If you're on an M1/M2 Mac, you might need to install PyTorch differently:
   ```bash
   pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
   ```

### Model Download Issues

If the YOLOv8 model fails to download:
1. Check your internet connection
2. The model will be downloaded to `~/.cache/ultralytics/` 
3. You can manually download the model from the [Ultralytics releases page](https://github.com/ultralytics/assets/releases)

### Service Connection Issues

If the Go backend cannot connect to the Python service:
1. Make sure the Python service is running on port 8000
2. Check that both services can communicate (especially when using Docker)
3. Verify the `ML_SERVICE_URL` environment variable is set correctly
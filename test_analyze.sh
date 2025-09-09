#!/bin/bash

# Test script for the tooth analysis endpoint
# Usage: ./test_analyze.sh <image_file_path>

if [ $# -eq 0 ]; then
    echo "Usage: $0 <image_file_path>"
    echo "Example: $0 sample_xray.jpg"
    exit 1
fi

IMAGE_FILE=$1

if [ ! -f "$IMAGE_FILE" ]; then
    echo "Error: Image file '$IMAGE_FILE' not found"
    exit 1
fi

echo "Testing tooth analysis with image: $IMAGE_FILE"

# Test the Python ML service directly
echo "1. Testing Python ML service directly..."
curl -X POST \
  -F "image=@$IMAGE_FILE" \
  http://localhost:8000/analyze

echo -e "\n\n2. Testing through Go backend..."
# Test through the Go backend (assuming it's running)
curl -X POST \
  -F "patientId=1" \
  -F "image=@$IMAGE_FILE" \
  http://localhost:8080/api/tooth-analysis

echo -e "\n\nTest completed."
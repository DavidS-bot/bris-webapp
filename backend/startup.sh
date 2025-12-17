#!/bin/bash
# BRIS Backend Startup Script
# Downloads vectordb on first run if not present

VECTORDB_PATH="/app/vectordb"
VECTORDB_URL="https://github.com/DavidS-bot/bris-webapp/releases/download/v1.0.0/vectordb.tar.gz"

echo "=== BRIS Backend Starting ==="

# Check if vectordb exists and has data
if [ ! -d "$VECTORDB_PATH/chroma.sqlite3" ] && [ ! -f "$VECTORDB_PATH/chroma.sqlite3" ]; then
    echo "VectorDB not found. Downloading from GitHub Releases..."
    echo "This will take a few minutes (739MB)..."

    # Download with progress
    curl -L --fail --retry 3 --retry-delay 10 -o /tmp/vectordb.tar.gz "$VECTORDB_URL"

    if [ $? -eq 0 ]; then
        echo "Download complete. Extracting..."
        tar -xzf /tmp/vectordb.tar.gz -C /app/
        rm /tmp/vectordb.tar.gz
        echo "VectorDB ready! (58,466 chunks)"
    else
        echo "ERROR: Failed to download vectordb"
        echo "The API will start but RAG will be empty"
    fi
else
    echo "VectorDB found. Skipping download."
    ls -la "$VECTORDB_PATH"
fi

echo "=== Starting uvicorn ==="
exec uvicorn app.main:app --host 0.0.0.0 --port 8000

#!/bin/bash
# BRIS Backend Startup Script
# Downloads vectordb on first run or when version changes

VECTORDB_PATH="/app/vectordb"
VECTORDB_VERSION="v1.5.0"
VECTORDB_URL="https://github.com/DavidS-bot/bris-webapp/releases/download/${VECTORDB_VERSION}/vectordb.tar.gz"
VERSION_FILE="$VECTORDB_PATH/.version"

echo "=== BRIS Backend Starting ==="
echo "Expected VectorDB version: $VECTORDB_VERSION"
echo "Checking vectordb at: $VECTORDB_PATH"

# Check current version
CURRENT_VERSION=""
if [ -f "$VERSION_FILE" ]; then
    CURRENT_VERSION=$(cat "$VERSION_FILE")
fi
echo "Current version: ${CURRENT_VERSION:-none}"

# Download if missing or version mismatch
if [ ! -f "$VECTORDB_PATH/chroma.sqlite3" ] || [ "$CURRENT_VERSION" != "$VECTORDB_VERSION" ]; then
    echo "VectorDB needs update. Downloading $VECTORDB_VERSION from GitHub Releases..."
    echo "This will take a few minutes (1.2GB)..."

    # Remove old vectordb
    rm -rf "$VECTORDB_PATH"
    mkdir -p "$VECTORDB_PATH"

    # Download with progress
    curl -L --fail --retry 3 --retry-delay 10 -o /tmp/vectordb.tar.gz "$VECTORDB_URL"

    if [ $? -eq 0 ]; then
        echo "Download complete. Extracting..."
        tar -xzf /tmp/vectordb.tar.gz -C /app/
        rm /tmp/vectordb.tar.gz
        echo "$VECTORDB_VERSION" > "$VERSION_FILE"
        echo "VectorDB ready! (91,871 chunks - $VECTORDB_VERSION)"
    else
        echo "ERROR: Failed to download vectordb"
        echo "The API will start but RAG will be empty"
    fi
else
    echo "VectorDB $VECTORDB_VERSION found. Skipping download."
    ls -la "$VECTORDB_PATH"
fi

echo "=== Starting uvicorn ==="
exec uvicorn app.main:app --host 0.0.0.0 --port 8000

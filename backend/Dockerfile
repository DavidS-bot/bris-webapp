# BRIS Backend Dockerfile for Render

FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directory for ChromaDB
RUN mkdir -p /app/vectordb

# Download vectordb from GitHub Releases (739MB)
RUN echo "Downloading vectordb from GitHub Releases..." && \
    curl -L --fail --retry 3 --retry-delay 5 -o /tmp/vectordb.tar.gz \
    "https://github.com/DavidS-bot/bris-webapp/releases/download/v1.0.0/vectordb.tar.gz" && \
    ls -lh /tmp/vectordb.tar.gz

# Extract vectordb
RUN echo "Extracting vectordb (58,466 chunks)..." && \
    tar -xzf /tmp/vectordb.tar.gz -C /app/ && \
    rm /tmp/vectordb.tar.gz && \
    ls -la /app/vectordb && \
    echo "VectorDB ready!"

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

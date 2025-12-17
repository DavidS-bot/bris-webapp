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

# Create directory for ChromaDB (will be mounted as Render Disk)
RUN mkdir -p /app/vectordb

# Copy startup script and make executable
COPY startup.sh /app/startup.sh
RUN chmod +x /app/startup.sh

# Expose port
EXPOSE 8000

# Health check (longer start period to allow vectordb download)
HEALTHCHECK --interval=30s --timeout=30s --start-period=300s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run startup script (downloads vectordb if needed, then starts uvicorn)
CMD ["/app/startup.sh"]

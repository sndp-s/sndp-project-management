# Base image: Python 3.13 slim
FROM python:3.13-slim

# Set work directory
WORKDIR /app

# Install system dependencies (needed for psycopg2, etc.)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.cargo/bin:$PATH"

# Copy project files
COPY pyproject.toml uv.lock ./
COPY . .

# Install dependencies using uv
RUN uv sync --frozen --no-cache

# Collect static files (for admin)
RUN uv run python manage.py collectstatic --noinput || true

# Default port
ENV PORT=8000

# Run Django ASGI app with Uvicorn
CMD ["uv", "run", "uvicorn", "backend.asgi:application", "--host", "0.0.0.0", "--port", "8000"]

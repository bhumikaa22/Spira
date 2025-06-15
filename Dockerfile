
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies, including Java
RUN apt-get update && apt-get install -y default-jdk && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .

# Install Python libraries
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "app:app"]
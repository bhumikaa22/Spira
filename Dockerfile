FROM python:3.10-slim
WORKDIR /app

# Install Java Development Kit (JDK), which includes the JRE
RUN apt-get update && apt-get install -y default-jdk && rm -rf /var/lib/apt/lists/*

# Copy the requirements file first to leverage Docker's layer caching
COPY requirements.txt .

# Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code into the container
COPY . .

EXPOSE 10000
CMD ["gunicorn", "--workers", "3", "--bind", "0.0.0.0:10000", "app:app"]
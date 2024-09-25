# Use Python base image
FROM python:3.9-slim

# Set working directory
WORKDIR /flashcards-service

# Copy requirements and install
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

# Copy the rest of the app
COPY . .

# Expose the port the service runs on
EXPOSE 5001

# Command to run the service
CMD ["python", "/src/app.py"]

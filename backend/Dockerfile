FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all source code and .env if present
COPY . .

EXPOSE 8000

# For production, do NOT use --reload
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
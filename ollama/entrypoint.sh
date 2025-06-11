#!/bin/bash

# Start Ollama server in the background
ollama serve &

# Wait for Ollama server to be ready
echo "[bd_ollama]: Waiting for Ollama server to start..."
while ! curl -s http://localhost:11434/api/tags > /dev/null; do
  sleep 1
done

echo "[bd_ollama]: Ollama server is ready!"

# Pull models if they don't exist
MODELS=("gemma3:1b" "llama3.2:1b")

for model in "${MODELS[@]}"; do
  echo "[bd_ollama]: Checking if model $model exists..."
  if ! ollama list | grep -q "$model"; then
    echo "[bd_ollama]: Pulling model: $model"
    ollama pull "$model"
  else
    echo "[bd_ollama]: Model $model already exists"
  fi
done

echo "[bd_ollama]: All models are ready!"

# Preload gemma into the GPU memory
curl http://localhost:11434/api/generate -d '{
  "model": "gemma3:1b",
  "prompt": ""
}'

# Keep the container running
wait
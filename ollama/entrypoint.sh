#!/bin/bash

# Start Ollama server in the background
ollama serve &

# Wait for Ollama server to be ready
echo "Waiting for Ollama server to start..."
while ! curl -s http://localhost:11434/api/tags > /dev/null; do
  sleep 1
done

echo "Ollama server is ready!"

# Pull models if they don't exist
MODELS=("qwen2.5-coder:1.5b")

for model in "${MODELS[@]}"; do
  echo "Checking if model $model exists..."
  if ! ollama list | grep -q "$model"; then
    echo "Pulling model: $model"
    ollama pull "$model"
  else
    echo "Model $model already exists"
  fi
done

echo "All models are ready!"

# Keep the container running
wait
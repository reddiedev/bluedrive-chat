### LLM Model: Qwen2.5-coder


### LLM Provider: Ollama
1. Deploy Ollama via docker-compose using this reference: [mythrantic/ollama-docker](https://github.com/mythrantic/ollama-docker)
2. I configured `ollama/entrypoint.sh` to automatically download the required model if it is not already present for easier setup
3. In order to check if the deployment is correct:
```bash
docker compose up --build ollama
```
```bash
curl http://localhost:11435/api/generate \
  -d '{
    "model": "qwen2.5-coder:1.5b",
    "prompt": "What is the capital of France?"
  }' \
  -H "Content-Type: application/json"
```

Expected output:
```json
{
  "model": "qwen2.5-coder:1.5b",
  "response": "The capital of France is Paris.",
  "done": true
}
```


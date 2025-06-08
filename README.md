### Ollama

1. Deploy following this guide https://github.com/mythrantic/ollama-docker
2. Testing using 
```bash
curl http://localhost:11435
```
expected output:
```
Ollama is running
```

3. Install model
```bash
docker exec -it bd_ollama ollama pull qwen2.5-coder:1.5b
```
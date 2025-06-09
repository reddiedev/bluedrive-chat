# Bard
__Bard__ is an offline, full-stack AI chatbot application designed as a showcase for AI engineering skills. It demonstrates the integration of a __local__ Large Language Model (LLM) with a modern web frontend, robust backend, and _persistent_ chat memory, all orchestrated with best practices in software engineering.

## Features
- Modern Frontend - Built with React (Vite), TanStack Start, TailwindCSS, and Shadcn UI.
- Offline - Secure and Local LLM via Ollama
- Persistent Chat - Session Handling and Conversation History via langchain-postgres
- Chat Streaming - Chat completions are streamed from server for UX
- Fully Containerized - Easy to setup and run with Docker Compose

## Tech Stack
- Database: Postgres (Dockerized)
- LLM: Ollama (via LangChain)
- Backend: FastAPI (Python)
- Frontend: React (Vite, TanStack Start), TailwindCSS, Shadcn UI
- Deployment: Docker & Docker Compose


## Getting Started
> Project was tested on Ubuntu 24.04 LTS with a x64 CPU, and Nvidia GPU

### Requirements

- Docker 
- Docker Container Toolkit
- Python 3.12
- Node.js 22

### Quickstart
1. Clone the repository
```bash
git clone https://github.com/reddiedev/bluedrive-chat 
cd bluedrive-chat
```
2. Load the default environment variables 
```bash
cp .env.example .env
cp .env.example frontend/.env
```
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

### Backend: FastAPI


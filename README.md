# Bard
__Bard__ is an offline, full-stack AI chatbot application designed as a showcase for AI engineering skills. It demonstrates the integration of a __local__ Large Language Model (LLM) with a modern web frontend, robust backend, and _persistent_ chat memory, all orchestrated with best practices in software engineering.

## **Features**
- 💻 **Modern Frontend** – Built with React (Vite), TanStack Start, TailwindCSS, and Shadcn UI.
- 🔒 **Offline** – Secure and Local LLM via Ollama
- 💾 **Persistent Chat** – Session Handling and Conversation History via langchain-postgres
- 🚀 **Chat Streaming** – Chat completions are streamed from server for UX
- 🐳 **Fully Containerized** – Easy to setup and run with Docker Compose

## Tech Stack
- **Database**: Postgres (Dockerized)
- **LLM**: Ollama (via LangChain)
- **Backend**: FastAPI (Python)
- **Frontend**: React (Vite, TanStack Start), TailwindCSS, Shadcn UI
- **Deployment**: Docker & Docker Compose


## Getting Started
> [!NOTE]
> Project was tested on Ubuntu 24.04 LTS with a x64 CPU, and Nvidia GPU

### Requirements

- Docker 
- Docker Container Toolkit
- Python 3.12
- Node.js 22

> [!Important]
> Please modify the `ollama` service in `docker-compose.yml` if you do not have an Nvidia gpu

### Quickstart via Docker
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
3. Start the application stack
```bash
docker compose up --build
```
4. On your browser, you can view the app at [http://localhost:3000](http://localhost:3000)

> [!CAUTION]
> The first run will take some time, as the models are being downloaded for Ollama


### Building Locally
You can run the `database` and `ollama` services stand-alone for local testing
```bash
docker compose up -d --build database ollama
```

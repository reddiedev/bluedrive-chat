# Bard
__Bard__ is an offline, full-stack AI chatbot application designed as a showcase for AI engineering skills. It demonstrates the integration of a __local__ Large Language Model (LLM) with a modern web frontend, robust backend, and _persistent_ chat memory, all orchestrated with best practices in software engineering.

![Banner](/media/banner.png?raw=true)

## **Features**
![Demo](https://cdn.reddie.dev/bard-demo.mp4)

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
> The project was develoepd and tested on a machine running Ubuntu 24.04 LTS with a x64 Ryzen 5 CPU, 16 GB RAM, and Nvidia GPU

### Requirements

- [Docker](https://docs.docker.com/engine/install/ubuntu/) 
- [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)
- [Python](https://www.python.org/)
- [Node.js](https://nodejs.org/en)

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
#### FastAPI Backend
1. Install Python 3.12 on your Local machine
```bash
python --version
>>> Python 3.12.7
```
For managing python instances, I usually prefer using a virtual env using [uv](https://docs.astral.sh/uv/getting-started/installation/#standalone-installer)
```bash
cd backend
uv venv 
source .venv/bin/activate
uv pip install -r requirements.txt
```

2. Install requirements then run the `main.py` app via Uvicorn
```bash
cd backend
pip install -r requirements.txt

uv run main.py
python main.py
python3 main.py
```

#### React Frontend
1. Install `Node.js v20` and [pnpm](https://pnpm.io/) on your Local machine
```bash
node -v
>>> v20.18.0

npm install -g pnpm
pnpm setup # if you haven't used pnpm before
```
For managing Node environments, I prefer to use it via [nvm](https://github.com/nvm-sh/nvm)
```bash
nvm i 20
nvm use 20
```
2. Install the requirements and use the .env example
```bash
cp .env frontend/.env
cd frontend
pnpm install --frozen-lockfile
```

3. Run the app
```bash
pnpm run dev

pnpm run build
pnpm run start
```
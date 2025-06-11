FROM node:22-alpine

RUN apk update && apk add curl

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN npm install -g corepack@latest
RUN corepack enable pnpm && corepack prepare pnpm@latest --activate && pnpm i --frozen-lockfile

COPY . .

ARG VITE_BACKEND_BASE_URL
ENV VITE_BACKEND_BASE_URL=${VITE_BACKEND_BASE_URL}

RUN pnpm run build


ENV NODE_ENV=production

EXPOSE 3000

ENV PORT=3000

CMD ["node", "-r", "dotenv/config", ".output/server/index.mjs"]
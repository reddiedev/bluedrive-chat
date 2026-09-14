FROM node:22-alpine

RUN apk update && apk add curl

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN npm install -g corepack@latest
RUN corepack enable pnpm && corepack prepare pnpm@9 --activate && pnpm i --frozen-lockfile

COPY . .

# Vite inlines VITE_* at build time, so they must be present when building.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_KEY=$VITE_SUPABASE_KEY

RUN pnpm run build


ENV NODE_ENV=production

EXPOSE 3000

ENV PORT=3000

CMD ["node", "-r", "dotenv/config", ".output/server/index.mjs"]
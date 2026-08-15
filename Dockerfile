FROM node:22-bookworm-slim

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma

ARG DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ARG DIRECT_URL=postgresql://dummy:dummy@localhost:5432/dummy

ENV DATABASE_URL=$DATABASE_URL
ENV DIRECT_URL=$DIRECT_URL

RUN npm ci

COPY . .

ARG NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true
ENV NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=$NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS

RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "run", "start", "--", "-H", "0.0.0.0"]

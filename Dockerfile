FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    NEXT_PUBLIC_API_URL=""

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]

FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma on Alpine Linux
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate
RUN npm run build

EXPOSE 4001

CMD ["sh", "-c", "npx prisma db push && node dist/app.js"]

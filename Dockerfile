FROM node:25-alpine3.22

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY ecosystem.config.js ./
COPY .env.production ./
COPY ./src ./src
COPY ./openapi ./openapi

RUN apk add python3
RUN apk update
RUN apk upgrade
RUN apk add --no-cache ffmpeg
RUN npm install pm2 -g
RUN npm install
RUN npm run build

EXPOSE 5500

CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]

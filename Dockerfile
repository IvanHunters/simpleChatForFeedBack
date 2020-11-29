FROM node:12

RUN npm install --silent socket.io
RUN npm dedupe
WORKDIR /app

EXPOSE 8080

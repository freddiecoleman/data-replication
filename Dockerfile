FROM node:8.9.1-alpine

ADD . /app
WORKDIR /app

RUN npm i -g pm2 nodemon
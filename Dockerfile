FROM node:19.2-alpine

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

CMD npm start

EXPOSE 3003

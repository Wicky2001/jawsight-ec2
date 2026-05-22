FROM node:20-alpine

WORKDIR /app

COPY sequelizer/package.json ./

RUN npm install

COPY sequelizer/ ./


CMD ["npm", "run", "migrate"]
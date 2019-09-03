FROM node:12.9.1-stretch
RUN apt-get update
RUN apt-get -y upgrade
RUN apt-get install python -y
WORKDIR /app
COPY package.json .
RUN npm install
COPY config/ ./config
COPY lib ./lib
COPY logger ./logger
COPY tools ./tools
COPY index.js .
CMD ["node","index.js"]


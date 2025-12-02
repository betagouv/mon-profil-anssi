ARG NODE_VERSION=latest

FROM docker.io/node:$NODE_VERSION

WORKDIR /usr/src/app
COPY package.json package-lock.json /usr/src/app/
RUN npm ci

COPY . /usr/src/app
EXPOSE 3001
CMD ["npm", "run", "start:local"]

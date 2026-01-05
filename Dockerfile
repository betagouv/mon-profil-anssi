ARG NODE_VERSION=latest

FROM docker.io/node:$NODE_VERSION

WORKDIR /usr/src/app
COPY package.json package-lock.json /usr/src/app/
RUN npm install -g "$(jq -r '.packageManager' package.json)"
RUN pnpm install

COPY . /usr/src/app
EXPOSE 3001
CMD ["pnpm", "run", "start:local"]

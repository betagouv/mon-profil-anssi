FROM node:23

RUN npm install -g npm

WORKDIR /usr/src/app
COPY package.json package-lock.json /usr/src/app/
RUN npm install

COPY . /usr/src/app
EXPOSE 3001
CMD ["npm", "run", "start:local"]

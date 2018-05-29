#FROM node:boron

FROM mhart/alpine-node:8.9
RUN apk add --no-cache make gcc g++ python

# Create app directory
WORKDIR /usr/src/app

RUN chgrp -R 0 /usr/src/app && \
    chmod -R g=u /usr/src/app

USER 1001

# Install app dependencies
# COPY package.json .
# For npm@5 or later, copy package-lock.json as well
COPY package.json package-lock.json ./

RUN yarn global add @angular/cli
RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

RUN mkdir dist 

RUN echo "export const environment = { \
  production: false, \
  api: 'https://ws.spraakbanken.gu.se/ws/strixlabb', \
  auth: 'https://sp.spraakbanken.gu.se/auth' \
};" > src/environments/environment.docker.ts

RUN ng build --environment=docker
CMD [ "ng", "serve", "-H", "0.0.0.0" ]



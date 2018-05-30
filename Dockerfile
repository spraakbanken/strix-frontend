#FROM node:boron

FROM mhart/alpine-node:8.9
RUN apk add --no-cache make gcc g++ python


ENV HOME=/home \
    NPM_CONFIG_PREFIX=/home/npm \
    APP_ROOT=/home/app-root \
    PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/home/npm/bin:/home/app-root/node_modules/.bin


WORKDIR ${APP_ROOT}

COPY . .

# RUN addgroup -S app && adduser -S -G app app
RUN addgroup -S 1001 && adduser -S -G 1001 1001

RUN mkdir -p ${APP_ROOT} && \
    mkdir -p ${NPM_CONFIG_PREFIX} && \
    chown -R 1001:0 ${HOME} && \
    chmod -R ug+rwx ${HOME} && \
    mkdir /tmp/logs && \
    chown -R 1001:0 /tmp/logs && \
    chmod -R ug+rwx /tmp/logs

EXPOSE 3000

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



RUN echo "export const environment = { \
  production: false, \
  api: 'https://ws.spraakbanken.gu.se/ws/strixlabb', \
  auth: 'https://sp.spraakbanken.gu.se/auth' \
};" > src/environments/environment.docker.ts

RUN ng build --environment=docker
CMD [ "ng", "serve", "--public-host", "0.0.0.0" ]

# RUN /bin/sh

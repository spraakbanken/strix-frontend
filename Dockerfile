#FROM node:boron

FROM mhart/alpine-node:8.9
RUN apk add --no-cache make gcc g++ python

# Create app directory
WORKDIR /usr/src/app

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

RUN ng build --configuration=docker
CMD [ "ng", "serve", "-H", "0.0.0.0" ]



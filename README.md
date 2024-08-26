# Strix frontend

[![Build Status](https://travis-ci.org/spraakbanken/strix-frontend.svg?branch=master)](https://travis-ci.org/spraakbanken/strix-frontend)

[**Strix**](https://spraakbanken.gu.se/strix) is [Språkbanken](https://spraakbanken.gu.se/)'s tool for document-centric corpus linguistics.

The frontend is an Angular 6 web application which uses [strix-backend](https://github.com/spraakbanken/strix-backend) over HTTP.

## Local development
Run `npm install` to install the packages.

Run `export NODE_OPTIONS=--openssl-legacy-provider` and then run the next command

Run Strix locally using `ng serve` and check using `localhost:4200` or `strix.spraakbanken.gu.se:4200`

## Build

Run `ng build --configuration=<ENV> where you replace ENV with your environment file. 

## Tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.
Or use `docker-compose up --build` to run the tests.

Some of the end-to-end test specs fail randomly for unknown reasons. They are marked with in-code comments. If they fail, you might want to just try again. Specs that fail most of the time are set to pending (using `xit`).

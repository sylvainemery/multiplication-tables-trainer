
'use strict';

process.env.DEBUG = 'actions-on-google:*';
const { ApiAiApp } = require('actions-on-google');
const functions = require('firebase-functions');

/** API.AI Actions {@link https://api.ai/docs/actions-and-parameters#actions} */
const Actions = {
  DEFAULT_WELCOME: 'input.welcome'
};

/**
 * Say hello
 * @param {ApiAiApp} app ApiAiApp instance
 * @return {void}
 */
const sayHello = app => {
  app.tell('Hello, World!');
};

/** @type {Map<string, function(ApiAiApp): void>} */
const actionMap = new Map();
actionMap.set(Actions.DEFAULT_WELCOME, sayHello);

/**
 * The entry point to handle a http request
 * @param {Request} request An Express like Request object of the HTTP request
 * @param {Response} response An Express like Response object to send back data
 */
const multiplicationTablesTrainer = functions.https.onRequest((request, response) => {
  const app = new ApiAiApp({ request, response });
  console.log(`Request headers: ${JSON.stringify(request.headers)}`);
  console.log(`Request body: ${JSON.stringify(request.body)}`);
  app.handleRequest(actionMap);
});

module.exports = {
  multiplicationTablesTrainer
};

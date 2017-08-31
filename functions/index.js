
'use strict';

process.env.DEBUG = 'actions-on-google:*';
const { ApiAiApp } = require('actions-on-google');
const functions = require('firebase-functions');

/** API.AI Actions {@link https://api.ai/docs/actions-and-parameters#actions} */
const Actions = {
  DEFAULT_WELCOME: 'input.welcome',
  CHECK_GUESS: 'check_guess',
  QUIT_GAME: 'quit_game'
};

/** API.AI Arguments */
const Args = {
  GUESS: 'guess'
};

/**
 * Get a random number within a range
 * @param {int} min min value
 * @param {int} max max value
 * @return {int} a random number within the range
 */
const getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Start the game
 * @param {ApiAiApp} app ApiAiApp instance
 * @return {void}
 */
const startGame = app => {
  let prompt = `Hello!`;
  app.data.multiplicand = getRandomNumber(2, 9);
  app.data.multiplier = getRandomNumber(1, 10);
  app.ask(`${prompt} What's ${app.data.multiplicand} by ${app.data.multiplier}?`);
};

/**
 * Verify the answer is correct
 * @param {ApiAiApp} app ApiAiApp instance
 * @return {void}
 */
const checkGuess = app => {
  let goodAnswer = app.data.multiplicand * app.data.multiplier;
  let guess = parseInt(app.getArgument(Args.GUESS));
  let diff = Math.abs(guess - goodAnswer);
  let prompt = ``;
  if (diff === 0) {
    prompt = `Correct!`;
  } else {
    prompt = `Wrong...`;
  }
  prompt = `${prompt} ${app.data.multiplicand} by ${app.data.multiplier} is ${goodAnswer}.`;
  app.data.multiplicand = getRandomNumber(2, 9);
  app.data.multiplier = getRandomNumber(1, 10);
  prompt = `${prompt} Now, what's ${app.data.multiplicand} by ${app.data.multiplier}?`;
  app.ask(prompt);
};

/**
 * Say goodbye
 * @param {ApiAiApp} app ApiAiApp instance
 * @return {void}
 */
const quitGame = app => {
  app.tell(`OK, see you later!`);
};

/** @type {Map<string, function(ApiAiApp): void>} */
const actionMap = new Map();
actionMap.set(Actions.DEFAULT_WELCOME, startGame);
actionMap.set(Actions.CHECK_GUESS, checkGuess);
actionMap.set(Actions.QUIT_GAME, quitGame);

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

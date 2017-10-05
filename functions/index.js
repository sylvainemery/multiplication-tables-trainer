'use strict';

process.env.DEBUG = 'actions-on-google:*';
const {
  ApiAiApp
} = require('actions-on-google');
const functions = require('firebase-functions');
const {
  sprintf
} = require('sprintf-js');
const i18n = require('i18n');
const path = require('path');

/** API.AI Actions {@link https://api.ai/docs/actions-and-parameters#actions} */
const Actions = {
  DEFAULT_WELCOME: 'input.welcome',
  CHECK_GUESS: 'check_guess',
  PASS_QUESTION: 'pass_question',
  REPEAT_QUESTION: 'repeat_question',
  QUIT_GAME: 'quit_game'
};

/** API.AI Arguments */
const Args = {
  GUESS: 'guess'
};

/**
 * @template T
 * @param {Array<T>} array The array to get a random value from
 */
const getRandomValue = array => array[Math.floor(Math.random() * array.length)];

/**
 * Get a random number within a range
 * @param {int} min min value
 * @param {int} max max value
 * @return {int} a random number within the range
 */
const getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/** @param {Array<string>} messages The messages to concat */
const concat = messages => messages.map(message => message.trim()).join(' ');

/**
 * Start the game
 * @param {ApiAiApp} app ApiAiApp instance
 * @return {void}
 */
const startGame = app => {
  const response = [getRandomValue(i18n.__('GREETING_PROMPTS'))];
  app.data.multiplicand = getRandomNumber(2, 9);
  app.data.multiplier = getRandomNumber(1, 10);
  app.data.currentStreak = 0;
  app.data.bestStreak = 0;
  response.push(sprintf(getRandomValue(i18n.__('MULTIPLICATION_PROMPTS')),
    app.data.multiplicand, app.data.multiplier));
  app.ask(concat(response));
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
  let response = [];
  if (diff === 0) {
    app.data.currentStreak++;
    if (app.data.bestStreak < app.data.currentStreak) {
      app.data.bestStreak = app.data.currentStreak;
    }
    response.push(getRandomValue(i18n.__('CORRECT_GUESS_PROMPTS')));
    if (app.data.currentStreak >= 3) {
      response.push(sprintf(getRandomValue(i18n.__('CURRENT_STREAK_PROMPTS')),
        app.data.currentStreak));
    }
  } else {
    app.data.currentStreak = 0;
    response.push(getRandomValue(i18n.__('WRONG_GUESS_PROMPTS')));
  }
  response.push(sprintf(getRandomValue(i18n.__('MULTIPLICATION_RESULT_PROMPTS')),
    app.data.multiplicand, app.data.multiplier, goodAnswer));
  app.data.multiplicand = getRandomNumber(2, 9);
  app.data.multiplier = getRandomNumber(1, 10);
  response.push(sprintf(getRandomValue(i18n.__('MULTIPLICATION_PROMPTS')),
    app.data.multiplicand, app.data.multiplier));
  app.ask(concat(response));
};

/**
 * pass to the next question
 * @param {ApiAiApp} app ApiAiApp instance
 * @return {void}
 */
const passQuestion = app => {
  let goodAnswer = app.data.multiplicand * app.data.multiplier;
  let response = [];
  app.data.currentStreak = 0;
  response.push(getRandomValue(i18n.__('PASS_QUESTION_PROMPTS')));

  response.push(sprintf(getRandomValue(i18n.__('MULTIPLICATION_RESULT_PROMPTS')),
    app.data.multiplicand, app.data.multiplier, goodAnswer));
  app.data.multiplicand = getRandomNumber(2, 9);
  app.data.multiplier = getRandomNumber(1, 10);
  response.push(sprintf(getRandomValue(i18n.__('MULTIPLICATION_PROMPTS')),
    app.data.multiplicand, app.data.multiplier));
  app.ask(concat(response));
};

/**
 * repeat the question
 * @param {ApiAiApp} app ApiAiApp instance
 * @return {void}
 */
const repeatQuestion = app => {
  let response = [];
  response.push(sprintf(getRandomValue(i18n.__('MULTIPLICATION_PROMPTS')),
    app.data.multiplicand, app.data.multiplier));
  app.ask(concat(response));
};

/**
 * Say goodbye
 * @param {ApiAiApp} app ApiAiApp instance
 * @return {void}
 */
const quitGame = app => {
  let response = [];
  if (app.data.bestStreak > 0) {
    response.push(sprintf(getRandomValue(i18n.__('BEST_STREAK_PROMPTS')),
      app.data.bestStreak));
  }
  response.push(getRandomValue(i18n.__('GOODBYE_PROMPTS')));
  app.tell(concat(response));
};

/** @type {Map<string, function(ApiAiApp): void>} */
const actionMap = new Map();
actionMap.set(Actions.DEFAULT_WELCOME, startGame);
actionMap.set(Actions.CHECK_GUESS, checkGuess);
actionMap.set(Actions.PASS_QUESTION, passQuestion);
actionMap.set(Actions.REPEAT_QUESTION, repeatQuestion);
actionMap.set(Actions.QUIT_GAME, quitGame);

/**
 * The entry point to handle a http request
 * @param {Request} request An Express like Request object of the HTTP request
 * @param {Response} response An Express like Response object to send back data
 */
const multiplicationTablesTrainer = functions.https.onRequest((request, response) => {
  const app = new ApiAiApp({
    request,
    response
  });
  console.log(`Request headers: ${JSON.stringify(request.headers)}`);
  console.log(`Request body: ${JSON.stringify(request.body)}`);

  i18n.configure({
    locales: ['en-US', 'fr-FR'],
    directory: path.join(__dirname, '/locales'),
    defaultLocale: 'en-US'
  });
  i18n.setLocale(app.getUserLocale());

  app.handleRequest(actionMap);
});

module.exports = {
  multiplicationTablesTrainer
};

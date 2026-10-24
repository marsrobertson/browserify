'use strict';

const { LEVELS, DEFAULT_LEVEL, findBroSpots, broify, unbroify } = require('./bro.js');
const { broifyHTML } = require('./html.js');
const { middleware } = require('./middleware.js');

// app.use(require('bro-mode')()) works, and so do the named functions.
module.exports = Object.assign(middleware, {
  LEVELS, DEFAULT_LEVEL, findBroSpots, broify, unbroify, broifyHTML, middleware,
});

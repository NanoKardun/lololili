'use strict';
const { listQuizzes } = require('./lib/game');
exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: '{}' };
  return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(listQuizzes()) };
};

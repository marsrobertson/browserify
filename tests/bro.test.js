const test = require('node:test');
const assert = require('node:assert/strict');
const { broify } = require('../bro.js');

const cases = [
  // [input, expected]
  ['This is a sentence.', 'This is a sentence, bro.'],
  ['First one is here. Second one is here.', 'First one is here, bro. Second one is here, bro.'],
  ['Is this a question? It is a statement.', 'Is this a question? It is a statement, bro.'],
  ['What a day it was!', 'What a day it was!'],

  // Double-bro rule
  ['That was sick, bro.', 'That was sick, bro.'],
  ['Thanks a lot bro.', 'Thanks a lot bro.'],
  ['Calm down, Bro.', 'Calm down, Bro.'],

  // Not full sentences
  ['Sign in.', 'Sign in.'],
  ['Read more.', 'Read more.'],
  ['and many more things.', 'and many more things.'],
  ['Home', 'Home'],

  // Abbreviations, initials, numbers, URLs, ellipses
  ['Dr. Smith went to the shop.', 'Dr. Smith went to the shop, bro.'],
  ['We need fruit, e.g. apples and pears.', 'We need fruit, e.g. apples and pears, bro.'],
  ['It was written by J. R. R. Tolkien.', 'It was written by J. R. R. Tolkien, bro.'],
  ['The meeting is on Jan. 5 this year.', 'The meeting is on Jan. 5 this year, bro.'],
  ['The price is 3.50 per unit.', 'The price is 3.50 per unit, bro.'],
  ['You can find it at example.com.', 'You can find it at example.com.'],
  ['I was thinking about it...', 'I was thinking about it...'],
  ['We bought apples, pears, etc.', 'We bought apples, pears, etc.'],

  // Quotes and brackets
  ['She said "this is great."', 'She said "this is great, bro."'],
  ['He called it "the best".', 'He called it "the best", bro.'],
  ['It works (mostly).', 'It works (mostly), bro.'],

  // Shouting
  ['THIS IS VERY LOUD.', 'THIS IS VERY LOUD, BRO.'],

  // Idempotent: running twice never stacks bros
  ['One two three. Four five six.', 'One two three, bro. Four five six, bro.'],
];

for (const [input, expected] of cases) {
  test(JSON.stringify(input), () => {
    assert.equal(broify(input), expected);
    assert.equal(broify(broify(input)), expected);
  });
}

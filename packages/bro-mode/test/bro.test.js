const test = require('node:test');
const assert = require('node:assert/strict');
const { broify, unbroify } = require('../bro.js');

// Normal bro: full sentences ending in a full stop.
const normal = [
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

// Ultra bro: questions and exclamations too.
const ultra = [
  ['Is this a question? It is a statement.', 'Is this a question, bro? It is a statement, bro.'],
  ['What a day it was!', 'What a day it was, bro!'],
  ['Are you serious right now?!', 'Are you serious right now, bro?!'],
  ['WHY IS IT SO LOUD?', 'WHY IS IT SO LOUD, BRO?'],
  ['Are you okay, bro?', 'Are you okay, bro?'],
  ['Do you even lift bro!', 'Do you even lift bro!'],
  ['Why?', 'Why?'],
  ['Sign in.', 'Sign in.'],
  ['I was thinking about it...', 'I was thinking about it...'],
  ['Dr. Smith went to the shop.', 'Dr. Smith went to the shop, bro.'],
  ['Home', 'Home'],
];

// Super duper hyper cyber bro: everything.
const hyper = [
  ['Sign in.', 'Sign in, bro.'],
  ['Why?', 'Why, bro?'],
  ['Wow!', 'Wow, bro!'],
  ['and many more things.', 'and many more things, bro.'],
  ['I was thinking about it...', 'I was thinking about it, bro...'],
  ['Sign in', 'Sign in, bro'],
  ['Home', 'Home, bro'],
  ['OK', 'OK, BRO'],
  ['Settings (beta)', 'Settings (beta), bro'],
  ['Read more  ', 'Read more, bro  '],
  ['Welcome back. Log out', 'Welcome back, bro. Log out, bro'],
  ['Hey bro', 'Hey bro'],
  ['Email:', 'Email:'],
  ['42', '42'],
  ['', ''],
  ['Dr. Smith', 'Dr. Smith, bro'],
  ['We bought apples, pears, etc.', 'We bought apples, pears, etc.'],
  ['You can find it at example.com.', 'You can find it at example.com.'],
];

const levels = { normal, ultra, hyper };
for (const [level, cases] of Object.entries(levels)) {
  for (const [input, expected] of cases) {
    test(`${level}: ${JSON.stringify(input)}`, () => {
      assert.equal(broify(input, level), expected);
      assert.equal(broify(broify(input, level), level), expected);
    });
  }
}

test('default level is ultra', () => {
  assert.equal(broify('What a day it was!'), 'What a day it was, bro!');
});

// Unbro undoes bro-mode exactly, at every level, as long as the original
// text had no bros of its own.
for (const [level, cases] of Object.entries(levels)) {
  for (const [input] of cases) {
    if (/bro/i.test(input)) continue;
    test(`unbro after ${level}: ${JSON.stringify(input)}`, () => {
      assert.equal(unbroify(broify(input, level)), input);
    });
  }
}

const unbro = [
  // It can't tell who wrote a bro, so human ones with a comma go too.
  ['Thanks, bro.', 'Thanks.'],
  ['Calm down, BRO!', 'Calm down!'],
  // But not ones bro-mode would never have written.
  ['Thanks bro.', 'Thanks bro.'],
  ['Calm down, Bro.', 'Calm down, Bro.'],
  ['Hey, brother.', 'Hey, brother.'],
  ['Bro, listen to me.', 'Bro, listen to me.'],
  ['Yo, bro, what is up?', 'Yo, bro, what is up?'],
];
for (const [input, expected] of unbro) {
  test(`unbro: ${JSON.stringify(input)}`, () => assert.equal(unbroify(input), expected));
}

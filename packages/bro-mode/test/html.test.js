const test = require('node:test');
const assert = require('node:assert/strict');
const { broifyHTML } = require('../html.js');

const B = '<span data-bro>, bro</span>';

const cases = [
  // [level, input, expected]
  ['normal', '<p>This is a sentence.</p>', `<p>This is a sentence${B}.</p>`],
  ['normal', '<p>Hello <b>there</b> my friend.</p>', `<p>Hello <b>there</b> my friend${B}.</p>`],
  ['normal', '<p>Hello there my <a href="/">friend</a>.</p>', `<p>Hello there my <a href="/">friend</a>${B}.</p>`],
  ['normal', '<p>Tom &amp; Jerry went home.</p>', `<p>Tom &amp; Jerry went home${B}.</p>`],
  ['normal', '<p>She said &quot;this is great.&quot;</p>', `<p>She said &quot;this is great${B}.&quot;</p>`],
  ['normal', '<p>Line one is\r\nhere now.</p>', `<p>Line one is\r\nhere now${B}.</p>`],
  ['normal', '<p>Is it good? Yes it is good.</p>', `<p>Is it good? Yes it is good${B}.</p>`],
  ['normal', '<p>THIS IS VERY LOUD.</p>', '<p>THIS IS VERY LOUD<span data-bro>, BRO</span>.</p>'],
  ['ultra', '<p>Is it any good?</p>', `<p>Is it any good${B}?</p>`],

  // Left alone, byte for byte
  ['hyper', '<pre>Code stays the same.</pre>', '<pre>Code stays the same.</pre>'],
  ['hyper', '<script>var s = "Not a real sentence.";</script>', '<script>var s = "Not a real sentence.";</script>'],
  ['hyper', '<textarea>Do not touch this.</textarea>', '<textarea>Do not touch this.</textarea>'],
  ['hyper', '<div contenteditable>You can type here.</div>', '<div contenteditable>You can type here.</div>'],
  ['hyper', '<title>The page title here.</title>', '<title>The page title here.</title>'],
  ['hyper', '<input value="Keep me alone.">', '<input value="Keep me alone.">'],
  ['normal', '<button>Click this button now.</button>', '<button>Click this button now.</button>'],
  ['normal', '<nav><a>Go back home now.</a></nav>', '<nav><a>Go back home now.</a></nav>'],
  ['normal', '<div role="button">Click this one too.</div>', '<div role="button">Click this one too.</div>'],

  // Hyper: buttons, nav and bare text
  ['hyper', '<button>Sign in</button>', `<button>Sign in${B}</button>`],
  ['hyper', '<nav><a href="/">Home</a></nav>', `<nav><a href="/">Home${B}</a></nav>`],
  ['hyper', '<ul><li><a>Home</a>\n</li></ul>', `<ul><li><a>Home</a>${B}\n</li></ul>`],

  // Markup we don't touch survives exactly, odd quoting and all
  [
    'normal',
    "<!DOCTYPE html>\n<html><head><meta charset=utf-8></head><body class='x'><p>One two three.<p>Four five six.</body></html>",
    `<!DOCTYPE html>\n<html><head><meta charset=utf-8></head><body class='x'><p>One two three${B}.<p>Four five six${B}.</body></html>`,
  ],
];

for (const [level, input, expected] of cases) {
  test(`${level}: ${JSON.stringify(input)}`, () => {
    const once = broifyHTML(input, { level });
    assert.equal(once, expected);
    assert.equal(broifyHTML(once, { level }), expected, 'running twice never stacks bros');
  });
}

test('mark: false inserts plain text', () => {
  assert.equal(broifyHTML('<p>This is a sentence.</p>', { mark: false }), '<p>This is a sentence, bro.</p>');
});

test('unknown level throws', () => {
  assert.throws(() => broifyHTML('<p>Hi.</p>', { level: 'mega' }), /Unknown bro level/);
});

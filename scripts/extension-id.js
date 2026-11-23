// Chrome derives an unpacked extension's ID from its folder path.
'use strict';

const crypto = require('crypto');
const fs = require('fs');

module.exports = function extensionId(dir) {
  const hash = crypto.createHash('sha256').update(fs.realpathSync(dir)).digest('hex').slice(0, 32);
  return [...hash].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join('');
};

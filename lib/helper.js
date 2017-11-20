const fs = require('fs');

const getFileList = path => fs.readdirSync(path)
  .filter(file => file.match(/\.js$/));

const sortByTimestamp = (a, b) => {
  const ta = +((/^([-+0-9]+?)-.+/g.exec(a))[1]);
  const tb = +((/^([-+0-9]+?)-.+/g.exec(b))[1]);

  return ta - tb;
};

module.exports = {
  getFileList,
  sortByTimestamp,
};

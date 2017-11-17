const fs = require('fs');

const getFileList = path => fs.readdirSync(path)
  .filter(file => file.match(/\.js$/));

module.exports = {
  getFileList,
};

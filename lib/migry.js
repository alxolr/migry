const fs = require('fs');
const assert = require('assert');

const path = `${__dirname}/../../migrations`; // default folder for the migrations

function list() {
  if (!fs.existsSync(path)) {
    return process.stdout.write('Please create `migration` folder same level as node_modules');
  }

  return fs.readdir(path, (err, files) => {
    assert.equal(err, null);
    files.forEach(file => process.stdout.write(`${file}\n`));
  });
}

const template = `
  module.exports {
    up,
    down
  }

  function up() {

  }

  function down() {

  }
`;

function create(name) {
  fs.writeFileSync(`${path}/${Date.now()}-${name}.js`, template);
}

module.exports = {
  list,
  create,
};


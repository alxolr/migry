const fs = require('fs');
const assert = require('assert');

const path = `${__dirname}/../../../migrations`; // default folder for the migrations

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
  module.exports = {
    up,
    down,
  }

  function up() {
  }

  function down() {
  }
`;

function create(name) {
  const file = `${Date.now()}-${name}.js`;
  fs.writeFileSync(`${path}/${file}`, template);
  process.stdout.write(`${file} - was created`);
}

module.exports = {
  list,
  create,
};


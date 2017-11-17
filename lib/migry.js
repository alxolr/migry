const fs = require('fs');
const mongoose = require('mongoose');
const Migration = require('./migration.model');
const { getFileList } = require('./helper');

mongoose.Promise = Promise;

const path = `${__dirname}/../../../migrations`; // default folder for the migrations

function list() {
  if (!fs.existsSync(path)) {
    return process.stdout.write('Please create `migrations` folder same level as `node_modules`');
  }

  return getFileList(path)
    .forEach(file => process.stdout.write(`${file}\n`));
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


function handleMigration(files) {
  return (file) => {
    if (!files.includes(file.name)) {
      require(`${path}/${file.name}`).up((err) => {
        if (err) process.stdout.write(err.message);
      });
    }
  };
}


function up(name, options) {
  const configPath = options.parent.config;

  if (fs.existsSync(configPath)) {
    let opts = JSON.parse(fs.readFileSync(configPath));

    opts = opts[process.env.NODE_ENV || 'local'];

    mongoose.connect(opts.uri, opts.options).then(() => {
      Migration.find({}).then((migrations) => {
        const files = getFileList(path);
        migrations.forEach(handleMigration(files));

        mongoose.connection.close();
      });
    })
      .catch(err => process.stdout.write(err.message));
  } else {
    process.stdout.write(`"${configPath}" file does not exist`);
  }
}

module.exports = {
  list,
  create,
  up,
};


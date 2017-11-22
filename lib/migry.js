const fs = require('fs');
const mongoose = require('mongoose');
const util = require('util');

const Migration = require('./migration.model');
const { getFileList, sortByTimestamp } = require('./helper');

mongoose.Promise = Promise;

const path = `${__dirname}/../../../migrations`; // default folder for the migrations

module.exports = {
  list,
  create,
  run,
};

function list() {
  if (!fs.existsSync(path)) {
    return process.stdout.write('Please create `migrations` folder same level as `node_modules`');
  }

  return getFileList(path)
    .forEach(file => process.stdout.write(`${file}\n`));
}

const template = `
function run(done) {
  // add your migration logic, call done when the migration ended
  done();
}

module.exports = {
  run,
};

`;

function create(name) {
  const file = `${Date.now()}-${name}.js`;
  fs.writeFileSync(`${path}/${file}`, template);
  process.stdout.write(`${file} - was created`);
}

function run(name, options) {
  const configPath = options.parent.config;

  if (fs.existsSync(configPath)) {
    const config = extractConfig(configPath);

    return mongoose.connect(config.uri, config.options)
      .then(() =>
        Migration.find({})
          .then(handleMigrationList(name))
          .then(() => mongoose.connection.close()))
      .catch(err => process.stdout.write(err.message));
  }

  return process
    .stdout.write(`"${configPath}" is not a valid file path. Please specify a valid config file using --config path/to/file"`);
}

function handleMigrationList(name) {
  return (migrations) => {
    let files = getFileList(path);

    if (name) {
      files = files.filter(file => file.indexOf(name) !== -1);
    }

    migrations = migrations.map(m => m.name);

    return handleMigrations(migrations, files);
  };
}

function handleMigrations(migrations, files) {
  return new Promise((resolve, reject) => {
    files = files.sort(sortByTimestamp);

    function iterate(index) {
      if (index >= files.length) {
        return resolve();
      }
      if (files[index] && !migrations.includes(files[index])) {
        return migrate(files[index])
          .then(() => iterate(index + 1))
          .catch(reject);
      }
      return iterate(index + 1);
    }

    iterate(0);
  });
}

function migrate(file) {
  const migrationPath = `${path}/${file}`;
  // eslint-disable-next-line
  const runMigration = util.promisify(require(migrationPath).run);
  return runMigration(mongoose)
    .then(() => new Migration({ name: file }).save())
    .then(() => process.stdout.write(`${file} - migrated OK\n`));
}

function extractConfig(configPath) {
  let config = JSON.parse(fs.readFileSync(configPath));
  config = config[process.env.NODE_ENV || 'local'];
  config.options.useMongoClient = config.options.useMongoClient || true;
  config.options.poolSize = config.options.poolSize || 5;
  config.options.reconnectTries = config.options.reconnectTries || 1;

  if (config.options.ca_certificate_base64) {
    const ca = [Buffer.from(config.options.ca_certificate_base64), 'base64'];
    delete config.options.ca_certificate_base64;
    config.options.ssl = true;
    config.options.sslValidate = false;
    config.options.sslCA = ca;
  }

  return config;
}

const fs = require('fs');
const mongoose = require('../../mongoose');
const util = require('util');

const Migration = require('./migration.model');
const { getFileList, sortByTimestamp } = require('./helper');
const { configTemplate, migrationTemplate } = require('./templates');

mongoose.Promise = Promise;

const path = `${__dirname}/../../../migrations`; // default folder for the migrations
const defaultConfigPath = `${path}/config.json`;

module.exports = {
  list,
  create,
  run,
  init,
};

function list() {
  if (!fs.existsSync(path)) {
    return process.stdout.write('Please create `migrations` folder same level as `node_modules`');
  }

  return getFileList(path)
    .forEach(file => process.stdout.write(`${file}\n`));
}

function create(name) {
  const file = `${Date.now()}-${name}.js`;
  fs.writeFileSync(`${path}/${file}`, migrationTemplate);
  process.stdout.write(`${file} - was created`);
}

function run(name, options) {
  let configPath = options.parent.config;
  const environment = options.parent.env;

  configPath = configPath || defaultConfigPath;

  if (fs.existsSync(configPath)) {
    const config = extractConfig(configPath, environment);

    return mongoose.connect(config.uri, config.options)
      .then(() =>
        Migration.find({})
          .then(handleMigrationList(name))
          .then(() => mongoose.connection.close()))
      .catch(err => process.stdout.write(err.message));
  }

  return process
    .stdout.write('Please specify a valid config file using --config path/to/file" or add a config.json file in "migrations" folder');
}

function init() {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
    fs.writeFileSync(`${path}/config.json`, configTemplate);

    process.stdout.write('migrations/config.json file was successfully created');
  } else {
    process.stdout.write('migrations folder already exists');
  }
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
  return runMigration()
    .then(() => new Migration({ name: file }).save())
    .then(() => process.stdout.write(`${file} - migrated OK\n`))
    .catch((err) => {
      process.stdout.write(`fail to migrate "${file}" \n ${err.stack}`);
    });
}

function extractConfig(configPath, env) {
  let config = JSON.parse(fs.readFileSync(configPath));
  config = config[env || process.env.NODE_ENV || 'local'];

  if (!config.options) config.options = {};

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

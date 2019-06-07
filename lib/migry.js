const fs = require('fs');
const voca = require('voca');

const mongoose = require('mongoose'); // eslint-disable-line

const Migration = require('./migration.model');
const { getFileList, sortByTimestamp } = require('./helper');
const { configTemplate, migrationTemplate } = require('./templates');

mongoose.Promise = Promise;

const migrationPath = `${process.cwd()}/migrations`; // default folder for the migrations
const defaultConfigPath = `${migrationPath}/config.json`;

module.exports = {
  list,
  create,
  run,
  init,
};

function list() {
  if (!fs.existsSync(migrationPath)) {
    return process.stdout.write('Please create `migrations` folder same level as `node_modules`');
  }

  return getFileList(migrationPath)
    .forEach(file => process.stdout.write(`${file}\n`));
}

function create(name) {
  const slug = voca.slugify(name);
  const file = `${Date.now()}-${slug}.js`;
  fs.writeFileSync(`${migrationPath}/${file}`, migrationTemplate);
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
  if (!fs.existsSync(migrationPath)) {
    fs.mkdirSync(migrationPath);
    fs.writeFileSync(`${migrationPath}/config.json`, configTemplate);

    process.stdout.write('migrations/config.json file was successfully created');
  } else {
    process.stdout.write('migrations folder already exists');
  }
}


function handleMigrationList(name) {
  return (migrations) => {
    let files = getFileList(migrationPath);

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
  const migrationFilePath = `${migrationPath}/${file}`;
  // eslint-disable-next-line
  const migrate = require(migrationFilePath);
  return migrate()
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

  config.options.useNewUrlParser = true;
  config.options.poolSize = config.options.poolSize || 5;
  config.options.reconnectTries = config.options.reconnectTries || 1;
  config.options.connectTimeoutMS = config.options.connectTimeoutMS || 1000;

  if (config.options.ca_certificate_base64) {
    const ca = [Buffer.from(config.options.ca_certificate_base64), 'base64'];
    delete config.options.ca_certificate_base64;
    config.options.ssl = true;
    config.options.sslValidate = false;
    config.options.sslCA = ca;
  }

  return config;
}

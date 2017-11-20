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
  module.exports = {
    run,
  }

  function run(done) {
    // add your migration logic, call done when the migration ended
    done();
  }
`;

function create(name) {
  const file = `${Date.now()}-${name}.js`;
  fs.writeFileSync(`${path}/${file}`, template);
  process.stdout.write(`${file} - was created`);
}

function run(name, options) {
  const configPath = options.parent.config;

  if (fs.existsSync(configPath)) {
    let opts = JSON.parse(fs.readFileSync(configPath));

    opts = opts[process.env.NODE_ENV || 'local'];
    opts.options.useMongoClient = true;

    return mongoose.connect(opts.uri, opts.options)
      .then(() =>
        Migration.find({})
          .then(handleMigrationList(name))
          .then(() => mongoose.connection.close()))
      .catch(err => process.stdout.write(err.message));
  }

  return process.stdout.write(`"${configPath}" file does not exist`);
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
  const run = util.promisify(require(migrationPath).run);
  return run
    .then(() => new Migration({ name: file }).save())
    .then(() => process.stdout.write(`${file} - was migrated\n`));
}

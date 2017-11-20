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
    run,
  }

  function run(next) {
    // add your migration logic
    next();
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

    mongoose.connect(opts.uri, opts.options).then(() => {
      Migration.find({}).then((migrations) => {
        const files = getFileList(path);
        // eslint-disable-next-line
        migrations = migrations.map(m => m.name);

        // eslint-disable-next-line
        handleMigrations(migrations, files, (err) => {
          mongoose.connection.close();
        });
      });
    })
      .catch(err => process.stdout.write(err.message));
  } else {
    process.stdout.write(`"${configPath}" file does not exist`);
  }
}


function handleMigrations(migrations, files, callback) {
  // eslint-disable-next-line
  files = files.sort((a, b) => {
    const t1 = +((/^([-+0-9]+?)-.+/g.exec(a))[1]);
    const t2 = +((/^([-+0-9]+?)-.+/g.exec(b))[1]);

    return t1 - t2;
  });

  function iterate(index) {
    if (index >= files.length) {
      return callback();
    }
    if (files[index] && !migrations.includes(files[index])) {
      // eslint-disable-next-line
      return migrate(files[index], (err) => {
        if (err) return callback(err);
        iterate(index + 1);
      });
    }
    // eslint-disable-next-line
    return iterate(index + 1);
  }

  iterate(0);
}

function migrate(file, callback) {
  const migrationPath = `${path}/${file}`;
  // eslint-disable-next-line
  require(migrationPath).run((err) => {
    if (err) return callback(err);

    return new Migration({ name: file })
      .save()
      .then((doc) => {
        process.stdout.write(`${file} - was migrated\n`);
        callback(null, doc);
      })
      .catch(callback);
  });
}


module.exports = {
  list,
  create,
  run,
};


# migry

> Is a simplistic mongoose library to manage database migrations.

## Installation

> `npm install migry`

## Compatibility

- node.js 8.x+

## Usage

- Create a folder `migrations/` in your project or you can use the `./node_modules/.bin/migry init` command
- Add a config file `migrations/config.json`

```javascript
// migrations/config.json

{
  "local": {
    "uri": "mongodb://localhost:27017/db-name",
    "options": {}
  },
  "preprod": {
    "uri": "mongodb://<username>:<password>@<preprod-mongohost>:<port>/db-name",
    "options": {
      "ca_certificate_base64": "<the base64 certificate for connection>"
    }
  }
}
```

- You can use the library:

```bash
> ./node_modules/.bin/migry

Usage: migry [options] [command]
Commands:

    list           list existing migration files
    init           init the migration folder with the config.json file
    create <name>  create a new migration
    run [name]     run updates to latest or specified [name]
```

## API

- Init the migration folder

```bash
> ./node_modules/.bin/migry init

migrations/config.json file was successfully created⏎
```

- Create a new migration

```bash
> ./node_modules/.bin/migry add-users

1513353185076-add-users.js - was created⏎
```

```javascript
// migrations/1513353185076-add-users.js

const User = require('../models/user.model');
// you can use all your mongoose models

function run(done) {
  return User
    .find({})
    .then((users) => {
      // do some logic
      done();
    })
    .catch(done);
}

module.exports = {
  run,
};
```

- List existing migrations

```bash
> ./node_modules/.bin/migry list

1511163445408-ich.js
1511163447619-ni.js
1511163449369-san.js
1511163451497-shi.js
1511163453742-roku.js
1513353185076-add-users.js
```

- Run specific migration

```bash
> ./node_modules/.bin/migry run add-users

1513353185076-add-users.js - migrated OK
```

- Run all migrations

```bash
> ./node_modules/.bin/migry run
```

- Run migrations on specific **environment**

```bash
> ./node_modules/.bin/migry run --env prod
```
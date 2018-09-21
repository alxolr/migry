const migrationTemplate = `
'use strict';

async function migrate() {
  // add your migration logic, call done when the migration ended

  return ;
}

module.exports = migrate;
`;

const configTemplate = `
{
  "local": {
    "uri": "mongodb://localhost:27017/dbname"
  },
  "dev": {
    "uri": "mongodb://<username>:<password>localhost:27017/dbname",
    "options": {}
  },
  "prod": {
    "uri": "",
    "options": {
      "ca_certificate_base64": "//base 64 certificate"
    }
  }
}
`;

module.exports = {
  migrationTemplate,
  configTemplate,
};

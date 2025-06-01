process = require('process');
require('dotenv').config({ path: '/etc/secrets/.env' });

module.exports = {
  "prefix": "=",
  "owner": "697369775625732117",
  "token": process.env.token,
  "username": process.env.username,
  "password": process.env.password,
  "admin_pas":process.env.admin_pas,
  "uri": process.env.uri
}
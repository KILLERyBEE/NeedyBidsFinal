const db = require("mongoose")
require("dotenv").config();

db.connect(process.env.MONGODB_URI).then(()=>
{
  console.log("Connected to db");
})

module.exports = db;
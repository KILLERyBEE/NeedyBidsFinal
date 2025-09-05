const db = require("mongoose")
require("dotenv").config();

db.connect(process.env.MONGODB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
).then(()=>
{
  console.log("Connected to db");
})

module.exports = db;
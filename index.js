const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ReturnDocument } = require("mongodb");

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded());
app.use(express.json());

// Database connection
const uri = process.env.MONGO_URI
const client = new MongoClient(uri);
client.connect();
const dbName = "Cluster0";
const database = client.db(dbName);
console.log("Connected to the database.")

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.route('/api/users')
.post(async (req, res) => {
  const _username = req.body.username
  const user = {
    username: _username,
    exercises: []
  }
  const collectionName = "users";
  const collection = database.collection(collectionName);
  try {
    const insertResult = await collection.insertOne(user);
    console.log('documents successfully inserted.\n');
    res.json({
      "username": user.username,
      "_id": insertResult.insertedId
    })
  } catch (err) {
    console.error(`Something went wrong trying to insert the new documents: ${err}\n`);
  }
})
.get(async (req, res) => {
  const collectionName = "users";
  const collection = database.collection(collectionName);
  try {
    const users = await collection.find({}).toArray();
    console.log("Listed all the users successfully.")
    res.json(users)
  } catch (err) {
    console.error(`Something went wrong trying to list the users: ${err}\n`)
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


app.route('/api/users/:_id/exercises')
.post(async (req, res) => {
  const userId = req.body._id
  const _exercise = {
    "description" : req.body.description,
    "duration" : req.body.duration,
    "date" : req.body.date !== "" ? new Date(req.body.date).toDateString() : new Date().toDateString()
  }
  const collectionName = "users";
  const collection = database.collection(collectionName);
  const updateQuery = { $push: { exercises: _exercise } };
    await collection.findOneAndUpdate({_id: userId},  updateQuery, {projection: {username: 1, _id: 1}, upsert: true}).then(
      (data) =>{
        res.json({
          "username": data.username,
          "_id": data._id,
          "description": _exercise.description,
          "duration": _exercise.duration,
          "date": _exercise.date
        })
      }
    , (error) => {
      console.error(`Something went wrong trying to insert the new documents: ${err}\n`);
    })
})

const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ReturnDocument, ObjectId, Int32 } = require("mongodb");

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
    log: []
  }
  const collectionName = "users";
  const collection = database.collection(collectionName);
  try {
    const insertResult = await collection.insertOne(user);
    console.log('documents successfully inserted.\n');
    res.json({
      username: user.username,
      _id: insertResult.insertedId
    })
  } catch (err) {
    console.error(`Something went wrong trying to insert the new documents: ${err}\n`);
  }
})
.get(async (req, res) => {
  const collectionName = "users";
  const collection = database.collection(collectionName);
  try {
    const users = await collection.find({}, {projection: {log: 0}}).toArray();
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
  const userId = req.params._id
  const _exercise = {
    description : req.body.description,
    duration : Number(req.body.duration),
    _date : req.body.date !== "" ? new Date(req.body.date) : new Date(),
  }
  _exercise.date = _exercise._date.toDateString()
  const collectionName = "users";
  const collection = database.collection(collectionName);
  const updateQuery = { $push: { log: _exercise } };
    await collection.findOneAndUpdate({_id: new ObjectId(userId)},  updateQuery, {projection: {username:1}, upsert: true}).then(
      (data) =>{
        res.json({
          username: data.username,
          description: _exercise.description,
          duration: Number(_exercise.duration),
          date: _exercise.date,
          _id: data._id
        })
      }
    , (error) => {
      console.error(`Something went wrong trying to insert the new documents: ${err}\n`);
    })
})

app.route('/api/users/:_id/logs')
.get(async (req, res) => {

  const params = req.query
  let toDate = new Date()
  let fromDate = new Date(0)
  let logLimit = new Int32(100)
  if (params.to) {toDate = new Date(params.to)} 
  if (params.from) {fromDate = new Date(params.from)} 
  if(params.limit) {logLimit = new Int32(params.limit)}

  const userId = req.params._id
  const collectionName = "users";
  const collection = database.collection(collectionName);

  const user = collection.aggregate([
    { $match: {_id: new ObjectId(userId)}},
    {$project: {
      log: {
        $filter: {
          input: '$log',
          as: 'item',
          cond: {$and: [
            {$gt: ['$$item._date', fromDate]},
            {$lt: ['$$item._date', toDate]}
          ]},
          limit: Number(logLimit),
        }
      },
      count: {$size: '$log'},
    }}
    ,
    { $project: {
      "log._date": 0,
    }
  },
])
  for await(const result of user) {
    res.json(result)
  }
  
})







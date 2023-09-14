const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ReturnDocument, ObjectId } = require("mongodb");

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
    "description" : req.body.description,
    "duration" : Number(req.body.duration),
    "date" : req.body.date !== "" ? new Date(req.body.date).toDateString() : new Date().toDateString()
  }
  const collectionName = "users";
  const collection = database.collection(collectionName);
  const updateQuery = { $push: { log: _exercise } };
    await collection.findOneAndUpdate({_id: new ObjectId(userId)},  updateQuery, {projection: {username:1}, upsert: true}).then(
      (data) =>{
        res.json({
          "username": data.username,
          "description": _exercise.description,
          "duration": Number(_exercise.duration),
          "date": _exercise.date,
          "_id": data._id
        })
      }
    , (error) => {
      console.error(`Something went wrong trying to insert the new documents: ${err}\n`);
    })
})

// app.route('/api/users/:_id/logs')
// .get(async (req, res) => {
//   const params = req.query
//   if(!params.to) {params.to = new Date()}
//   if(!params.from) {params.from = new Date(0)}
//   if (!params.limit) {params.limit = 100} 
//   const userId = req.params._id
//   const collectionName = "users";
//   const collection = database.collection(collectionName);
//   const user = collection.aggregate([
//     {$match:{_id: new ObjectId(userId)}},
//     {
//        $project: {
//           username: 1,
//           _id: 1,
//           count: { $cond: { if: { $isArray: "$log" }, then: { $size: "$log" }, else: "NA"} },
//           log: {
//             $filter: {
//               input: "$date",
//               as: "date",
//               cond: {
//                 $and: [{$gt: ["$date", new Date(params.from)]}, {$lt: ["$date", new Date(params.to)]}, {$slice: ["$log", params.limit]}]
//               }
//        }
//     }}
//   }
//   ])
//   for await (const doc of user) {
//     res.json({
//       "username": doc.username,
//       "count": doc.count,
//       "_id": doc._id,
//       "log": doc.log
//     })
//   }
// })

app.route('/api/users/:_id/logs')
.get(async (req, res) => {
  const userId = req.params._id
  const collectionName = "users";
  const collection = database.collection(collectionName);
  
  // Parse the query parameters
  const from = req.query.from ? new Date(req.query.from) : new Date(0);
  const to = req.query.to ? new Date(req.query.to) : new Date();
  let limit = parseInt(req.query.limit);

  // Check if limit is a number
  if (isNaN(limit)) {
    limit = Infinity; // Set a default value
  }

  // Define the aggregation pipeline
  const pipeline = [
    { $match: { _id: new ObjectId(userId) } },
    { $unwind: "$log" },
    { $addFields: { "log.date": { $toDate: "$log.date" } } },
    { $match: { "log.date": { $gte: from, $lte: to } } },
    { $sort: { "log.date": -1 } }
  ];

  // Add the $limit stage if limit is a valid number
  if (!isNaN(limit)) {
    pipeline.push({ $limit: limit });
  }

  pipeline.push({
    $group: {
      _id: "$_id",
      username: { $first: "$username" },
      count: { $sum: 1 },
      log: { $push: "$log" }
    }
  });

  // Execute the aggregation pipeline
  const user = await collection.aggregate(pipeline).toArray();

  // Return the result
  if (user.length > 0) {
    res.json(user[0]);
  } else {
    res.json({ message: "No logs found for this user within the specified date range." });
  }
});




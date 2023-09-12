const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const { Schema } = mongoose;

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded());
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// MongoDB Database Cinfiguration

const exerciseSchema = new Schema({
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: String,
})
const Exercise = mongoose.model('Exercise', exerciseSchema);
const usersSchema = new Schema({
  username: String,
  exercises: [exerciseSchema]
})
const User = mongoose.model('User', usersSchema);
const logSchema = new Schema({
  username: [usersSchema], 
  count: Number,
  log: [exerciseSchema]
})
const Log = mongoose.model('Log', logSchema);

mongoose.connect('mongodb+srv://admin:AojYDLt9TH3XpfSY@cluster0.lsljwqu.mongodb.net/?retryWrites=true&w=majority').then(
  () => { console.log("Connected to database successfully...") },
  err => { return console.error(err) }
);



app.route('/api/users')
.get(async function(req, res) {
  const users = await User.find({}).select('_id username exercises');
  res.json(users);
})
.post(function(req, res) {
  const username = req.body.username
  const user = new User({
    username: username
  })
  user.save()
  res.json({
    "username": username,
    "_id": user.id
  })
})

app.route('/api/users/:_id/exercises')
.post(async function(req, res) {
  const exercise ={
    duration: req.body.duration,
    description : req.body.description,
    date: req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString()
  }
  const user = await User.findOne({_id: req.params._id})
  user.exercises.push(exercise)
  user.save()
  res.json({
    "_id": user._id,
    "username": user.username,
    "date" : exercise.date,
    "duration": Number(exercise.duration),
    "description": exercise.description
  })
})


app.route('/api/users/:_id/logs')
.get(async function(req, res) {
    const user = await User.findById({_id: req.params._id})
    res.json({
      "_id": user._id,
      "username": user.username,
      "count": user.exercises.length,
      "log": user.exercises
    })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

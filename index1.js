const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


////////////////////////////////////////////////////////////////////
//additional packages
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
//servce static assets
app.use('/public', express.static(__dirname + '/public'));

//mongoose and db items
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const { Schema } = mongoose;
  //User
const userSchema = new Schema({
  username: {type: String, required: true},
  description: {type: String},
  duration: {type: Number},
  date: {type: String},
  count: {type: Number},
  log: [{
    description: String,
    duration: Number,
    date: {type: String, required: false},
    _id: false
  }]
})
const User = mongoose.model('User', userSchema);


var resObj = {};

const defDate = new Date().toDateString();
//console.log(new Date("Wed Jan 04 1111").toISOString().slice(0, 10));
var dateCheck = (input) => {
  if (!input || isNaN(Date.parse(input))) {
    return defDate;
  } else {
    return new Date(input).toDateString();
  }
}
var dateCon = (input) => {return new Date(input).toISOString().slice(0,10)}
//console.log(dateCon("Wed Jan 04 1111"))

app.post('/api/users', (req,res) => {
  let inUser = new User({username: req.body.username});
  inUser.save().then(
    (data) => {
        resObj.username = data.username;
        resObj._id = data.id;
        res.send(resObj)
    },
    (error) => console.error(error)
  )
})

app.get('/api/users', (req,res) => {
  User.find({}).then((users) => {
    res.send(users)
  });
});



app.post('/api/users/:_id/exercises', (req,res) => {
  var filter = {_id: req.params._id};
  var update = {
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: dateCheck(req.body.date)
  };
  var options = {new: true};
  
  User.findOneAndUpdate (filter, update, options).then(
    (data) => {
    data.log.push(update);
      console.log('saving the date ' + typeof(update.date) + ' to the db')
      data.save();
      //response object with correct parameters
      resObj.username = data.username;
      resObj.description = data.description;
      resObj.duration = data.duration;
      resObj.date = data.date;
      resObj._id = data.id;
      res.json(resObj);
    },
    (error) => {
        res.json({
            error: error
          })
    }
  )
})

app.get('/api/users/:_id/logs', (req,res) => {
  var id = req.params._id;
  var limit = req.query.limit;
  var from = req.query.from;
  var to = req.query.to
  if (limit) {
    User.findById(id, {log: {$slice: -limit}}, (err,data) => {
      res.json({
        _id: id,
        username: data.username,
        count: data.log.length,
        log: data.log
      })
    })
  } else if (to) {
    User.findById(id).then(
    (data) => {
        res.json({
            _id: id,
            username: data.username,
            count: data.log.length,
            log: data.log.filter(a => dateCon(a.date) < to).map(a => ({description:a.description, duration: a.duration, date:new Date (a.date).toDateString()}))
          })
          data.log.map(a => console.log(typeof(a.date)))
    }
    )
  } else if (from) {
    User.findById(id).then(
        (data)=> {
            res.json({
                _id: id,
                username: data.username,
                from: from,
                count: data.log.length,
                log: data.log.filter(a => dateCon(a.date) > from).map(a => ({description:a.description, duration: a.duration, date: new Date (a.date).toDateString()}))
              });
              data.log.map(a => console.log(typeof(a.date)))
        }
    )
  } else {
    User.findById(id).then(
        (data)=> {
            res.json({
                username: data.username,
                count: data.log.length,
                _id: id,
                log: data.log.map(a => ({description: a.description, duration: a.duration, date: new Date (a.date).toDateString()}))
              });
              data.log.filter(a => console.log(typeof(a.date)))
        }
    )
  }    
})


///////function ends here//////////

//Listener
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
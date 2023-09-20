const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

// Define Mongoose schemas and models
const userSchema = new mongoose.Schema({
  username: String,
  log: [
    {
      description: String,
      duration: Number,
      date: Date,
    },
  ],
});

const User = mongoose.model("User", userSchema);

// Define routes
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.route("/api/users")
  .post(async (req, res) => {
    const { username } = req.body;
    try {
      const newUser = new User({
        username,
        log: [],
      });
      await newUser.save();
      console.log("User successfully created.");
      res.json({
        username: newUser.username,
        _id: newUser._id,
      });
    } catch (err) {
      console.error(`Error creating user: ${err}`);
      res.status(500).json({ error: "Failed to create user" });
    }
  })
  .get(async (req, res) => {
    try {
      const users = await User.find({}, { log: 0 });
      console.log("Listed all the users successfully.");
      res.json(users);
    } catch (err) {
      console.error(`Error listing users: ${err}`);
      res.status(500).json({ error: "Failed to list users" });
    }
  });

app.route("/api/users/:_id/exercises")
  .post(async (req, res) => {
    const userId = req.params._id;
    const { description, duration, date } = req.body;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const exercise = {
        description: String(description),
        duration: Number(duration),
        date: date ? new Date(date) : new Date(),
      };
      exercise.date = exercise.date.toDateString();

      user.log.push(exercise);
      await user.save();

      console.log("Exercise successfully added.");
      res.json({
        username: user.username,
        description: exercise.description,
        duration: Number(exercise.duration),
        date: exercise.date,
        _id: user._id,
      });
    } catch (err) {
      console.error(`Error adding exercise: ${err}`);
      res.status(500).json({ error: "Failed to add exercise" });
    }
  });

app.route("/api/users/:_id/logs")
  .get(async (req, res) => {
    const { to, from, limit } = req.query;
    const userId = req.params._id;

    try {
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let fromDate = new Date(0);
      let toDate = new Date();

      if (from) {
        fromDate = new Date(from);
      }

      if (to) {
        toDate = new Date(to);
      }

      let filteredLogs = user.log.filter((log) =>
        log.date >= fromDate && log.date <= toDate
      );

      if (limit) {
        filteredLogs = filteredLogs.slice(0, parseInt(limit));
      }

      const response = {
        _id: user._id,
        username: user.username,
        count: filteredLogs.length,
        log: filteredLogs,
      };

      console.log("Filtered logs:", response);
      res.json(response);
    } catch (err) {
      console.error(`Error retrieving logs: ${err}`);
      res.status(500).json({ error: "Failed to retrieve logs" });
    }
  });

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

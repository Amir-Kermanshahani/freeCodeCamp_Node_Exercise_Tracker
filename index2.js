const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const fs = require("fs");
const { uuid } = require('uuidv4');

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const dbPath = "./public/db.json";

// Create an empty database if it doesn't exist
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({ users: [] }));
}

// Define routes
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.route("/api/users")
  .post(async (req, res) => {
    const { username } = req.body;
    try {
      const dbData = JSON.parse(fs.readFileSync(dbPath));
      const newUser = {
        _id:  uuid(), // Generate a unique ID for the user
        username: username,
        log: [],
      };
      dbData.users.push(newUser);
      fs.writeFileSync(dbPath, JSON.stringify(dbData));
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
      const dbData = JSON.parse(fs.readFileSync(dbPath));
      const users = dbData.users.map((user) => ({
        username: user.username,
        _id: user._id,
      }));
      console.log("Listed all the users successfully.");
      res.json(users);
    } catch (err) {
      console.error(`Error listing users: ${err}`);
      res.status(500).json({ error: "Failed to list users" });
    }
  });

app.route("/api/users/:_id")
  .get(async (req, res) => {
    const userId = req.params._id;
    try {
      const dbData = JSON.parse(fs.readFileSync(dbPath));
      const user = dbData.users.find((u) => u._id === userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      console.log("Retrieved user by _id:", user);
      res.json(user);
    } catch (err) {
      console.error(`Error retrieving user: ${err}`);
      res.status(500).json({ error: "Failed to retrieve user" });
    }
  });

app.route("/api/users/:_id/exercises")
  .post(async (req, res) => {
    const userId = req.params._id;
    const { description, duration, date } = req.body;
    try {
      const dbData = JSON.parse(fs.readFileSync(dbPath));
      const user = dbData.users.find((u) => u._id === userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const exercise = {
        description: String(description),
        duration: Number(duration),
        date: date ? new Date(date) : new Date(),
      };

      user.log.push(exercise);
      fs.writeFileSync(dbPath, JSON.stringify(dbData));
      console.log("Exercise successfully added.");
      res.json({
        username: user.username,
        _id: user._id,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
      });
    } catch (err) {
      console.error(`Error adding exercise: ${err}`);
      res.status(500).json({ error: "Failed to add exercise" });
    }
  });

app.route("/api/users/:_id/logs")
  .get(async (req, res) => {

    req.query.to ? toDate = new Date(req.query.to) : toDate = new Date();
    console.log(toDate)
    req.query.from ? fromDate = new Date(req.query.from) : fromDate = new Date(0);
    console.log(fromDate)
    req.query.limit ? limitUsers = req.query.limit : limitUsers = Infinity
    console.log(limitUsers)

    const userId = req.params._id;

    try {
      const dbData = JSON.parse(fs.readFileSync(dbPath));
      let user = dbData.users.find((u) => u._id === userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      user.log = user.log.slice(0, limitUsers)
      user.log.forEach(element => {
        element.date = new Date(element.date).toDateString()
      });
      const response = {
        _id: user._id,
        username: user.username,
        count: user.log.length,
        log: user.log
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

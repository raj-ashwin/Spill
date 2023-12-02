//jshint esversion:6
require("dotenv").config();
// var md5 = require('md5');
const bcrypt = require("bcrypt");
const saltRounds = 10;
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const app = express();
const encrypt = require("mongoose-encryption");
// const { log } = require("console");
app.use(express.static("public"));
app.set("view engine", "ejs");
mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});
// var secret=process.env.SECRET;
// userSchema.plugin(encrypt,{secret:secret,encryptedFields:["password"]});

const User = new mongoose.model("User", userSchema);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", async function (req, res) {
  bcrypt.hash(req.body.password, saltRounds, async function (err, hash) {
    const newUser = new User({
      email: req.body.username,
      password: hash,
    });
    try {
      await newUser.save();
      res.render("secrets");
    } catch (err) {
      res.send("Save unsuccesfull");
    }
  });
});

app.post("/login", async function (req, res) {
  // console.log(password);
  const username = req.body.username;
  const password = req.body.password;

  async function checkUser(username, password) {
    //... fetch user from a db etc.
    try {
      const foundUser = await User.findOne({ email: username });
      if (!foundUser) {
        res.send("User not found");
      }
      const match = await bcrypt.compare(password, foundUser.password);
      if (match) {
        //login
        res.render("secrets");
        console.log("Logged in successfully");
      } else {
        res.send("INCORRECT CREDENTIALS");
      }
    } catch (err) {
      console.log(err);
    }
  }
  checkUser(username, password);
});

app.listen(3000, function () {
  console.log("Server started at port 3000");
});

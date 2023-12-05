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
const session = require("express-session");
const passport = require("passport");
const passLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
// const { log } = require("console");
app.use(express.static("public"));
app.set("view engine", "ejs");
mongoose.connect("mongodb://localhost:27017/userDB");
app.use(
  session({
    secret: "this is my secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String,
});

userSchema.plugin(passLocalMongoose);
userSchema.plugin(findOrCreate);
// var secret=process.env.SECRET;
// userSchema.plugin(encrypt,{secret:secret,encryptedFields:["password"]});

const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      // console.log(profile);
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

app.get("/", function (req, res) {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect secrets.
    console.log("Logged in")
    res.redirect("/secrets");
  }
);

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", async function (req, res) {
  const submittedSecret = req.body.secret;
  // console.log(submittedSecret);
  // console.log(req.user._id);
  try {
    const foundUser = await User.findById(req.user._id);
    foundUser.secret = submittedSecret;
    foundUser.save();
    res.redirect("/secrets");
  } catch (err) {
    console.log(err);
  }
});

app.get("/secrets", async function (req, res) {
  try {
    const foundUsers = await User.find({ secret: { $ne: null } });
    res.render("secrets", { usersWithSecrets: foundUsers });
    // console.log(foundUsers);
  } catch (err) {
    console.log(err);
  }
});
app.post("/register", async function (req, res) {
  const username = req.body.username;
  const password = req.body.password;
  // bcrypt.hash(req.body.password, saltRounds, async function (err, hash) {
  //   const newUser = new User({
  //     email: req.body.username,
  //     password: hash,
  //   });
  //   try {
  //     await newUser.save();
  //     res.render("secrets");
  //   } catch (err) {
  //     res.send("Save unsuccesfull");
  //   }
  // });
  const foundUser = await User.findOne({ email: username });
  if (foundUser) {
    res.send("UserName already exited");
  } else {
    User.register({ username: username }, password, function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          // console.log("saved sucessfully");
          res.redirect("/secrets");
        });
      }
    });
  }
});

app.post("/login", function (req, res) {
  // console.log(password);
  // async function checkUser(username, password) {
  //   //... fetch user from a db etc.
  //   try {
  //     const foundUser = await User.findOne({ email: username });
  //     if (!foundUser) {
  //       res.send("User not found");
  //     }
  //     const match = await bcrypt.compare(password, foundUser.password);
  //     if (match) {
  //       //login
  //       res.render("secrets");
  //       console.log("Logged in successfully");
  //     } else {
  //       res.send("INCORRECT CREDENTIALS");
  //     }
  //   } catch (err) {
  //     console.log(err);
  //   }
  // }
  // checkUser(username, password);
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (err) {
    // console.log("im here");
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        console.log("Logged in");
        res.redirect("/secrets");
      });
    }
  });
});

app.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    else{
      res.redirect("/");
      console.log("Session ended")
    }
  });
});

app.listen(3000, function () {
  console.log("Server started at port 3000");
});

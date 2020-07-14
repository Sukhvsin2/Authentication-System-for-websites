//jshint esversion:6

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session")
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')


const app = express();
app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
mongoose.set("useCreateIndex", true);
// Session
app.use(session({
  secret: "My secret",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


// Setting Schema & Database Connectivity
mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});
const userSchema = new mongoose.Schema({
  email: {
    type:String,
    unique: true
  },
  password: String,
  googleId: String
});
// Plugins
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("user", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user._id);
    // if you use Model.id as your idAttribute maybe you'd want
    // done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// Setting for auth for google
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// Home Route
app.route("/")
.get(function(req,res){
  res.render("home");
});


// Secrets page route
app.route("/secrets")
.get(function(req,res){
  if(req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login");
  }
});

// Login route
app.route("/login")
.get(function(req,res){
  res.render("login");
})
.post(function(req,res){
  const newUser = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(newUser, function(err){
    if(!err){
       console.log("Logged in");
       passport.authenticate("local")(req,res, function(){
         res.redirect("/secrets");
       });
    }
  });
});

// Google auth
app.route("/auth/google")
.get(
  passport.authenticate('google', { scope: ['profile'] })
);

// After auth from Google
app.get('/auth/google/secrets',
  passport.authenticate('google', { successRedirect: '/secrets',failureRedirect: '/login' })
);

// logout
app.route("/logout")
.get(function(req,res){
  req.logout();
  res.redirect('/');
});


// Register route
app.route("/register")
.get(function(req,res){
  res.render("register");
})
.post(function(req,res){
  User.register({username: req.body.username}, req.body.password, function(err, found){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req,res, function(){
        res.redirect("/secrets");
      });
    }
  });
});




app.listen("3000", function(){
  console.log("Server at 3000");
});

//jshint esversion:6

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session")
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");



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
  password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("user", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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

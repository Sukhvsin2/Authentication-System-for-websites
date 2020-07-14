//jshint esversion:6

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
  email: {
    type:String,
    unique: true
  },
  password: String
});


userSchema.plugin(encrypt,{secret: process.env.SECRET, encryptedFields: ['password'] });

const User = mongoose.model("user", userSchema);


// Home Route
app.route("/")
.get(function(req,res){
  res.render("home");
});

// Register route
app.route("/register")
.get(function(req,res){
  res.render("register");
})
.post(function(req,res){
  const newUser = new User({
    email : req.body.username,
    password : req.body.password
  });

  newUser.save(function(err){
    if(!err){
      console.log("Sucessfully saved user in DB");
      res.redirect("/login");
    }else{
      console.log(err);
    }
  });
});

// Login route
app.route("/login")
.get(function(req,res){
  res.render("login");
})
.post(function(req,res){
  const username = req.body.username;
  const password = req.body.password;


// Logout Route
// app.route('/logout')
// .get();

  User.findOne({email:username, password: password},function(err,founded){
    res.render('secrets');
  });
});

app.listen("3000", function(){
  console.log("Server at 3000");
});

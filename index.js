//importing express library
const express=require('express');
const app=express();

require('dotenv').config()
//importing lodash library for array operations like sorting etcnot much  required here)
var _ = require("lodash");

//importing jwt library
var jwt = require('jsonwebtoken');

//importing passport middle ware
var passport = require("passport");
//importing library for passport to use jwt
var passportJWT = require("passport-jwt");

//importing body parser library and methods are initialized
const bodyParser=require('body-parser');
const urlencodedParser=bodyParser.urlencoded({extended:true})

//methods in passport are initialised
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;


app.use(express.static('public'));
app.use(bodyParser.json());
app.use(urlencodedParser);
app.use(passport.initialize());


//sequelize
const Sequelize = require('sequelize');
const connection = new Sequelize(process.env.DB_NAME,process.env.DB_USERNAME,process.env.DB_PASSWORD,{
  dialect:'postgres',operatorsAliases: true
});

//establishing connection
const Users = connection.define('users',{
  name:Sequelize.STRING,
  password:Sequelize.STRING,
  address:Sequelize.STRING
});

//syncronizing with database table created inorder to initialise table
Users.sync({force: true}).then(() => {
//dummy users
Users.create({
  name:'nithin',
  password: 'nithin7',
  address:'adsdas'
})
Users.create({
  name:'sidharth',
  password:'sid7',
  address:'adsdas'
})
});

//jwt object initialisation
var jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = process.env.SECRETKEY;

//passport Strategy declaration
var strategy = new JwtStrategy(jwtOptions, function(jwt_payload, next) {
  console.log('payload received', jwt_payload);
  // usually this would be a database call:
  //var user = users[_.findIndex(users, {id: jwt_payload.id})];
  const userid = parseInt(jwt_payload.id);
  Users.findById(userid).then(function(user){
   if (user) {
    next(null, user);
   }
   else {
    next(null, false);
   }
  });
});

passport.use(strategy);

//homepage
app.get('/api/home',(req,res)=>{
  res.send("happyness");
});

//login page
app.post("/login", function(req, res) {
  console.log(req.body);
  if(req.body.name && req.body.password){
    var username = req.body.name;
    var password = req.body.password;
  }
  Users.findOne({
    where:{
      name:username,
    }
  }).then(function(user){
    if( ! user ){
      res.status(401).json({message:"no such user found"});
    }
    else{
      if(user.password === req.body.password) {
        // from now on we'll identify the user by the id and the id is the only personalized value that goes into our token
        var payload = {id: user.id};
        var token = jwt.sign(payload, jwtOptions.secretOrKey);
        res.json({message: "ok", token: token});
      }
      else {
        res.status(401).json({message:"passwords did not match"});
      }
    }
  })
})

//listing all users data.
app.get("/api/users", passport.authenticate('jwt', { session: false }), function(req, res){
  Users.findAll().then(function(users){
    res.send(users);
  });
});


//listing a single user's details
app.get("/api/users/:id", passport.authenticate('jwt', { session: false }), function(req, res){
  const user = parseInt(req.params.id);
  Users.findById(user).then(function(users){
    res.send(users.dataValues);
  });
});

//adding new user
app.post("/api/users/new", passport.authenticate('jwt', { session: false }), function(req, res){
    console.log(req.body);
    Users.create({
      name: req.body.name,
      password:req.body.password,
      address:req.body.address
    }).then(()=>{
      Users.findAll().then(function(users){
        res.send(users);
      });
    })
});

//updating user information
app.post("/api/users/update/:id", passport.authenticate('jwt', { session: false }), function(req, res){
  const user = parseInt(req.params.id);
  Users.findById(user).then(function(user){
    user.name = req.body.name,
    user.password=req.body.password,
    user.address=req.body.address
      user.save().then(() => {
        Users.findAll().then(function(users){
          res.send(users);
        });
      })
  });
});

//deleting a user
app.get("/api/users/delete/:id", passport.authenticate('jwt', { session: false }), function(req, res){
  const user = parseInt(req.params.id);
  Users.destroy({
    where:{
      id:user
    }
  }).then(()=>{
    Users.findAll().then(function(users){
      res.send(users);
    })
  });
});


//listening
app.listen(1081,() => console.log("listening on 1081"));

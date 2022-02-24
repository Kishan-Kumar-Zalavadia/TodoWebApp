const express = require('express');
const colors = require('colors');
const mongoose = require('mongoose'),
  passport = require("passport"),
  bodyParser = require("body-parser"),
  LocalStrategy = require("passport-local"),
  passportLocalMongoose =
      require("passport-local-mongoose"),
  User = require("./models/user");
  flash = require("connect-flash");
const app = express();
app.use(express.json());
app.use(flash());
app.use(express.urlencoded());
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(require("express-session")({
  secret: "This is a secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Connect to database
// Note that the database name is todoDB
mongoose.connect(
  'mongodb://localhost:27017/todoDB',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  },
  (err) => {
    if (err) console.log(err);
    else console.log('Successfully Connected');
  }
);

// Create the mongoose schema
// Note the _id is automatically added by mongodb
const todoSchema = new mongoose.Schema({
  username: String,
  data: String,
});

// Create a model using the schema
// Use singular naming convention
const Todo = mongoose.model('Todo', todoSchema);

/*
Note: This is the original todoList item, we have
      not changed this, just incase of id, we will now have
      a default generated "_id" by mongodb.

let todoList = [
  {
    id: 1,
    data: 'Welcome to EJS TodoList Example',
  },
  {
    id: 2,
    data: 'Write below to add your todo',
  },
  {
    id: 3,
    data: '<-- Click here to delete your todo',
  },
];
*/

/*
Note: 1. Docs are the document inserted by the user,
         or received from database, if you wish, you could use more
         specific term like "item" or "todoItem" etc. 

      2. Mongodb automatically creates id so no need to explicitly
         add it.
*/
// Show home page
app.get("/", function (req, res) {
  res.render("home");
});

// Showing register form
app.get("/register", function (req, res) {
  res.render("register");
});

// Handling user signup
app.post("/register", function (req, res) {
  var username = req.body.username
  var password = req.body.password
  var email = req.body.email
  var name = req.body.name
  User.register(new User({ username: username, email: email, name:name }),
          password, function (err, user) {
      if (err) {
          console.log(err);
          return res.render("register");
      }

      passport.authenticate("local")(req, res, function () {
            // Redirect to home page/route
            res.redirect('/index');
      });
  });
});

//Showing login form
app.get("/login", function (req, res) {
  const err = req.flash("error");
  const errMsg = err && err.length > 0 ? err[0] : ""; 
  res.render("login",{msg: errMsg});
});

//Handling user login
app.post("/login", passport.authenticate("local", {
  successRedirect: "/index",
  failureRedirect: "/login",
  failureFlash: true
}), function (req, res) {
});

//Handling user logout
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}


// When hit this route, the todo will be fetched to the database
app.get('/index', isLoggedIn, (req, res) => {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const date = new Date();
  const today = date.toLocaleDateString('en-US', options);

  // Fetch todo from the database and render the HTML
  Todo.find({username: req.user.username}, (err, docs) => {
    if (!err) {
      res.render('index', { date: today, todoList: docs });
    } else {
      console.log('Error: ', err);
    }
  });
});

// When hit this route, the todo will be inserted to the database
app.post('/add', (req, res) => {
  const todo = req.body.todo;

  // Insert todo to database
  // Create method will create a new document and insert into collection
  // Always use create method, because insertOne / Many is not available to a model.
  Todo.create(
    {
      username: req.user.username,
      data: todo,
    },
    (err, docs) => {
      if (!err) console.log('Success', docs);
      else console.log('Error', err);
    }
  );

  // Redirect to home page/route
  res.redirect('/index');
});

// This route will delete the todo based on its ID
app.post('/delete', (req, res) => {
  const { checkbox_id } = req.body;

  // Delete the specific todo if the _id matches the checkbox_id
  Todo.deleteOne({ _id: checkbox_id }, (err) => {
    if (!err) res.redirect('/index');
    else console.log('Error: ', err);
  });
});

//Insert data into tofoForm collection
app.post('/addForm', (req, res) => {
  console.log(req.body);  
  const todoForm = {
      name:req.body.name,
      email:req.body.email,
      phone:req.body.phone,
      comment:req.body.comment
      
  
  }
  
  var MongoClient = require('mongodb').MongoClient;
  MongoClient.connect("mongodb://localhost:27017/", function(err, db) {
    if (err) throw err;
    var dbo = db.db("todoDB");

    dbo.collection("todoForm").insertOne(todoForm, function(err, res) {
      if (err) throw err;
      console.log("Data Inserted");
      db.close();
    });
  });

  // Redirect to home page/route
  
});


app.get('/about',(req,res)=>{
  res.render('about.ejs');
});

app.get('/instructions', (req, res) => {
  res.render('instructions.ejs');
});

app.get('/developer',(req,res)=>{
  res.render('developer.ejs');
});

app.get('/form',(req,res)=>{
  res.render('form.ejs');
});

app.get('/index',(req,res)=>{
  res.redirect('/index');
});

app.get('/profile',(req,res)=>{

  res.render('profile.ejs', {data: req.user});
});




app.listen(5000, (req, res) => {
  console.log('Server started on port 5000');
});


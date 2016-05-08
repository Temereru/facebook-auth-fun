var express = require('express');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var mongoose = require('mongoose');
var expressJWT = require('express-jwt');

mongoose.connect('mongodb://localhost/facebook-auth-fun');

var app = express();

var User = require('./UserModel')

app.use(passport.initialize());
app.use(passport.session());

// used to serialize the user for the session
passport.serializeUser(function(user, done) {
  done(null, user);
});

// used to deserialize the user
passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

passport.use(new FacebookStrategy({
  clientID: '1041659602537716',
  clientSecret: '78c17b4ebb9c5e4def8d72756155eab8',
  callbackURL: "http://localhost:8000/auth/facebook/callback",
  profileFields: ['id', 'displayName', 'photos', 'email']
},
function(accessToken, refreshToken, profile, done){
  return done(null, profile);
}
));

app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email']}));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    successRedirect : '/profile',
    failureRedirect : '/facebookCanceled'
  }));

app.get('/profile', function(req, res) {
  User.findOne({id: req.user.id}, function(error, user){
    if(!user){
      user = new User();
      user.id = req.user.id;
      user.displayName = req.user.displayName;
      user.emails = req.user.emails;
      user.save(function(err, user){
        if (err) { return next(err); }
      })
      res.render('profile.ejs', {
        user : user, // get the user out of session and pass to template
        token : user.generateJWT()
      });
    }else{

      res.render('profile.ejs', {
        user : user, // get the user out of database and pass to template
        token : user.generateJWT()
      });
    }
  })
  
});

app.get('/facebookCanceled', function(req, res) {
  res.send("fail!");
});

app.get('/logout', function(req, res){
  req.logout();
  res.send('Logged out!');
})

app.listen(8000);
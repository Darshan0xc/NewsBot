var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var User = require('./Model/user.js');
var schedule = require('node-schedule');
var mongoose = require('mongoose');

var index = require('./routes/index');
var users = require('./routes/users');

//Install Mongoose.
//https://scotch.io/tutorials/using-mongoosejs-in-node-js-and-mongodb-applications
//https://www.youtube.com/watch?v=Tyh_1sLghyE
//Min: 21:02
//Repair MongoDB: https://docs.mongodb.com/manual/tutorial/recover-data-following-unexpected-shutdown/
mongoose.connect('mongodb://localhost/test');

//node-schedule Module
var j = schedule.scheduleJob('0 9 * * *', function(){
    
    User.find({}, function(err, users) {
      if(err) {
        console.log(err);
      }
      if(users != null) {
        index.getArticles(function(err, articles) {
          if(err) {
            console.log(err);
          }
          users.forEach(function(user) {
            index.sendArticleMessage(user.fb_id, articles[0]);
          });
        });
      }   
    });
});


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

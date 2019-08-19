var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var indexRouter = require('./routes/index');
var apiRouter = require('./routes/api');
var app = express();
var debug = require('debug')('pulse-hub:bot');
var bb = require('express-busboy');
let bodyParser = require('body-parser');
let multer = require('multer')
process.env.DEBUG = 'pulse-hub:server,pulse-hub:bot';
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
//app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: '1Q@kdmg*394+&/'
}));
var contains = function (needle) {
  // Per spec, the way to identify NaN is that it is not equal to itself
  var findNaN = needle !== needle;
  var indexOf;

  if (!findNaN && typeof Array.prototype.indexOf === 'function') {
    indexOf = Array.prototype.indexOf;
  } else {
    indexOf = function (needle) {
      var i = -1,
        index = -1;

      for (i = 0; i < this.length; i++) {
        var item = this[i];

        if ((findNaN && item !== item) || item === needle) {
          index = i;
          break;
        }
      }

      return index;
    };
  }

  return indexOf.call(this, needle) > -1;
};
/*app.use((req, res, next) => {

  // -----------------------------------------------------------------------
  // authentication middleware

  const auth = {
    login: 'leader+',
    password: '%6r^C@X7zKX95<v'
  } // change this

  // parse login and password from headers
  const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
  const [login, password] = new Buffer(b64auth, 'base64').toString().split(':')

  // Verify login and password are set and correct
  if (login && password && login === auth.login && password === auth.password) {
    // Access granted...
    return next()
  }

  // Access denied...
  res.set('WWW-Authenticate', 'Basic realm="401"') // change this
  res.status(401).end('Authentication required.') // custom message
  console.log('Unauthorized access from ' + req.ip);
  // -----------------------------------------------------------------------

}) */
app.use('/*', (req, res, next) => {
  if (req.url !== "/api/user/edit-details") {
    app.use(express.urlencoded({
      extended: false
    }));
    next();
  } else {
    next();
  }
})
var urlencodedParser = bodyParser.urlencoded({
  extended: false
})
app.use(/^((?!\/api\/user\/edit-details).)*$/, urlencodedParser)
app.use('/', indexRouter);
app.use('/api', apiRouter);
// catch 404 and forward to error handler
app.get('*', function (req, res) {
  res.status(404).send('This page is under construction. ');
});
// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;
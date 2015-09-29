var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var app = express();
var http = require('http');
var config = require('config');
var debug = require('debug')('logger:server');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jsx');
app.engine('jsx', require('express-react-views').createEngine({
    beautify: true
}));


// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var myLogger = require('../index');
var logtest = myLogger(config.logging);

app.use(function(req, res, next){
    req.session = {
        fullName: "John Smith Jr",
        firstName: "John",
        lastName: " Smith"
    };

    next();
});


app.use('/', routes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');

    logtest.warn("Page not found", req);
    
    err.status = 404;
    res.render('error', {
        message: err.message,
        error: err
    });
});

// error handlers


// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        
        logtest.error(err.message, req, {test3: "1", test4: "2"});
        logtest.metric("test metric", {test: "1", test1: "2"});

        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    logtest.error(err.message, req);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


/**
 * Normalize a port into a number, string, or false.
 */
var port = (function(val){
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;

})(process.env.PORT || '3000');

/**
 * Get port from environment and store in Express.
 */

app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);

/**
 * Event listener for HTTP server "error" event.
 */
server.on('error', function(error){
    if (error.syscall !== 'listen') {
        logtest.error(error);
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            logtest.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            logtest.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            logtest.error(error);
            throw error;
    }
});

/**
 * Event listener for HTTP server "listening" event.
 */
server.on('listening', function(){
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
});

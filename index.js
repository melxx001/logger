'use strict';

var winston = require('winston');
var amqp = require('amqp');
var util = require('util');
var middleWare = require('./lib/middleware');
var debug = require('debug')('logger:index');
var uuid = require('node-uuid');
var http = require('http');
var _ = require('lodash');
var mkdirp = require('mkdirp');
var path = require('path');
var publish;
var buffer = [];
var levels = {
    silly: 0,
    debug: 1,
    verbose: 2,
    info: 3,
    warn: 4,
    error: 5,
    fatal: 6,
    metric: 7      // Added Metric at the hignest level so it will always output
};

var logLevels = {
    silly: "silly",
    debug : "debug",
    info : "info",
    error : "error",
    warn : "warn",
    verbose: "verbose",
    fatal: "fatal",
    metric: "metric"
};

var NODE_ENV = process.env.NODE_ENV || 'development';

var AMQP = winston.Transport.AMQP = function(options){
    options = options || {};

    if(!(options.connection && options.connection.host && options.connection.vhost && options.connection.login && options.connection.password)){
        debug("Connection data missing");
        return;
    }

    this.name = options.name;
    this.application = options.application;
    this.applicationVersion = options.applicationVersion,
    this.level = options.level;

    var self = this;
    var connectionData = {
        host: options.connection.host,
        vhost: options.connection.vhost,
        port: options.connection.port || 5671,
        connectionTimeout: options.connection.connectionTimeout || 10000,
        authMechanism: options.connection.authMechanism || 'PLAIN',
        login: options.connection.login,
        password: options.connection.password
    };

    
    if(!options.connection.ssl){
        options.connection.ssl = {};
    }

    // Add ssl data
    connectionData.ssl = {
        enabled: options.connection.ssl.enabled || false,
        keyFile: options.connection.ssl.keyFile || '',
        certFile: options.connection.ssl.certFile || '',
        caFile: options.connection.ssl.caFile || '',
        rejectUnauthorized: options.connection.ssl.rejectUnauthorized || true
    };

    var amqpOptions = { 
        defaultExchangeName: options.exchange.defaultExchangeName || '',
        reconnect: options.connection.reconnect || true,    //If true, then the driver will attempt to reconnect using the configured strategy any time the connection becomes unavailable
        reconnectBackoffStrategy: options.connection.reconnectBackoffStrategy || 'linear', // Valid strategies are "linear" and "exponential". Under the "linear" strategy, the driver will pause reconnectBackoffTime ms before the first attempt, and between each subsequent attempt. Under the "exponential" strategy, the driver will pause reconnectBackoffTime ms before the first attempt, and will double the previous pause between each subsequent attempt until a connection is reestablished.
        reconnectExponentialLimit: options.connection.reconnectExponentialLimit || 120000, 
        reconnectBackoffTime: options.connection.reconnectBackoffTime || 1000 // Backoff times are in milliseconds
    };

    debug("connectionData", JSON.stringify(connectionData));
    debug("amqpOptions", JSON.stringify(amqpOptions));

    var connection = amqp.createConnection(connectionData, amqpOptions);

    connection.on('ready', function () {
        debug('connection is ready');
        var exchangeOptions = options.exchange.exchangeOptions;
        exchangeOptions.confirm = true;    // This will make the exchange function call run the callback

        var publishOptions = options.exchange.publishOptions;
        publishOptions.headers = {data_type: 12};

        debug("exchangeOptions" , JSON.stringify(exchangeOptions));
        connection.exchange(options.exchange.name, exchangeOptions, function(exchange) {
            debug('exchange is ready - publishing message to ' + options.exchange.name);

            publish = function(logObject, callback){
                var message = getMessage.call(self, logObject);
                var routingKey = (logObject.level === logLevels.metric) ? options.exchange.routingKey.metric : options.exchange.routingKey.error

                debug("Message to publish:");
                debug(message);
                
                exchange.publish(routingKey, message, publishOptions, function(err){
                    debug((err) ? err : 'Message published') ;
                    self.emit('done') ;
                    callback && callback(err ? new Error() : null, !err);
                });
            };

            // Now that we're connected
            // play back any buffered log events that we saved before the publish function existed
            if (buffer.length > 0) {
                buffer.forEach(function(key, i){
                    key.logger.log.apply(key.logger, key.args);
                });
                buffer = [] ;
            }
        });
    });

    connection.once('error', function (err) {
        var error = JSON.stringify(err);
        console.log(error, 'Error connecting to RabbitMQ. Check your connection settings.');

        if(err.code.toUpperCase() !== 'ECONNRESET'){
            debug("Error emitted", error);
        }else{
            debug("Error emitted after disconnection", error);
        }
    });

    self.on('done', function (err) {
        //Do something when the message is published.
    });
}

util.inherits(AMQP, winston.Transport); // Have AMQP inherit the prototype method from winston.Transport

// Create a log method. This is needed when you want to add AMQP as a tranport
AMQP.prototype.log = function (level, msg, meta, err) {
    // Initially the publish function doesn't exist
    // Save the messaged into a buffer to be used when the publish function exists
    if (!publish) {
        buffer.push({logger: this, args:[level,msg,meta]});
        err && err(null, true);
    }
    else {
        publish({
            meta: meta,
            message: msg,
            level: level
        }, err);
    }
}

function getMessage(logObject){
    var request = {};
    var session = {};

    if(logObject && logObject.meta){
        request = logObject.meta;
        session = (logObject.meta.session) ? logObject.meta.session : {};
    }

    return {
        hostname: require('os').hostname(),
        '@timestamp': (new Date()).toISOString(),
        logger_name: this.name,
        application: this.application,
        application_version: this.applicationVersion,
        level: logObject.level,
        request_method: request.method || "",
        request_id: uuid.v1(),
        headers: request.headers || "",
        session_id: session.SessionId || "",
        description: logObject.message,
        cookies: request.cookies || "",
        original_url: request.originalUrl || "",
        url: request.url || "",
        category: logObject.meta.category || "",
        subcategory: logObject.meta.subCategory || "",
        company_id: session.CompanyID || -1,
        company_name: session.CompanyName || "",
        login_id: session.EMAIL1 || "",
        user_id: session.UserID || -1,
        browser_number: session.browserNumber || "",
        browser_ver: session.browserVer || "",
        prod_status: logObject.environment || "development",
        datacenter_location: logObject.environment || "development",
        event_kind: (logObject.level === 'metric') ? logLevels.metric : logLevels.error,
        exception_data: logObject.meta.exceptionData || {},
        metric_data: logObject.meta.extraData || {}
    };
}

function fixMetaData(data){
    // TO DO: if metadata is not an object
    return (data) ? data : {};
}

function getLoggingOptions(options){
    var ampqOptions = {};
    options = options || {}
    options.amqp = options.amqp || {connection: {}, exchange: {}}
    _.assign(ampqOptions, options.amqp);

    return {
        options: options.description,
        ampqOptions: ampqOptions,
        consoleOptions: (options.logType && options.logType.console) ? options.logType.console : {},
        logFileOptions: (options.logType && options.logType.logFile) ? options.logType.logFile : {}
    };
}

function concurLogger(loggingOptions) {
    var optionsObj = getLoggingOptions(loggingOptions);
    var options = optionsObj.options || {};
    var consoleOptions = optionsObj.consoleOptions || {};
    var logFileOptions = optionsObj.logFileOptions || {};
    var ampqOptions = optionsObj.ampqOptions || {};

    // Logging defaults
    var defaults = {exitOnError: false, handleExceptions: true, level: logLevels.error };
    var optionDefaults = {};
    var consoleOptionsDefaults = {enabled: false, prettyPrint: true, depth: 1, timestamp: true };
    var logFileOptionsDefaults = { 
        enabled: false, 
        "maxsize": 200000, 
        timestamp: true, 
        name: logLevels.error, 
        level: logLevels.error, 
        filename: ["./logs/", logLevels.error, ".log"].join(""), 
        json: true, 
        datePattern: ".yyyy-MM-ddTHH" 
    };
    var ampqOptionDefaults = {enabled: false, name: "Winston", application: "logs", applicationVersion: ""};

    //Populate the various options and override the defaults 
    _.assign(consoleOptionsDefaults, defaults, consoleOptions, {colorize: false}); // colorize is set to false because it caused a "Cannot read property 'match' of undefined" error
    _.assign(logFileOptionsDefaults, defaults, logFileOptions);
    _.assign(optionDefaults, defaults, options);
    _.assign(ampqOptionDefaults, defaults, ampqOptions);

    debug("optionDefaults", JSON.stringify(optionDefaults));
    debug("ampqOptionDefaults", JSON.stringify(ampqOptionDefaults));
    debug("consoleOptionsDefaults", JSON.stringify(consoleOptionsDefaults));
    debug("logFileOptionsDefaults", JSON.stringify(logFileOptionsDefaults));

    var logger = new (winston.Logger)(optionDefaults);
    logger.setLevels(levels);    // Add custom logger levels

    // Add the various transports
    debug("Adding transports to logger");
    if (ampqOptionDefaults.enabled) {logger.add(AMQP, ampqOptionDefaults);}
    if (consoleOptionsDefaults.enabled) {logger.add(winston.transports.Console, consoleOptionsDefaults);}
    if (logFileOptionsDefaults.enabled){
        mkdirp(path.dirname(logFileOptionsDefaults.filename));    // Create the log folder if it doesn't exist
        logger.add(winston.transports.DailyRotateFile, logFileOptionsDefaults);
    }

    logger.log = function (level, msg, meta) {
        debug(level, msg);
        winston.Logger.prototype.log.apply(this, [level, msg, meta]);
    }

    Object.keys(logLevels).forEach(function(type){
        debug("Added", type, "function");
        logger[type] = function (msg, meta) {
            meta = fixMetaData(meta); 

            var obj = meta || {
                session: {}
            };

            if(type !== logLevels.metric){
                var winstonAllInfo = winston.exception.getAllInfo(msg);
                obj.exceptionData = {
                    complete: JSON.stringify(winstonAllInfo),
                    message: msg.toString(),
                    stack_trace: (winstonAllInfo.stack) ? winstonAllInfo.stack.join("\n") : ""
                };
            }else{
                obj.extraData = _.toPlainObject(meta);  // So we can avoid circular references when converting to JSON
            }

            obj.environment = NODE_ENV ;
            logger.log(type, msg, obj);
        };
    });

    logger.loggerMiddleware = function loggerMiddleware() {
        return middleWare({
          winstonInstance: logger
        });
    }

    return logger;
}

module.exports = concurLogger;


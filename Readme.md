#      Logger

This module will log errors and metrics via RabbitMQ to Elasticsearch and errorservices. IT also has the ability to log to a file and to the console.

## Installation 
Prior to publishing to npm, you can install using:

```
npm install git+ssh://git@github.com:melxx001/logger.git --save 
```

## Usage
#### 1.- Set up Minimum Configuration file
```
{
  "logging": {
    "description":{
        "name": "Winston-errors",     // name of logger
        "application": "Logs",    // application name
        "applicationVersion": ""      // application version
    },
    "amqp": {
        "enabled" : false,     // Must set this to true to enable logging to Elasticsearch and error services
        "level": "error"       // The severity level to log
        "connection": {
            "vhost": "",          // RabbitMQ vhost - required
            "host": "",           // RabbitMQ host IP - required
            "login": "",          // RabbitMQ login - required
            "password": ""        // RabbitMQ password - required
        }
    }   
  }
}
```
#### 2.- Reference in code
```
var myLogger = require('logger');
var logger = myLogger(config.logging);
```
#### 3.- Error Logging
```
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    logger.error(err);

    res.render('error', {
        message: err.message,
        error: err
    });
});
```

#### 4.- Metric Logging
```
app.use(function(req, res, next) {
    logger.metric("First metric");
    logger.metric("Second metric", {
        measurement1: 10,
        measurement2: 20
    });
    next();
});
```

#### 5.- See the logs
If enabled, the logs can be viewed:
- in a log folder you defined in the configuration
- in the console
- in elasticsearch via RabbitMQ (This will change)

#### 6.- Available functions
Logging is dependent on the severity level set. The severity levels in descending order of importance are as follows :
``` metric, fatal, error, warn, info, debug. ```
```
logger.debug("message");
logger.info("message");
logger.warn("message");
logger.error("message");
logger.fatal("message");
logger.metric("message");
```

### Full Configuration file Information
The example below contains the default values. Only the required values must be populated.
```
{
  "logging": {
    "description":{
      "name": "Winston-errors",
      "application": "Logs",
      "applicationVersion": ""
    },
    "amqp": {
        "enabled" : false,                  // Must set this to true to enable logging to Elasticearch
        "level": "error",                   // The severity level to log
        "connection": {                     // RabbitMQ connection settings 
          "vhost": "",                      // RabbitMQ vhost - required
          "host": "",                       // RabbitMQ host IP - required
          "login": "",                      // RabbitMQ login - required
          "password": "",                   // RabbitMQ password - required
          "port": 5672,                             // defaults to 5672
          "connectionTimeout": 10000,
          "reconnect": true,                        // Reconnect if connection dies
          "reconnectBackoffStrategy": "linear",
          "reconnectExponentialLimit": 120000,
          "reconnectBackoffTime": 1000,
          "ssl": { 
            "enabled" : false,              // Enables SSL (Populate the properties below if enabled)
            "keyFile" : "",                 // ex: /path/to/key/file    
            "certFile" : "",                // ex: /path/to/cert/file
            "caFile" : "",                  // ex: /path/to/cacert/file
            "rejectUnauthorized" : true
           },
          "authMechanism": "PLAIN"
        },
        "exchange": {       // RabbitMQ exchange settings
          "defaultExchangeName": "",
          "name" : "logging.topic",
          "exchangeOptions": {
            "type": "topic"
            "passive": true
          },
          "routingKey": {
            "error": "error.json",
            "metric": "metric.json"
          },
          "publishOptions": {
            "contentType": "application/json",
            "deliveryMode": 1                   // Non-persistent (1) or persistent (2)
          }
        }
    },
    "logType": {
      "console": {
        "enabled": false,       // Setting this to true will enable console logging
        "level": "info",        // Set the severity level to display in console - defaults to info
        "prettyPrint": true,    // Makes the output look nice
        "timestamp": true,      // Add a timestamp
        "depth": 1              // How many times to recurse while formatting the object (only used with prettyPrint: true)
      },
      "logFile": {
        "enabled": false,                       // Setting this to true will enable logging to a log file
        "name": "mylogs",                     // Transport name
        "filename": "./logs/errors.log",           // Log file name and path
        "level": "error",                       // Set the severity level to display in logs
        "maxsize": 200000,                      // Max size in bytes of the logfile, if the size is exceeded then a new file is created, a counter will become a suffix of the log file
        "maxRetries": 10,                       // The number of stream creation retry attempts before entering a failed state
        "zippedArchive": true,                  // If true, all log files but the current one will be zipped
        "tailable": true,                       // If true, log files will be rolled based on maxsize and maxfiles, but in ascending order
        "logstash": true,                       // If true, messages will be logged as JSON and formatted for logstash
        "datePattern": ".yyyy-MM-ddTHH",        // Date pattern to be appended to log file name
        "timestamp": true                       // Add a timestamp
      }
    }
  }
}

```

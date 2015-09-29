var winston = require('winston');
var debug = require('debug')('logger:middleware');

module.exports = function(options){
	options = options || {};
	options.level = options.level || "info";
	options.winstonInstance = options.winstonInstance || (new winston.Logger ({ transports: options.transports }));
	return function (req, res, next){
		if (!req.session) {
			// Maybe this section does not need to be here
			options.winstonInstance.warn("Session is not available");
			debug("Logger Middleware: Session is not available");	
		}

		// We don't have a use for this middleware.
		// When we do, we can put the necessary code here.

		next();
	};	
}

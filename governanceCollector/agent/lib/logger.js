var winston = require("winston");
var path = require("path");
var config = require("../config/config");
require('winston-daily-rotate-file');
//require('winston-socket.io');

//set up logging
var logger = new(winston.Logger)({
    level: config.logging.logLevel,
    transports: [
        new(winston.transports.Console)({ colorize: true }),
        new(winston.transports.DailyRotateFile)({ filename: path.join(config.logging.logPath, config.logging.logName + ".log"), prepend: true }),

        //new(winston.transports.SocketIO)({ host: "https://" + config.gms.hostname, port: config.gms.port, secure: true, reconnect: true, log_topic: "gms" })
    ]
});



module.exports = logger;
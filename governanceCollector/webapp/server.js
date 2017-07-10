//require statements
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var config = require('./config/config');
var Promise = require('bluebird');
var fs = require('fs');
var path = require('path');
var http = require('http');
var logger = require("./lib/logger");
var socketio = require('socket.io');

launchServer();

function launchServer() {
    // /app.disable('trust proxy');
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use('/governance/public', express.static(config.webApp.publicPath));
    app.use('/governance/node_modules', express.static(config.webApp.nodeModPath));
    app.use('/governance/app', express.static(config.webApp.appPath));

    var port = config.webApp.port || 8591;


    var routes = require('./routes');


    //Register routes
    //all routes will be prefixed with api
    app.use('/governance', routes);

    console.log("Hello world");

    var server = http.createServer(app);
    server.listen(config.webApp.port, function() {
        logger.info('Governance Collector WebApp ' + config.webApp.version + ' started', { module: 'server' });
    });

    var io = new socketio(server);

    io.on('connection', function(socket) {
        socket.on("governanceCollector", function(msg) {
            console.log("governanceCollector" + "::" + msg);
            io.emit("governanceCollector", msg);
        });
    });
}
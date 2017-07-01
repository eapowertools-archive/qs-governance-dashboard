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
    app.disable('trust proxy');
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use('/governance/public', express.static(config.agent.publicPath));
    app.use('/governance/node_modules', express.static(config.agent.nodeModPath));

    var port = config.agent.port || 8592;


    var routes = require('./routes');


    //Register routes
    //all routes will be prefixed with api
    app.use('/governance', routes);

    console.log("Hello world");

    var server = http.createServer(app);
    server.listen(config.agent.port, function() {
        logger.info('Governance Collector agent version ' + config.agent.version + ' started', { module: 'server' });
    });

}
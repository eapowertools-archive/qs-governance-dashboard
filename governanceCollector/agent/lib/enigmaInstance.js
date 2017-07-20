var fs = require("fs");
var qixSchema = require("../node_modules/enigma.js/schemas/12.20.0.json");
var WebSocket = require('ws');
var senseUtilities = require('enigma.js/sense-utilities');


function buildConfig(config, identity) {
    var newConfig = {
        host: config.engine.hostname,
        port: config.engine.port,
        identity: identity
    }
    return senseUtilities.buildUrl(newConfig);
}

function enigmaInstance(config, identity) {
    var enigmaInstance = {
        schema: qixSchema,
        url: buildConfig(config, identity),
        createSocket(url) {
            return new WebSocket(url, {
                ca: [fs.readFileSync(config.certificates.root)],
                key: fs.readFileSync(config.certificates.client_key),
                cert: fs.readFileSync(config.certificates.client),
                headers: {
                    'X-Qlik-User': "UserDirectory=" + config.engine.userDirectory + ";UserId=" + config.engine.userId
                },
                rejectUnauthorized: false
            });
        }
    };
    return enigmaInstance;
}


//module.exports = buildConfig;
module.exports = enigmaInstance;
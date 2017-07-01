var fs = require("fs");
var qixSchema = require("../node_modules/enigma.js/schemas/qix/3.2/schema.json");
var WebSocket = require('ws');


function enigmaInstance(config) {
    var enigmaInstance = {
        schema: qixSchema,
        session: {
            route: "app/engineData",
            host: config.engine.hostname,
            port: config.engine.port
        },
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



module.exports = enigmaInstance;
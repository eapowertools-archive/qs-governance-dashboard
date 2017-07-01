// var socket = require('socket.io-client')("http://192.168.65.1:8591", {
//     secure: false,
//     reconnect: true
// });

var socket;

var socketHelper = {
    createConnection: function(url)
    {
        socket = require('socket.io-client')(url, {
            secure: false,
            reconnect: true
        });
    },
    sendMessage: function(app, msg) {
        socket.emit(app, msg);
    }
}

module.exports = socketHelper;
//'http://10.20.15.187:8591',
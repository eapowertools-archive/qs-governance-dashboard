var Promise = require("bluebird");
var logger = require("./logger");
var writeToXML = require("./writeToXML");

var loggerObject = {
    jsFile: "serializeAppForGovernance.js"
}

//modules for serializing app metadata for Qlik Sense Governance
//var getConnections = require('./app-connections');
var getAppTables = require('./app-tables');
var getAppScript = require('./app-script');
var getDimensions = require('./app-library-dimensions');
var getMeasures = require('./app-library-measures');
var getLibObjects = require('./app-library-masterobjects');
var getBookmarks = require('./app-bookmarks');
var getSheets = require('./app-sheets');
var getStories = require('./app-stories');


var METHODS = {
    fields: getAppTables,
    script: getAppScript,
    dimensions: getDimensions,
    measures: getMeasures,
    objects: getLibObjects,
    bookmarks: getBookmarks,
    sheets: getSheets,
    stories: getStories,
    //dataconnections: getConnections,

    //embeddedmedia: getMediaList,
    //snapshots: getSnapshots,
    //variables: getVariables,

};

var appId;
var appObj = {};

function serializeAppForGovernance(app, load_time, options) {
    return new Promise(function(resolve, reject) {
            appObj = {};
            return app.getAppProperties().then(function(properties) {
                    appObj.load_time = load_time;
                    appObj.properties = properties;

                })
                .then(function() {
                    return app.getAppLayout()
                        .then(function(layout) {
                            return appId = layout.qFileName;
                        });
                })
                .then(function() {
                    writeToXML("appProps", "appProps", appObj, appId);
                    return;
                })
                .then(function() {
                    return Promise.all(Object.keys(METHODS).map(function(key, i) {
                        return METHODS[key](app, appId, options)
                            .then(function(data) {
                                //appObj[key] = data;
                                return data;
                            });
                    }));
                })
                .then(function(resultArray) {
                    resolve(resultArray);
                });
        })
        .catch(function(error) {
            reject(error);
        });
}


module.exports = serializeAppForGovernance;
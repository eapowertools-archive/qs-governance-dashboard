const queue = require("queue")
const harvester = require("./harvester")
const refresher = require("./refresher");
const deleteFiles = require("./deleteFiles");
const path = require("path");
const bluebird = require("bluebird");

var q = queue();
q.concurrency = 1;
q.timeout = 60 * 1000 * 60;


function queueSetUp(config, options) {
    var results = [];
    console.log(q.concurrency);
    if (options.boolGenMetadata) {
        q.push(function () {
            return new Promise(function (resolve) {
                deleteFiles(config.agent.metadataPath);
                results.push('files deleted');
                console.log('files deleted');
                resolve();
            })
        })
        q.push(function () {
            return new Promise(function (resolve, reject) {
                harvester.getQrsInfos(config)
                    .then(function (result) {
                        console.log("qrsInfos complete");
                        //console.log(result);
                        resolve();
                    })
                    .catch(function (error) {
                        console.log(error)
                        reject();
                    })
            })
        })
        q.push(function () {
            return new Promise(function (resolve, reject) {
                harvester.getApplicationMetadata(config, options.appMetadata.appArray)
                    .then(function (result) {
                        // console.log(result)
                        console.log("metadata harvest complete");
                        resolve();
                    })
                    .catch(function (error) {
                        console.log(error);
                        reject();
                    })
            })
        })

        console.log(q.length);
        q.on("success", function (result, job) {
            console.log('job finished processing:', job.toString().replace(/\n/g, ''))
        })

        q.start(function (foo) {
            console.log("queue empty");
        });
    }
}

module.exports = queueSetUp;
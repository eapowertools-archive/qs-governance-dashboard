const qrsInteract = require("qrs-interact");


const qrsInstance = {
    hostname: "localhost"
}

const qrs = new qrsInteract(qrsInstance)

function getServiceClusterInfo() {
    return new Promise(function (resolve) {
        qrs.Get("servicecluster")
            .then(function (result) {
                console.log(result);
                let clusterId = result.body[0].id;
                return clusterId;
            })
            .then(function (clusterId) {
                return qrs.Get("servicecluster/" + clusterId)
                    .then(function (result) {
                        resolve(result);
                    })
            })
    })
}

module.exports = getServiceClusterInfo;
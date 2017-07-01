(function() {
    "use strict";
    var module = angular.module("QlikSenseGovernance", ["btford.socket-io", "720kb.tooltips", "ngDialog"])
        .factory('mySocket', function(socketFactory) {
            return socketFactory();
        });

    function doGovernance($http, body, model) {

        var url = "http://" + body.hostname + ":" + body.port + "/governance/dogovernance";
        console.log(url);
        return $http.post(url, body)
            .then(function(result) {
                return result;
            }, function(error) {
                return { msg: "ERROR", error: error };
            })

    }

    function loadSettings($http) {
        return $http.get("./loadsettings")
            .then(function(response) {
                return response.data;
            })
    }

    function postSettings($http, body) {
        return $http.post("./postsettings", body)
            .then(function(result) {
                return result.data;
            })
    }

    function deleteSetting($http, body) {
        return $http.post("./deletesetting", body)
            .then(function(result) {
                return result.data;
            });
    }

    function governanceCollectorBodyController($scope, $http, mySocket, ngDialog) {
        var model = this;

        model.boolGenMetadata = false;
        model.boolParseLoadScripts = false;
        model.boolGenQVDs = false;
        model.boolRefreshGovernanceApp = false;
        model.boolGeneral = false;
        model.boolCerts = false;
        model.boolImportHelp = false;
        model.existingSettings = [];
        model.existingServers = [];
        model.buttonsEnabled = false;



        model.textGenMetaData = "Activating this button will enable the Governance Collector to ";
        model.textGenMetaData += "collect Qlik Sense application metadata and store it into xml files";

        model.textParseLoadScripts = "Activating the Parse Load Scripts button will program the Governance Collector to ";
        model.textParseLoadScripts += "review the load script logs of applications and derive lineage information.";

        model.textGenerateQVDs = "Enabling the Generate QVDs option will load the xml files and parsed lineage information ";
        model.textGenerateQVDs += "into a processor that will export all data to QVDs.  From here you can create your own Governance Dashboard.";

        model.textRefreshGovernanceApp = "Or you can click this button and have the qvds loaded into the Governance Dashboard supplied with the installer.";

        model.$onInit = function() {
            console.log("Hello World");
            model.popServers();

        }

        mySocket.on("governanceCollector", function(msg) {
            model.statusOutput += msg + "\n";
            $('#output-area').scrollTop($('#output-area')[0].scrollHeight)
        })

        model.clearStatus = function() {
            model.statusOutput = "";
        };

        model.genMetadata = function() {
            model.boolGenMetadata = (model.boolGenMetadata) ? false : true;
            console.log(model.boolGenMetadata);
        }

        model.parseLoadScripts = function() {
            model.boolParseLoadScripts = (model.boolParseLoadScripts) ? false : true;
        }

        model.genQVDs = function() {
            model.boolGenQVDs = (model.boolGenQVDs) ? false : true;
        }

        model.refreshGovernanceApp = function() {
            model.boolRefreshGovernanceApp = (model.boolRefreshGovernanceApp) ? false : true;
        }


        model.gogoGovernance = function() {
            var body = {
                hostname: model.hostname,
                port: model.port,
                boolGenMetadata: model.boolGenMetadata,
                boolParseLoadScripts: model.boolParseLoadScripts,
                boolGenQVDs: model.boolGenQVDs,
                boolRefreshGovernanceApp: model.boolRefreshGovernanceApp
            };
            doGovernance($http, body, model)
                .then(function(result) {
                    if (!result.msg == "ERROR") {
                        model.boolGenMetadata = false;
                        model.boolParseLoadScripts = false;
                        model.boolGenQVDs = false;
                        model.boolRefreshGovernanceApp = false;
                        // $scope.form.$setPristine();
                        // $scope.form.$setUntouched();
                        // console.log("Form Reset");
                        model.statusOutput = result.data + "\n";
                    } else {
                        model.statusOutput += "A error occured during processing.\n";
                    }
                })
        }
        model.hw = "Hello World";


        model.openConfig = function() {
            model.popSettings();
            ngDialog.open({
                template: "app/governance-settings-body.html",
                className: "governance-settings", //"ngdialog-theme-default",
                showClose: false,
                controller: governanceCollectorBodyController,
                scope: $scope
            });
            model.boolGeneral = true;

        };

        model.selectSetting = function() {
            if (model.currentSetting.hostname == model.existingSettings[0].hostname) {
                model.hostname = "";
                model.port = "";
                model.clientCertificate = "";
                model.clientKey = "";
            } else {
                model.hostname = model.currentSetting.hostname;
                model.port = model.currentSetting.port;
                model.clientCertificate = model.currentSetting.certificates.client;
                model.clientKey = model.currentSetting.certificates.key;
            }
        }

        model.selectServer = function() {
            console.log(model.currentServer);
            if (model.currentServer.hostname == model.existingServers[0].hostname) {
                model.runningHostname = "";
                model.runningPort = "";
                model.runningClientCertificate = "";
                model.runningClientKey = "";
                model.buttonsEnabled = false;
            } else {
                model.buttonsEnabled = true;
                model.hostname = model.currentServer.hostname;
                model.runningHostname = model.currentServer.hostname;
                model.port = model.currentServer.port;
                model.runningPort = model.currentServer.port;
                model.runningClientCertificate = model.currentServer.certificates.client;
                model.runningClientKey = model.currentServer.certificates.key;

            }
        }

        model.popSettings = function() {
            model.saveMessage = "";
            model.hostname = "";
            model.port = "";
            model.clientCertificate = "";
            model.clientKey = "";
            model.existingSettings = [];
            loadSettings($http)
                .then(function(result) {
                    result.unshift({ "hostname": "Please select a server or add one below." });
                    model.existingSettings = result;
                    //console.log(model.existingSettings);
                    model.currentSetting = model.existingSettings[0];
                })
        }

        model.popServers = function() {
            model.hostname = "";
            model.port = "";
            model.clientCertificate = "";
            model.clientKey = "";
            model.existingServers = [];
            loadSettings($http)
                .then(function(result) {
                    result.unshift({ "hostname": "Please select a server or click Add" });
                    model.existingServers = result;
                    //console.log(model.existingServers);
                    model.currentServer = model.existingServers[0];
                })
        }

        model.saveSettings = function() {
            var body = {
                "hostname": model.hostname,
                "port": model.port,
                "certificates": {
                    "client": model.clientCertificate,
                    "key": model.clientKey,
                }
            };

            //console.log(body);

            postSettings($http, body)
                .then(function(result) {
                    model.saveMessage = result.message;
                    model.index = result.index;
                    loadSettings($http)
                        .then(function(result) {
                            result.unshift({ "hostname": "Please select a server or add one below." });
                            model.existingSettings = result;
                            //console.log(model.existingSettings);
                            model.currentSetting = model.existingSettings[model.index];
                            model.popServers();
                        })

                })
        }

        model.deleteSetting = function() {
            deleteSetting($http, model.currentSetting)
                .then(function(result) {
                    loadSettings($http)
                        .then(function(result) {
                            result.unshift({ "hostname": "Please select a server or add one below." });
                            model.existingSettings = result;
                            console.log(model.existingSettings);
                            model.currentSetting = model.existingSettings[0];
                        })
                });
        }

        model.closeSettings = function() {
            model.popServers();
            ngDialog.closeAll();
        }

        model.cancelSettings = function() {
            ngDialog.closeAll();
        }
    }




    module.component("governanceCollectorBody", {
        transclude: true,
        templateUrl: "app/governance-collector-body.html",
        bindings: {
            servers: "<"
        },
        controllerAs: "model",
        controller: ["$scope", "$http", "mySocket", "ngDialog", governanceCollectorBodyController]
    });

}());
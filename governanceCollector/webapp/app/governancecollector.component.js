(function() {
    "use strict";
    var module = angular.module("QlikSenseGovernance", ["btford.socket-io", "720kb.tooltips", "ngDialog", "ngFileUpload"])
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

    function uploadApps($http, body) {
        var url = "http://" + body.hostname + ":" + body.port + "/governance/uploadApps";
        return $http.get(url)
            .then(function(result) {
                return result.data;
            })
    }

    function importExtensions($http, body) {
        var url = "http://" + body.hostname + ":" + body.port + "/governance/importExtensions";
        return $http.get(url)
            .then(function(result) {
                return result.data;
            })
    }

    function createDataConnections($http, body) {
        var url = "http://" + body.hostname + ":" + body.port + "/governance/createDataConnections";
        return $http.get(url)
            .then(function(result) {
                return result.data;
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

    function showAlert() {
        $("#settings-save-alert").hide();
        $("#settings-save-alert").fadeTo(2000, 500).fadeOut(500, function() {
            $("#settings-save-alert").fadeOut(500);
        });
    }

    function governanceCollectorBodyController($scope, $http, mySocket, ngDialog, Upload) {
        var model = this;

        model.boolGenMetadata = false;
        model.boolParseLoadScripts = false;
        model.boolGenQVDs = false;
        model.boolRefreshGovernanceApp = false;
        model.boolGeneral = false;
        model.boolCerts = false;
        model.boolImportHelp = false;
        model.serverList = [];
        model.settingsList = [];
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
            $("#settings-save-alert").hide();

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
            if (model.currentSetting.hostname == model.settingsList[0].hostname) {
                model.hostname = "";
                model.port = "";
                model.uploadApps = false;
                model.importExtensions = false;
                model.createDataConnections = false;
            } else {
                model.hostname = model.currentSetting.hostname;
                model.port = model.currentSetting.port;
                model.uploadApps = model.currentSetting.uploadApps;
                model.importExtensions = model.currentSetting.importExtensions;
                model.createDataConnections = model.currentSetting.createDataConnections;
            }
        }

        model.selectServer = function() {
            console.log(model.currentServer);
            if (model.currentServer.hostname == model.serverList[0].hostname) {
                model.buttonsEnabled = false;
            } else {
                model.buttonsEnabled = true;
                model.hostname = model.currentServer.hostname;
                model.port = model.currentServer.port;
            }
        }

        model.popSettings = function() {
            model.saveMessage = "";
            model.hostname = "";
            model.port = "8592";
            model.uploadApps = false;
            model.importExtensions = false;
            model.createDataConnections = false;
            model.settingsList = [];
            loadSettings($http)
                .then(function(result) {
                    result.unshift({ "hostname": "Please select a server or add one below." });
                    model.settingsList = result;
                    //console.log(model.existingSettings);
                    model.currentSetting = model.settingsList[0];
                })
        }

        model.popServers = function() {
            model.hostname = "";
            model.port = "";

            model.serverList = [];
            loadSettings($http)
                .then(function(result) {
                    result.unshift({ "hostname": "Please select a server or click Add" });
                    model.serverList = result;
                    //console.log(model.existingServers);
                    model.currentServer = model.serverList[0];
                })
        }

        model.saveSettings = function() {
            var body = {
                "hostname": model.hostname,
                "port": model.port,
                "uploadApps": model.uploadApps,
                "importExtensions": model.importExtensions,
                "createDataConnections": model.createDataConnections
            };

            //console.log(body);

            postSettings($http, body)
                .then(function(result) {
                    model.saveMessage = result.message;
                    model.index = result.index;
                    model.popSettings();
                    model.popServers();
                    showAlert();
                })
        }

        model.deleteSetting = function() {
            deleteSetting($http, model.currentSetting)
                .then(function(result) {
                    loadSettings($http)
                        .then(function(result) {
                            result.unshift({ "hostname": "Please select a server or add one below." });
                            model.settingsList = result;
                            console.log(model.settingsList);
                            model.currentSetting = model.settingsList[0];
                        })
                });
        }

        model.importStuff = function() {
            var body = {
                hostname: model.hostname,
                port: model.port
            }
            uploadApps($http, body)
                .then(function(result) {
                    console.log(result)
                    $("#uploadApps").prop('checked', true);
                    model.uploadApps = true;
                    return importExtensions($http, body);
                })
                .then(function(result) {
                    $("#importExtensions").prop("checked", true);
                    model.importExtensions = true;
                    return createDataConnections($http, body);
                })
                .then(function(result) {
                    $("#createDataConnections").prop("checked", true);
                    model.createDataConnections = true;
                    return;
                })
                .then(function() {
                    model.saveSettings();
                })



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
        controller: ["$scope", "$http", "mySocket", "ngDialog", "Upload", governanceCollectorBodyController]
    });

}());
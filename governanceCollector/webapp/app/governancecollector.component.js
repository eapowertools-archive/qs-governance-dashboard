(function () {
    "use strict";
    var module = angular.module("QlikSenseGovernance", ["btford.socket-io", "720kb.tooltips", "dualmultiselect",
            "ngDialog", "ngFileUpload"
        ])
        .factory('mySocket', function (socketFactory) {
            return socketFactory();
        });

    function doGovernance($http, body, model) {

        var url = "http://" + body.hostname + ":" + body.port + "/governance/dogovernance";
        console.log(url);
        return $http.post(url, body)
            .then(function (result) {
                return result;
            }, function (error) {
                return {
                    msg: "ERROR",
                    error: error
                };
            })

    }

    function loadApps($http, body) {
        var url = "http://" + body.hostname + ":" + body.port + "/governance/applist";
        console.log(url);
        return $http.get(url)
            .then(function (result) {
                return result.data;
            });
    }

    function uploadApps($http, body) {
        var url = "http://" + body.hostname + ":" + body.port + "/governance/uploadApps";
        console.log(url);
        return $http.get(url)
            .then(function (result) {
                console.log("made the request");
                return result;
                //return result.data;
            }, function (somethingElse) {
                return somethingElse;
            });
    }

    function createTasks($http, body) {
        var url = "http://" + body.hostname + ":" + body.port + "/governance/createTasks";
        console.log(url);
        return $http.get(url)
            .then(function (result) {
                console.log("made the request");
                return result;
                //return result.data;
            }, function (somethingElse) {
                return somethingElse;
            });
    }

    function importExtensions($http, body) {
        var url = "http://" + body.hostname + ":" + body.port + "/governance/importExtensions";
        return $http.get(url)
            .then(function (result) {
                return result;
            }, function (somethingElse) {
                return somethingElse;
            });
    }

    function createDataConnections($http, body) {
        var url = "http://" + body.hostname + ":" + body.port + "/governance/createDataConnections";
        return $http.get(url)
            .then(function (result) {
                return result;
            }, function (somethingElse) {
                return somethingElse;
            });
    }

    function loadSettings($http) {
        return $http.get("./loadsettings")
            .then(function (response) {
                return response.data;
            })
    }

    function postSettings($http, body) {
        return $http.post("./postsettings", body)
            .then(function (result) {
                return result.data;
            })
    }

    function deleteSetting($http, body) {
        return $http.post("./deletesetting", body)
            .then(function (result) {
                return result.data;
            });
    }

    function showAlert() {
        $("#settings-save-alert").hide();
        $("#settings-save-alert").fadeTo(2000, 500).fadeOut(500, function () {
            $("#settings-save-alert").fadeOut(500);
            //$("#settings-save-alert").html = "";
        });
    }

    function updatesettingsList(list, entry) {
        var settingIndex;
        var settingsExist = list.filter(function (item) {
            return item.hostname == entry.hostname;
        })

        if (settingsExist.length == 0) {
            list.push(entry);
            //resultMessage = "Settings for " + entry.hostname + " added.";
            settingIndex = list.length - 1;
            return {
                list: list,
                index: settingIndex
            };
        } else {
            settingIndex = list.findIndex(function (setting) {
                return setting.hostname == entry.hostname
            });
            list[settingIndex].port = entry.port;
            list[settingIndex].uploadApps = entry.uploadApps;
            list[settingIndex].createTasks = entry.createTasks;
            list[settingIndex].importExtensions = entry.importExtensions;
            list[settingIndex].createDataConnections = entry.createDataConnections;

            //resultMessage = "Settings Updated for " + entry.hostname + ".";
            settingIndex
            return {
                list: list,
                index: settingIndex
            };
        }
    }

    function governanceCollectorBodyController($scope, $http, mySocket, ngDialog, Upload) {
        var model = this;

        model.boolGenMetadata = false;
        model.boolAccessControlData = false;
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
        model.settingsSaved = false;
        model.modal = false;
        model.singleApp = false;
        model.appList = [];
        model.dualmultioptions = {};
        model.tempAppList = [];
        model.appObjectList = [];
        model.resources = [];


        model.textGenMetaData = "Activating this button will enable the Governance Collector to ";
        model.textGenMetaData += "collect Qlik Sense application metadata and store it into xml files";

        model.textAccessControlData = "Click this button to collect user access audit information from the selected Qlik Sense site.";

        model.textParseLoadScripts = "Activating the Parse Load Scripts button will program the Governance Collector to ";
        model.textParseLoadScripts += "review the load script logs of applications and derive lineage information.";

        model.textGenerateQVDs = "Enabling the Generate QVDs option will load the xml files and parsed lineage information ";
        model.textGenerateQVDs += "into a processor that will export all data to QVDs.  From here you can create your own Governance Dashboard.";

        model.textRefreshGovernanceApp = "Or you can click this button and have the qvds loaded into the Governance Dashboard supplied with the installer.";



        model.$onInit = function () {
            console.log("Hello World");
            model.popServers();
            model.appObjectList = ["sheet", "story", "embeddedsnapshot", "dimension", "measure", "masterobject", "bookmark"];
            model.resources = ["App", "DataConnection", "ContentLibrary", "Stream"];
        }

        mySocket.on("governanceCollector", function (msg) {
            model.statusOutput += msg + "\n";
            $('#output-area').scrollTop($('#output-area')[0].scrollHeight)
        })

        model.clearStatus = function () {
            model.statusOutput = "";
        };

        model.genMetadata = function () {
            model.boolGenMetadata = (model.boolGenMetadata) ? false : true;
            //model.openAppMetadataCollector();
            console.log(model.boolGenMetadata);
        }

        model.genUserAccessControlData = function () {
            model.boolAccessControlData = (model.boolAccessControlData) ? false : true;
            console.log(model.boolAccessControlData);
        }

        model.parseLoadScripts = function () {
            model.boolParseLoadScripts = (model.boolParseLoadScripts) ? false : true;
        }

        model.genQVDs = function () {
            model.boolGenQVDs = (model.boolGenQVDs) ? false : true;
        }

        model.refreshGovernanceApp = function () {
            model.boolRefreshGovernanceApp = (model.boolRefreshGovernanceApp) ? false : true;
        }


        model.gogoGovernance = function () {
            var body = {
                hostname: model.hostname,
                port: model.port,
                boolGenMetadata: model.boolGenMetadata,
                boolParseLoadScripts: model.boolParseLoadScripts,
                boolGenQVDs: model.boolGenQVDs,
                boolRefreshGovernanceApp: model.boolRefreshGovernanceApp
            };

            if (model.singleApp) {
                body.singleApp = {
                    boolSingleApp: model.singleApp,
                    appId: model.currentApp.id
                }
            } else {

                body.singleApp = {
                    boolSingleApp: model.singleApp,
                    appId: null
                }
            }


            doGovernance($http, body, model)
                .then(function (result) {
                    model.boolGenMetadata = false;
                    model.boolParseLoadScripts = false;
                    model.boolGenQVDs = false;
                    model.boolRefreshGovernanceApp = false;
                    model.statusOutput = result.data + "\n";
                })
        }
        model.hw = "Hello World";

        model.openAppMetadataCollector = function () {

            model.tempAppList = [{
                    name: "foo",
                    id: "x123",
                    filesize: 12345
                },
                {
                    name: "bar",
                    id: "45678",
                    filesize: 14,
                },
                {
                    name: "yay",
                    id: "910203",
                    filesize: 4592,
                }
            ]

            model.dualmultioptions = {
                title: "Application list for " + model.hostname,
                filterPlaceHolder: "Search by name, guid, custom property, or filesize.",
                labelAll: "All Items",
                labelSelected: "Selected Items",
                helpMessage: "Click items to transfer them between fields.",
                orderProperty: "name",
                items: model.dualmultioptions.items != undefined ? model.dualmultioptions.items : model.tempAppList,
                selectedItems: model.dualmultioptions.selectedItems != undefined ? model.dualmultioptions.selectedItems : []
            }

            ngDialog.open({
                template: "app/governance-app-collector-body.html",
                className: "governance-app-collector",
                showClose: false,
                controller: governanceCollectorBodyController,
                scope: $scope
            })
        };

        model.openAccessControlCollector = function () {
            ngDialog.open({
                template: "app/governance-access-control-collector-body.html",
                className: "governance-access-control-collector",
                showClose: false,
                controller: governanceCollectorBodyController,
                scope: $scope
            })
        };

        model.openConfig = function () {
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


        model.selectSetting = function () {
            console.log(model.settingsList);
            if (model.currentSetting.hostname == model.settingsList[0].hostname) {
                model.hostname = "";
                model.port = "";
                model.uploadApps = false;
                model.createTasks = false;
                model.importExtensions = false;
                model.createDataConnections = false;
                model.settingsSaved = false;
            } else {
                model.hostname = model.currentSetting.hostname;
                model.port = model.currentSetting.port;
                model.uploadApps = model.currentSetting.uploadApps;
                model.createTasks = model.currentSetting.createTasks;
                model.importExtensions = model.currentSetting.importExtensions;
                model.createDataConnections = model.currentSetting.createDataConnections;
                model.settingsSaved = true;
            }
        }

        model.selectServer = function () {
            console.log(model.currentServer);
            if (model.currentServer.hostname == model.serverList[0].hostname) {
                model.buttonsEnabled = false;
            } else {
                model.buttonsEnabled = true;
                model.hostname = model.currentServer.hostname;
                model.port = model.currentServer.port;

                if (model.singleApp) {
                    model.popApps();
                }
            }
        }

        model.popApps = function () {
            model.appList = [];
            var body = {
                hostname: model.hostname,
                port: model.port
            }
            loadApps($http, body)
                .then(function (result) {
                    result.unshift({
                        "name": "Please select an app name from the list",
                        "id": null
                    });
                    model.appList = result;
                    model.currentApp = model.appList[0];
                })
        }

        model.popSettings = function () {
            model.saveMessage = "";
            model.hostname = "";
            model.port = "8592";
            model.uploadApps = false;
            model.createTasks = false;
            model.importExtensions = false;
            model.createDataConnections = false;

            loadSettings($http)
                .then(function (result) {
                    result.unshift({
                        "hostname": "Please select a server or add one below."
                    });
                    model.settingsList = result;
                    console.log(model.settingsList);
                    model.currentSetting = model.settingsList[0];
                })
        }

        model.popServers = function () {
            model.hostname = "";
            model.port = "";

            loadSettings($http)
                .then(function (result) {
                    result.unshift({
                        "hostname": "Please select a server or click Add"
                    });
                    model.serverList = result;
                    console.log(model.serverList);
                    model.currentServer = model.serverList[0];
                })
        }

        model.saveSettings = function () {
            var body = {
                "hostname": model.hostname,
                "port": model.port,
                "uploadApps": model.uploadApps,
                "createTasks": model.createTasks,
                "importExtensions": model.importExtensions,
                "createDataConnections": model.createDataConnections
            };

            //console.log(body);

            postSettings($http, body)
                .then(function (result) {

                    model.saveMessage = result.message;
                    model.index = result.index;
                    model.settingsSaved = true;
                    return;
                })
                .then(function () {
                    model.popServers();
                    return;
                })
                .then(function () {

                    showAlert();
                    setTimeout(function () {
                        model.saveMessage = "";
                    }, 3000);
                    var foo = updatesettingsList(model.settingsList, body);
                    model.settingsList = foo.list;
                    model.currentSetting = model.settingsList[foo.index];
                    model.selectSetting();
                });
        }

        model.deleteSetting = function () {
            deleteSetting($http, model.currentSetting)
                .then(function (result) {
                    loadSettings($http)
                        .then(function (result) {
                            result.unshift({
                                "hostname": "Please select a server or add one below."
                            });
                            model.settingsList = result;
                            console.log(model.settingsList);
                            model.currentSetting = model.settingsList[0];
                            model.hostname = "";
                            model.port = "8592";
                            model.settingsSaved = false;
                            model.uploadApps = false;
                            model.createTasks = false;
                            model.importExtensions = false;
                            model.createDataConnections = false;
                        })
                });
        }

        model.importStuff = function () {
            var body = {
                hostname: model.hostname,
                port: model.port
            }
            model.modal = true;
            uploadApps($http, body)
                .then(function (result) {
                    if (result.data && result.status == 200) {
                        $("#uploadApps").prop('checked', true);
                        model.uploadApps = true;
                    }
                    return createTasks($http, body)
                        .then(function (result) {
                            if (result.data && result.status == 200) {
                                $("#createTasks").prop("checked", true);
                                model.createTasks = true;
                            }
                            return importExtensions($http, body)
                                .then(function (result) {
                                    if (result.data && result.status == 200) {
                                        $("#importExtensions").prop("checked", true);
                                        model.importExtensions = true;
                                    }
                                    return createDataConnections($http, body)
                                        .then(function (result) {
                                            if (result.data && result.status == 200) {
                                                $("#createDataConnections").prop("checked", true);
                                                model.createDataConnections = true;
                                            }
                                            model.modal = false;
                                            model.saveSettings();
                                        })
                                        .catch(function (error) {
                                            console.log(error);
                                            model.modal = false;
                                        })
                                })
                                .catch(function (error) {
                                    console.log(error);
                                    model.modal = false;
                                })
                        })
                        .catch(function (error) {
                            console.log(error);
                            model.modal = false;
                        })
                })
                .catch(function (error) {
                    console.log(error);
                    model.modal = false;
                });

        }

        model.closeSettings = function () {
            model.currentServer = model.serverList[0];
            model.popServers();
            ngDialog.closeAll();
        }

        model.closeAppMetadataCollect = function () {
            ngDialog.closeAll();
            (model.dualmultioptions.selectedItems.length > 0) ?
            model.boolGenMetadata = true: model.boolGenMetadata = false
        }

        model.closeAccessControlCollect = function () {
            ngDialog.closeAll();
            (model.accessControlResources.length > 0 || model.accessControlAppObjectResources.length > 0) ? model.boolAccessControlData = true: model.boolAccessControlData = false;
        }

        model.cancelSettings = function () {
            ngDialog.closeAll();
        }
    }

    module.component("governanceCollectorBody", {
        transclude: true,
        templateUrl: "app/governance-collector-body.html",
        controllerAs: "model",
        controller: ["$scope", "$http", "mySocket", "ngDialog", "Upload", governanceCollectorBodyController]
    });

}());
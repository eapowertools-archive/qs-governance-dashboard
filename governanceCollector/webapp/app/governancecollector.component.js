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
        var url = "http://" + body.hostname + ":" + body.port + "/governance/applistfull";
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

    function getVersion($http) {
        return $http.get("./version")
            .then(function (response) {
                console.log(response)
                return response.data;
            })
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

    function setSelectedResources() {
        var resultArray = [];
        qmcResources.forEach(function (resource) {
            resultArray.push(resource.name);
        })

        return resultArray;
    }

    function setSelectedAppObjects() {
        var resultArray = [];
        appObjectList.forEach(function (appObject) {
            resultArray.push(appObject.name);
        })

        return resultArray;
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
        model.appObjectList = [];
        model.resources = [];
        model.selectedResources = [];
        model.selectedAppObjects = [];
        model.resourceSelected = false;
        model.appObjectSelected = false;
        model.boolCheckAllResources = true;
        model.boolCheckAllAppObjects = true;
        model.version = "";

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
            model.appObjectList = appObjectList;
            model.resources = qmcResources;
            model.selectedResources = setSelectedResources();
            model.selectedAppObjects = setSelectedAppObjects();
            getVersion($http)
                .then(function (response) {
                    model.version = response;
                });
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

        model.genAccessControlData = function () {
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
                boolAccessControlData: model.boolAccessControlData,
                boolParseLoadScripts: model.boolParseLoadScripts,
                boolGenQVDs: model.boolGenQVDs,
                boolRefreshGovernanceApp: model.boolRefreshGovernanceApp
            };

            //Add sections to the body for the different items to be queued and run.
            if (model.boolGenMetadata) {
                body.appMetadata = {
                    appArray: model.dualmultioptions.selectedItems
                }
            }

            if (model.boolAccessControlData) {
                body.accessControl = {
                    resources: model.selectedResources,
                    appObjects: model.selectedAppObjects
                }
            }

            doGovernance($http, body, model)
                .then(function (result) {
                    model.boolGenMetadata = false;
                    model.boolAccessControlData = false;
                    model.boolParseLoadScripts = false;
                    model.boolGenQVDs = false;
                    model.boolRefreshGovernanceApp = false;
                    model.statusOutput = result.data + "\n";
                    model.dualmultioptions.items = undefined;
                    model.dualmultioptions.selectedItems = [];
                    model.selectedResources = [];
                    model.selectedAppObjects = [];
                    model.resources = qmcResources;
                    model.appObjectList = appObjectList;
                })
        }
        model.hw = "Hello World";

        model.openAppMetadataCollector = function () {

            model.dualmultioptions = {
                title: "Application list for " + model.hostname,
                filterPlaceHolder: "Search by name, guid, custom property, or filesize.",
                labelAll: "All Items",
                labelSelected: "Selected Items",
                helpMessage: "Click items to transfer them between fields.",
                orderProperty: "name",
                items: model.dualmultioptions.items != undefined ? model.dualmultioptions.items : model.appList,
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

        model.checkedResources = function (value) {
            var rawIndex;
            rawIndex = model.resources.findIndex(function (resource, i) {
                return resource.name === value;
            })

            if (document.getElementById(value).checked === true) {
                model.selectedResources.push(value);
                model.resources[rawIndex].checked = true;
            } else {
                var indexx = model.selectedResources.indexOf(value);
                model.selectedResources.splice(indexx, 1);
                model.resources[rawIndex].checked = false;
            }

            if (model.selectedResources.length > 0) {
                model.resourceSelected = true;
            } else {
                model.resourceSelected = false;
            }
            console.log(model.selectedResources);
        }

        model.checkAllResources = function () {

            console.log(model.boolCheckAllResources)
            if (model.boolCheckAllResources) {
                model.resources.forEach(function (item, index) {
                    $("#" + item.name).prop("checked", false)
                    model.resources[index].checked = false;
                })
                model.selectedResources = [];
            } else {
                model.selectedResources = [];
                model.resources.forEach(function (item, index) {
                    $("#" + item.name).prop("checked", true)
                    model.resources[index].checked = true;
                    model.selectedResources.push(item.name);
                })
            }
            model.boolCheckAllResources = model.boolCheckAllResources ? false : true;
            console.log(model.selectedResources);
        }

        model.checkedAppObjects = function (value) {
            var rawIndex;
            rawIndex = model.appObjectList.findIndex(function (appObject, i) {
                return appObject.name === value;
            })
            if (document.getElementById(value).checked === true) {
                model.selectedAppObjects.push(value);
                model.appObjectList[rawIndex].checked = true;
            } else {
                var indexx = model.selectedAppObjects.indexOf(value);
                model.selectedAppObjects.splice(indexx, 1);
                model.appObjectList[rawIndex].checked = false;
            }

            if (model.selectedAppObjects.length > 0) {
                model.appObjectSelected = true;
            } else {
                model.appObjectSelected = false;
            }
            console.log(model.selectedAppObjects);
        }

        model.checkAllAppObjects = function () {

            console.log(model.boolCheckAllAppObjects)
            if (model.boolCheckAllAppObjects) {
                model.appObjectList.forEach(function (item, index) {
                    $("#" + item.name).prop("checked", false)
                    model.appObjectList[index].checked = false;
                })
                model.selectedAppObjects = [];
            } else {
                model.selectedAppObjects = [];
                model.appObjectList.forEach(function (item, index) {
                    $("#" + item.name).prop("checked", true)
                    model.appObjectList[index].checked = true;
                    model.selectedAppObjects.push(item.name);
                })
            }
            model.boolCheckAllAppObjects = model.boolCheckAllAppObjects ? false : true;
            console.log(model.selectedAppObjects);
        }

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

                model.hostname = model.currentServer.hostname;
                model.port = model.currentServer.port;
                model.popApps()
                    .then(function () {
                        model.buttonsEnabled = true;

                    });
            }
        }

        model.popApps = function () {
            model.appList = [];
            var body = {
                hostname: model.hostname,
                port: model.port
            }
            return loadApps($http, body)
                .then(function (result) {
                    model.appList = result;
                    console.log(model.appList);
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
            model.boolGenMetadata = (model.dualmultioptions.selectedItems.length > 0) ? true : false;
        }

        model.closeAccessControlCollect = function () {
            ngDialog.closeAll();
            model.boolAccessControlData = (model.selectedResources.length > 0 || model.selectedAppObjects.length > 0) ? true : false;
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

const appObjectList = [{
    name: "sheet",
    checked: true
}, {
    name: "story",
    checked: true
}, {
    name: "embeddedsnapshot",
    checked: true
}, {
    name: "dimension",
    checked: true
}, {
    name: "measure",
    checked: true
}, {
    name: "masterobject",
    checked: true
}, {
    name: "bookmark",
    checked: true
}];

const qmcResources = [{
    name: "App",
    checked: true
}, {
    name: "DataConnection",
    checked: true
}, {
    name: "ContentLibrary",
    checked: true
}, {
    name: "Stream",
    checked: true
}];

const tempAppList = [{
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
];
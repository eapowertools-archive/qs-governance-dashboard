var Promise = require("bluebird");
var writeToXML = require('./writeToXML');
var logger = require("./logger");
var socketHelper = require("./socketHelper");

var loggerObject = {
    jsFile: "app-library-stories.js"
}

function logMessage(level, msg) {
    if (level == "info" || level == "error") {
        socketHelper.sendMessage("governanceCollector", msg);
    }
    logger.log(level, msg, loggerObject);
}

var start_time;
var end_time;


function getStories(app, appId, options) {
    return new Promise(function(resolve, reject) {
        //Creating the promise for the Applications Stories
        //Root admin privileges should allow him to access to all available applications. Otherwise check your environment's security rules for the designed user.      
        logMessage("info", "Collecting story metadata");
        var x = {};
        var storyLayoutArray = [];
        var slideLayoutArray = [];
        var slideItemLayoutArray = [];

        app.createSessionObject({
                qAppObjectListDef: {
                    qType: 'story',
                    qData: {
                        id: "/qInfo/qId"
                    }
                },
                qInfo: {
                    qId: 'storyList',
                    qType: 'storyList'
                },
                qMetaDef: {},
                qExtendsId: ''
            })
            .then(function(list) {
                return list.getLayout()
                    .then(function(layout) {
                        return Promise.all(layout.qAppObjectList.qItems.map(function(d) {
                                x = {}
                                start_time = Date.now();
                                return app.getObject(d.qInfo.qId)
                                    .then(function(story) {
                                        //given a story, I need to get the story's layout, the slides in the story layout, and the items layout on the slides
                                        return getStoryLayout(story, start_time)
                                            .then(function(layout) {
                                                logMessage("info", "Collecting story layouts");
                                                storyLayoutArray.push(layout);
                                                return x.storyLayout = layout;
                                            })
                                            .then(function() {
                                                return getSlideLayouts(story, start_time)
                                                    .then(function(slideLayouts) {
                                                        logMessage("info", "Collecting slide layouts");
                                                        slideLayoutArray.push(slideLayouts);
                                                        return x.slideLayouts = slideLayouts;
                                                    })
                                            })
                                            .then(function() {
                                                return getSlideItemLayouts(story, start_time)
                                                    .then(function(slideItemLayouts) {
                                                        logMessage("info", "Collecting slide item layouts");
                                                        slideItemLayoutArray.push(slideItemLayouts);
                                                        return x.slideItemLayouts = slideItemLayouts;
                                                    })
                                            })
                                            .then(function() {
                                                return x;
                                            });
                                    })
                            }))
                            .then(function(resultArray) {
                                logMessage("info", "Story metadata collection complete");
                                writeToXML("storySheets", "StorySlide", slideLayoutArray, appId);
                                writeToXML("story", "Story", { str_layout: storyLayoutArray }, appId);
                                writeToXML("storySheetSlideItems", "StorySlideItems", { slideitems: slideItemLayoutArray }, appId);
                                resolve("Story Information exported");
                            });
                    })
            })
            .catch(function(error) {
                logMessage("error", "Error during slide metadata collection");
                logMessage("error", error.message);
                reject(error);
            })
    });
}

module.exports = getStories;

function getStoryLayout(story, start_time) {
    var end_time;
    return new Promise(function(resolve) {
        story.getLayout()
            .then(function(layout) {
                end_time = Date.now();
                var result = {
                    loadTime: end_time - start_time,
                    layout
                };
                resolve(result);
            });
    })

}

function getSlideLayouts(story, start_time) {
    var end_time;
    return new Promise(function(resolve) {
        story.getChildInfos()
            .then(function(childInfos) {
                return Promise.all(childInfos.map(function(child) {
                        start_time = Date.now();
                        return story.getChild(child.qId)
                            .then(function(slide) {
                                return slide.getLayout()
                                    .then(function(slideLayout) {
                                        end_time = Date.now();
                                        slideLayout = {
                                            loadTime: end_time - start_time,
                                            qInfo: slideLayout.qInfo,
                                            rank: slideLayout.rank
                                        };

                                        return slideLayout;
                                    })
                            })
                    }))
                    .then(function(slideLayouts) {
                        resolve(slideLayouts);
                    })
            })
    });
}

function getSlideItemLayouts(story, start_time) {
    var end_time;
    return new Promise(function(resolve) {
        story.getChildInfos()
            .then(function(childInfos) {
                return Promise.all(childInfos.map(function(child) {
                    start_time = Date.now();
                    return story.getChild(child.qId)
                        .then(function(slide) {
                            return slide.getChildInfos()
                                .then(function(slideItems) {
                                    return Promise.all(slideItems.map(function(item) {
                                            return slide.getChild(item.qId)
                                                .then(function(slideItem) {
                                                    return slideItem.getLayout()
                                                        .then(function(slideItemLayout) {
                                                            end_time = Date.now();
                                                            if (slideItemLayout.visualization == "snapshot") {
                                                                slideItemLayout = {
                                                                    qInfo: slideItemLayout.qInfo,
                                                                    visualization: slideItemLayout.visualization,
                                                                    visualizationType: slideItemLayout.visualizationType,
                                                                    qEmbeddedSnapshot: {
                                                                        showTitles: slideItemLayout.qEmbeddedSnapshot.showTitles,
                                                                        title: slideItemLayout.qEmbeddedSnapshot.title,
                                                                        sheetId: slideItemLayout.qEmbeddedSnapshot.sheetId,
                                                                        creationDate: slideItemLayout.qEmbeddedSnapshot.creationDate,
                                                                        visualization: slideItemLayout.qEmbeddedSnapshot.visualization,
                                                                        sourceObjectId: slideItemLayout.qEmbeddedSnapshot.sourceObjectId,
                                                                        timestamp: slideItemLayout.qEmbeddedSnapshot.timestamp
                                                                    },
                                                                    style: slideItemLayout.style

                                                                }
                                                            }

                                                            var result = {
                                                                loadTime: end_time - start_time,
                                                                slideItemParent: child.qId,
                                                                slideItemLayout
                                                            };

                                                            return result;
                                                        })
                                                })
                                        }))
                                        .then(function(resultArray) {
                                            resolve(resultArray);
                                        })
                                })
                        })
                }))

            });
    });
}
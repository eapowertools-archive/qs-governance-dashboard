(function () {
    "use strict";
    var module = angular.module("QlikSenseGovernance", ["ui.router", "localytics.directives", "720kb.tooltips", "dualmultiselect"]);
    module.config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider.state('route', {
            url: "/ui",
            templateUrl: "/ui"
        });

        // var helloState = {
        //   name:'hello',
        //   url:"/hworld",
        //   templateUrl: "plugins/hworld/index.html",

        //   resolve: {
        //     loadMyCtrl : ['$ocLazyLoad',function($ocLazyLoad)
        //     {
        //       return $ocLazyLoad.load("plugins/hworld/hello-world.component.js");
        //     }]
        //   }
        // };
        // $stateProvider.state(helloState);
        $urlRouterProvider.otherwise('/home');
    });

}());
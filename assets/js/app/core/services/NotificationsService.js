/**
 * Simple service to activate noty2 message to GUI. This service can be used every where in application. Generally
 * all $http and $socket queries uses this service to show specified errors to user.
 *
 * Service can be used as in following examples (assuming that you have inject this service to your controller):
 *  Message.success(message, [title], [options]);
 *  Message.error(message, [title], [options]);
 *  Message.message(message, [title], [options]);
 *
 * Feel free to be happy and code some awesome stuff!
 *
 * @todo do we need some queue dismiss?
 */
(function() {
    'use strict';

    angular.module('frontend.core.services')
        .factory('NotificationsService', [
            '$localStorage','$rootScope','MessageService',
            function factory($localStorage,$rootScope,MessageService) {

                function createNavigatorNotification(message) {
                    Notification.requestPermission(function (permission) {
                        if (Notification.permission === "granted") {
                            new Notification("KONGA!",{
                                body: message,
                                icon: 'images/k.png'
                            });
                        }
                    });
                }

                function load() {
                    return $localStorage.notifications;
                }

                function add(data) {
                    if(!$localStorage.notifications) {
                        $localStorage.notifications = []
                    }
                    $localStorage.notifications.unshift({
                        id : new Date().getTime,
                        icon : data.icon,
                        message : data.message
                    })

                    createNavigatorNotification(data.message)

                    // MessageService.success(data.message)
                }

                function remove(index) {
                    $localStorage.notifications.splice(index, 1);
                }


                /**
                 * Listen for important events
                 */

                $rootScope.$on('node.health_checks',function(event,data){

                    if(!data.isHealthy) {

                        // var message = 'A Kong node is down, unresponsive or unreachable.'
                        //
                        // add({
                        //     message : message
                        // })

                        MessageService.warning('A Connection health check has failed: ' + _.get(data,'lastFailedReason', 'N/A'))
                    }

                })

                // Listen for route events
                $rootScope.$on('route.created',function(event,data){
                    var message = 'New route created: ' + (data.route.name || data.route.id) + 
                                 ' on ' + data.connection.name;
                    
                    add({
                        icon: 'fa-plus-circle',
                        message: message
                    });

                    MessageService.success('Route created: ' + (data.route.name || data.route.id));
                })

                $rootScope.$on('route.updated',function(event,data){
                    var message = 'Route updated: ' + (data.route.name || data.route.id) + 
                                 ' on ' + data.connection.name;
                    
                    add({
                        icon: 'fa-edit',
                        message: message
                    });

                    MessageService.info('Route updated: ' + (data.route.name || data.route.id));
                })

                $rootScope.$on('route.deleted',function(event,data){
                    var message = 'Route deleted: ' + (data.route.name || data.route.id) + 
                                 ' from ' + data.connection.name;
                    
                    add({
                        icon: 'fa-trash',
                        message: message
                    });

                    MessageService.warning('Route deleted: ' + (data.route.name || data.route.id));
                })

                return {

                    load   : load,
                    add    : add,
                    remove : remove

                }
            }
        ])
    ;
}());

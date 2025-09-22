/**
 * Route Alerts Event Handler
 * Handles notifications when routes are created, updated or deleted
 */

var events = require('events');
var _ = require('lodash');
var eventEmitter = new events.EventEmitter();
var moment = require('moment');
var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');
var sendmail = require('sendmail')({
  logger: {
    debug: sails.log,
    info: console.info,
    warn: console.warn,
    error: console.error
  },
  silent: false
});

var Utils = require("../helpers/utils");

module.exports = {
  emit: function (event, data) {
    eventEmitter.emit(event, data);
  },

  addListener: function (event, fn) {
    eventEmitter.addListener(event, fn);
  },

  /**
   * Notify when a route is created
   * @param {Object} route - The created route data
   * @param {Object} connection - The Kong connection
   * @param {Object} user - The user who created the route
   */
  notifyRouteCreated: function (route, connection, user) {
    sails.log('Route created notification triggered for route:', route.id);

    sails.models.settings.find().limit(1)
      .exec(function (err, settings) {
        if (err) {
          sails.log.error("route-alerts:notifyRouteCreated:settings error", err);
          return;
        }

        if (!settings.length ||
          !settings[0].data ||
          !settings[0].data.notify_when ||
          !settings[0].data.notify_when.route_created ||
          !settings[0].data.notify_when.route_created.active) {
          sails.log('Route created notifications are disabled');
          return;
        }

        // Send Slack notification
        Utils.sendSlackNotification(settings[0], makePlainTextNotification(route, connection, user, 'created'));

        // Send email notification
        createTransporter(settings[0], function (err, result) {
          if (err || !result) {
            sails.log("route-alerts:notifyRouteCreated:failed to create transporter. No notification will be sent.", err);
          } else {
            var transporter = result.transporter;
            var settingsData = result.settings;
            var html = makeHTMLNotification(route, connection, user, 'created');

            Utils.getAdminEmailList(function (err, receivers) {
              sails.log("route-alerts:notifyRouteCreated:receivers => ", receivers);
              if (!err && receivers.length) {
                var mailOptions = {
                  from: '"' + settingsData.email_default_sender_name + '" <' + settingsData.email_default_sender + '>',
                  to: receivers.join(","),
                  subject: 'New Route Created in Kong',
                  html: html
                };

                if (settingsData.default_transport == 'sendmail') {
                  sendmail(mailOptions, function (err, reply) {
                    if (err) {
                      sails.log.error("route-alerts:notifyRouteCreated:error", err);
                    } else {
                      sails.log.info("route-alerts:notifyRouteCreated:success", reply);
                    }
                  });
                } else {
                  transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                      sails.log.error("route-alerts:notifyRouteCreated:error", error);
                    } else {
                      sails.log.info("route-alerts:notifyRouteCreated:success", info);
                    }
                  });
                }
              }
            });
          }
        });

        // Emit socket event for real-time notification
        sails.sockets.blast('route.created', {
          route: route,
          connection: connection,
          user: user,
          timestamp: new Date()
        });
      });
  },

  /**
   * Notify when a route is updated
   * @param {Object} route - The updated route data
   * @param {Object} connection - The Kong connection
   * @param {Object} user - The user who updated the route
   */
  notifyRouteUpdated: function (route, connection, user) {
    sails.log('Route updated notification triggered for route:', route.id);
    sails.models.settings.find().limit(1)
      .exec(function (err, settings) {
        if (err) {
          sails.log.error("route-alerts:notifyRouteUpdated:settings error", err);
          return;
        }

        if (!settings.length ||
          !settings[0].data ||
          !settings[0].data.notify_when ||
          !settings[0].data.notify_when.route_updated ||
          !settings[0].data.notify_when.route_updated.active) {
          sails.log('Route updated notifications are disabled');
          return;
        }

        // Send Slack notification
        Utils.sendSlackNotification(settings[0], makePlainTextNotification(route, connection, user, 'updated'));

        // Send email notification
        createTransporter(settings[0], function (err, result) {
          if (err || !result) {
            sails.log("route-alerts:notifyRouteupdated:failed to create transporter. No notification will be sent.", err);
          } else {
            var transporter = result.transporter;
            var settingsData = result.settings;
            var html = makeHTMLNotification(route, connection, user, 'updated');

            Utils.getAdminEmailList(function (err, receivers) {
              sails.log("route-alerts:notifyRouteupdated:receivers => ", receivers);
              if (!err && receivers.length) {
                var mailOptions = {
                  from: '"' + settingsData.email_default_sender_name + '" <' + settingsData.email_default_sender + '>',
                  to: receivers.join(","),
                  subject: 'Route updated in Kong',
                  html: html
                };

                if (settingsData.default_transport == 'sendmail') {
                  sendmail(mailOptions, function (err, reply) {
                    if (err) {
                      sails.log.error("route-alerts:notifyRouteUpdated:error", err);
                    } else {
                      sails.log.info("route-alerts:notifyRouteUpdated:success", reply);
                    }
                  });
                } else {
                  transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                      sails.log.error("route-alerts:notifyRouteUpdated:error", error);
                    } else {
                      sails.log.info("route-alerts:notifyRouteUpdated:success", info);
                    }
                  });
                }
              }
            });
          }
        });

        // Emit socket event for real-time notification
        sails.sockets.blast('route.updated', {
          route: route,
          connection: connection,
          user: user,
          timestamp: new Date()
        });
      });
  },

  /**
   * Notify when a route is deleted
   * @param {Object} route - The deleted route data
   * @param {Object} connection - The Kong connection
   * @param {Object} user - The user who deleted the route
   */
  notifyRouteDeleted: function (route, connection, user) {
    sails.log('Route deleted notification triggered for route:', route.id);
    sails.models.settings.find().limit(1)
      .exec(function (err, settings) {
        if (err) {
          sails.log.error("route-alerts:notifyRouteDeleted:settings error", err);
          return;
        }

        if (!settings.length ||
          !settings[0].data ||
          !settings[0].data.notify_when ||
          !settings[0].data.notify_when.route_updated ||
          !settings[0].data.notify_when.route_updated.active) {
          sails.log('Route updated notifications are disabled');
          return;
        }

        // Send Slack notification
        Utils.sendSlackNotification(settings[0], makePlainTextNotification(route, connection, user, 'deleted'));

        // Send email notification
        createTransporter(settings[0], function (err, result) {
          if (err || !result) {
            sails.log("route-alerts:notifyRoutedeleted:failed to create transporter. No notification will be sent.", err);
          } else {
            var transporter = result.transporter;
            var settingsData = result.settings;
            var html = makeHTMLNotification(route, connection, user, 'deleted');

            Utils.getAdminEmailList(function (err, receivers) {
              sails.log("route-alerts:notifyRoutedeleted:receivers => ", receivers);
              if (!err && receivers.length) {
                var mailOptions = {
                  from: '"' + settingsData.email_default_sender_name + '" <' + settingsData.email_default_sender + '>',
                  to: receivers.join(","),
                  subject: 'Route deleted in Kong',
                  html: html
                };

                if (settingsData.default_transport == 'sendmail') {
                  sendmail(mailOptions, function (err, reply) {
                    if (err) {
                      sails.log.error("route-alerts:notifyRouteDeleted:error", err);
                    } else {
                      sails.log.info("route-alerts:notifyRouteDeleted:success", reply);
                    }
                  });
                } else {
                  transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                      sails.log.error("route-alerts:notifyRouteDeleted:error", error);
                    } else {
                      sails.log.info("route-alerts:notifyRouteDeleted:success", info);
                    }
                  });
                }
              }
            });
          }
        });
        // Emit socket event for real-time notification
        sails.sockets.blast('route.deleted', {
          route: route,
          connection: connection,
          user: user,
          timestamp: new Date()
        });
      });
  }

};

/**
 * Create email transporter based on settings
 */
function createTransporter(settings, cb) {
  sails.log("route-alerts:createTransporter => trying to get transport", {
    "notifications_enabled": settings.data.email_notifications,
    "transport_name": settings.data.default_transport
  });

  sails.models.emailtransport.findOne({
    name: settings.data.default_transport
  }).exec(function (err, transport) {
    if (err) return cb(err);

    sails.log("route-alerts:createTransporter:transport =>", transport);
    if (!transport) return cb();

    var result = {
      settings: settings.data,
    };

    switch (settings.data.default_transport) {
      case "smtp":
        result.transporter = nodemailer.createTransport(transport.settings);
        break;
      case "mailgun":
        result.transporter = nodemailer.createTransport(mg(transport.settings));
        break;
    }

    return cb(null, result);
  });
}

/**
 * Create plain text notification message
 */
function makePlainTextNotification(route, connection, user, action) {
  var actionText = action === 'created' ? 'created' : action === 'updated' ? 'updated' : 'deleted';

  var text = '[ ' + moment().format('MM/DD/YYYY @HH:mm:ss') + ' ] A Route has been ' + actionText + ' in Kong. ' +
    'Route ID: ' + route.id + ' | Name: ' + (route.name || 'N/A') + ' | Paths: ' + (route.paths ? route.paths.join(', ') : 'N/A') +
    ' | Service: ' + (route.service ? route.service.id : 'N/A') + ' | Kong Node: ' + connection.name +
    ' | Created by: ' + (user ? user.username : 'System') + '.';

  // Return structured object for Web API with enhanced markdown
  return {
    text: `Uma rota foi *${actionText}* no Kong *${connection.name}*`,
    blocks: [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": `Rota ${actionText === 'created' ? 'Criada' : actionText === 'updated' ? 'Atualizada' : 'Removida'}`
        }
      },
      {
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": `*Data/Hora:*\n${moment().format('DD/MM/YYYY @HH:mm:ss')}`
          },
          {
            "type": "mrkdwn",
            "text": `*Route:*\n${route.name || 'N/A'}`
          },
          {
            "type": "mrkdwn",
            "text": `*Service:*\n${(route.service ? route.service.id : 'N/A')}`
          },
          {
            "type": "mrkdwn",
            "text": `*Cluster:*\n${connection.name}`
          },
          {
            "type": "mrkdwn",
            "text": `*Autor:*\n${(user ? user.username : 'System')}`
          },
          {
            "type": "mrkdwn",
            "text": `*Paths:*\n${(route.paths ? route.paths.join(', ') : 'N/A')}`
          }
        ]
      },
      {
        "type": "divider"
      },
      {
        "type": "context",
        "elements": [
          {
            "type": "mrkdwn",
            "text": `Route ID: \`${route.id}\` | Konga: ${process.env.KONGA_URL || 'N/A'}`
          }
        ]
      }
    ]
  };
}

/**
 * Create HTML notification message
 */
function makeHTMLNotification(route, connection, user, action) {
  var actionText = action === 'created' ? 'created' : action === 'updated' ? 'updated' : 'deleted';
  var actionColor = action === 'created' ? '#28a745' : action === 'updated' ? '#ffc107' : '#dc3545';

  var html = '<h3 style="color: ' + actionColor + ';">A Route has been ' + actionText + ' in Kong</h3>' +
    '<table style="border: 1px solid #ccc; background-color: #f8f9fa; border-collapse: collapse; width: 100%;">' +
    '<tr style="background-color: #e9ecef;">' +
    '<th style="text-align: left; padding: 8px; border: 1px solid #ccc;">Property</th>' +
    '<th style="text-align: left; padding: 8px; border: 1px solid #ccc;">Value</th>' +
    '</tr>' +
    '<tr>' +
    '<td style="padding: 8px; border: 1px solid #ccc;"><strong>Route ID</strong></td>' +
    '<td style="padding: 8px; border: 1px solid #ccc;">' + route.id + '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="padding: 8px; border: 1px solid #ccc;"><strong>Name</strong></td>' +
    '<td style="padding: 8px; border: 1px solid #ccc;">' + (route.name || 'N/A') + '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="padding: 8px; border: 1px solid #ccc;"><strong>Paths</strong></td>' +
    '<td style="padding: 8px; border: 1px solid #ccc;">' + (route.paths ? route.paths.join(', ') : 'N/A') + '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="padding: 8px; border: 1px solid #ccc;"><strong>Service ID</strong></td>' +
    '<td style="padding: 8px; border: 1px solid #ccc;">' + (route.service ? route.service.id : 'N/A') + '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="padding: 8px; border: 1px solid #ccc;"><strong>Kong Node</strong></td>' +
    '<td style="padding: 8px; border: 1px solid #ccc;">' + connection.name + '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="padding: 8px; border: 1px solid #ccc;"><strong>Created by</strong></td>' +
    '<td style="padding: 8px; border: 1px solid #ccc;">' + (user ? user.username : 'System') + '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="padding: 8px; border: 1px solid #ccc;"><strong>Timestamp</strong></td>' +
    '<td style="padding: 8px; border: 1px solid #ccc;">' + moment().format('MM/DD/YYYY HH:mm:ss') + '</td>' +
    '</tr>' +
    '</table>';

  return html;
}


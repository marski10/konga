/**
 * Created by user on 07/10/2017.
 */

'use strict'

var moment = require("moment");
var _ = require("lodash");

module.exports = {

  getMinutesDiff: function (start, end) {
    var duration = moment.duration(moment(start).diff(moment(end)));
    return duration.asMinutes();
  },

  getAdminEmailList: function (cb) {
    sails.models.user.find({
      admin: true
    }).exec(function (err, admins) {
      if (err) return cb(err)
      if (!admins.length) return cb([])
      return cb(null, admins.map(function (item) {
        return item.email;
      }));
    });
  },

  sendSlackNotification: function (settings, message) {

    sails.log("Sending notification to slack", settings.data.integrations, message);

    var slack = _.find(settings.data.integrations, function (item) {
      return item.id === 'slack'
    })

    if (!slack || !slack.config.enabled) return;

    // Send notification to slack using Web API for better markdown support
    var { WebClient } = require('@slack/web-api');

    // Get bot token and channel from settings
    var tokenField = _.find(slack.config.fields, function (item) {
      return item.id == 'slack_bot_token'
    })
    var channelField = _.find(slack.config.fields, function (item) {
      return item.id == 'slack_channel'
    })

    var token = tokenField ? tokenField.value : "";
    var channel = channelField ? channelField.value : "#general";

    if (!token) {
      sails.log('Slack bot token not configured, falling back to webhook');
      // Fallback to webhook if no bot token
      return this.sendSlackWebhookNotification(settings, message);
    }

    var client = new WebClient(token);

    // Check if message is already a structured object (JSON) or plain text
    var payload;
    if (typeof message === 'string') {
      try {
        // Try to parse as JSON first
        payload = JSON.parse(message);
      } catch (e) {
        // If not JSON, treat as plain text and wrap in basic format
        payload = {
          text: message,
          channel: channel
        };
      }
    } else {
      // Message is already an object, add channel if not present
      payload = Object.assign({}, message, { channel: channel });
    }

    client.chat.postMessage(payload).then(function (result) {
      sails.log('Slack notification sent successfully:', result);
    }).catch(function (err) {
      sails.log('Error sending Slack notification:', err);
    });
  },

  // Fallback method for webhook notifications
  sendSlackWebhookNotification: function (settings, message) {
    var { IncomingWebhook } = require('@slack/webhook');

    var slack = _.find(settings.data.integrations, function (item) {
      return item.id === 'slack'
    })

    var field = _.find(slack.config.fields, function (item) {
      return item.id == 'slack_webhook_url'
    })

    var url = field ? field.value : "";

    if (!url) {
      sails.log('Slack webhook URL not configured');
      return;
    }

    var webhook = new IncomingWebhook(url);

    // Check if message is already a structured object (JSON) or plain text
    var payload;
    if (typeof message === 'string') {
      try {
        // Try to parse as JSON first
        payload = JSON.parse(message);
      } catch (e) {
        // If not JSON, treat as plain text and wrap in basic format
        payload = {
          text: message
        };
      }
    } else {
      // Message is already an object - convert blocks to attachments for webhook compatibility
      payload = this.convertBlocksToAttachments(message);
    }

    webhook.send(payload).then(function (result) {
      sails.log('Slack webhook notification sent successfully:', result);
    }).catch(function (err) {
      sails.log('Error sending Slack webhook notification:', err);
    });
  },

  // Convert Web API blocks format to webhook attachments format
  convertBlocksToAttachments: function (message) {
    if (!message.blocks) {
      return message;
    }

    var attachment = {
      color: "#36a64f",
      blocks: message.blocks
    };

    return {
      text: message.text || "Notificação do Konga",
      attachments: [attachment]
    };
  },

  /**
   * Fix invalid semver formats like `0.14.0rc2`
   * A valid semver format would be `0.14.0-rc2`
   * This patch addresses a very specific version invalidity.
   * It does not intent to fix invalid semver formats in general.
   * @param version
   */
  ensureSemverFormat: function (version) {
    if (version.indexOf("-") < 0) {
      // Find the index of the first alphanumeric character in the version string
      let firstAlphaIndex = version.search(/[a-zA-Z]/);
      if (firstAlphaIndex > -1) {
        // Remove everything from that character onward
        return version.substring(0, firstAlphaIndex);
      }
    }

    return version;
  },

  withoutTrailingSlash(str) {
    if (!str) return str;
    return str.replace(/\/$/, "")
  },
}
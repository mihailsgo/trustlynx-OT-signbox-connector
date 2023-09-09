/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'module', 'csui/lib/underscore', 'csui/lib/jquery',
  'csui/utils/connector', 'csui/utils/url', 'csui/utils/log'
], function (module, _, $, Connector, Url, log) {
  'use strict';
  var newClassicAuth = /\bnewClassicAuth\b(?:=([^&]*)?)?/i.exec(location.search);
  newClassicAuth = newClassicAuth && newClassicAuth[1] !== 'false';

  var config = _.extend({
    openInNewTab: undefined, // defaults to true in the code
    apiUrl: '/xecmauth'      // will be prefixed by the CGI URL
  }, module.config());

  log = log(module.id);

  function openAuthenticatedPage1 (connection, url, options) {
    var contentWindow = openContentWindow();
    var connectionUrl;
    var authenticated = $.Deferred();
    if (connection instanceof Connector) {
      connectionUrl = connection.getConnectionUrl();
      authenticateWithConnector();
    } else {
      connectionUrl = new Url(connection.url);
      authenticateWithoutConnector();
    }

    return authenticated.then(function () {
      contentWindow.location = completeTargetUrl();
    }, function (error) {
      if (contentWindow !== window && contentWindow !== options.window) {
        contentWindow.close();
      }
      throw error;
    });

    function openContentWindow() {
      options || (options = {});
      var openInNewTab = options.openInNewTab !== undefined ?
        options.openInNewTab : config.openInNewTab;
      var content = options.window || (openInNewTab === false ?
            window : window.open('', '_blank'));
      return content && content.location ? content : parent.window;
    }

    function completeTargetUrl() {
      if (!(url.indexOf('http:') === 0 || url.indexOf('https:') === 0)) {
        if (url.indexOf('?') === 0) {
          url = connectionUrl.getCgiScript() + url;
        } else {
          url = connectionUrl.getOrigin() + url;
        }
      }
      return url;
    }

    function getAuthenticationURL() {
      var apiUrl = options.apiUrl !== undefined && options.apiUrl || config.apiUrl;
      return connectionUrl.getCgiScript() + apiUrl;
    }

    function authenticateWithConnector() {
      connection
        .makeAjaxCall({
          url: getAuthenticationURL(),
          xhrFields: { withCredentials: true }
        }).then(authenticated.resolve, authenticated.reject);
    }

    function authenticateWithoutConnector() {
      var authenticationUrl = getAuthenticationURL();
      var request = new XMLHttpRequest();
      request.onreadystatechange = function () {
        if (request.readyState === 4) {
          if (request.status === 200) {
            authenticated.resolve();
          } else {
            log.warn('GET request to {0} failed:', authenticationUrl) && console.warn(log.last);
            authenticated.reject(new Error(request.status + ' ' + request.statusText));
          }
        }
      };
      request.open('GET', authenticationUrl, true);
      request.setRequestHeader('OTCSTicket', connection.session.ticket);
      request.withCredentials = true;
      request.send(null);
    }
  }

  function openAuthenticatedPage2 (connection, url, options) {
    if (connection.connection) {
      connection = connection.connection;
    }
    var cgiUrl = new Url(connection.url).getCgiScript();
    var ticket = connection.session.ticket;

    var contentDocument = createWindowDocument();
    var form = createForm();
    createField('func', 'csui.authenticate');
    createField('otcsticket', ticket);
    createField('nexturl', url);
    form.submit();

    return $.Deferred().resolve().promise();

    function createWindowDocument() {
      options || (options = {});
      var content = options.window || (options.openInNewTab === false ?
            window : window.open('', '_blank'));
      if (!content || !content.location) {
        content = parent.window;
      }
      return content.document;
    }

    function createForm() {
      var form = contentDocument.createElement('form');
      form.setAttribute('method', 'post');
      form.setAttribute('action', cgiUrl);
      contentDocument.body.appendChild(form);
      return form;
    }

    function createField(name, value) {
      var field = contentDocument.createElement('input');
      field.setAttribute('name', name);
      field.setAttribute('value', value);
      field.setAttribute('type', 'hidden');
      form.appendChild(field);
    }
  }

  return newClassicAuth ? openAuthenticatedPage1 : openAuthenticatedPage2;
});

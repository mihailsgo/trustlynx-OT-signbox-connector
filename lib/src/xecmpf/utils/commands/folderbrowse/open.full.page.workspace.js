/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define(['module',
  'csui/lib/jquery',
  'csui/lib/underscore',
  'csui/lib/radio',
  'csui/models/command',
  'csui/utils/contexts/factories/connector',
  'csui/utils/url',
  'csui/utils/log',
  'csui/dialogs/modal.alert/modal.alert',
  'i18n!xecmpf/utils/commands/nls/localized.strings'
], function (module, $, _, Radio, CommandModel, ConnectorFactory, Url, log, ModalAlert, lang) {
  var channel = Radio.channel('xecmpf-workspace');
  var OpenFullPageWorkpsace = CommandModel.extend({
    defaults: {
      signature: 'WorkspacePage',
      name: lang.OpenFullPageWorkpsace,
      scope: 'single'
    },

    enabled: function (status, options) {
      var config = _.extend({
        enabled: false
      }, module.config());
      return config.enabled && !!status.container;
    },
    execute: function (status, options) {
      var that = this,
        config = _.extend({
          fullPageOverlay: false,
        }, module.config()),
        deferred = $.Deferred(),
        context = status.originatingView ? status.originatingView.context : options && options.context,
        urlPrefix = 'xecm',
        connector = context.getObject(ConnectorFactory),
        cgiUrl = connector && connector.connection && connector.connection.url ?
        connector.connection.url.replace('/api/v1', '') : '',
        currentWindowRef = window,
        applyTheme = !!status && !!status.data && !!status.data.applyTheme,
        themePath = applyTheme ? $(currentWindowRef.document).find(
          "head > link[data-csui-theme-overrides]").attr('href') : undefined,
        fullPageWorkspaceUrl = Url.combine(cgiUrl, urlPrefix, 'nodes',
          status.container.get('id')),
        navigateMode = context.options.navigateMode,
        xhr = new XMLHttpRequest();
      if (config.fullPageOverlay) {
        require(['xecmpf/widgets/integration/folderbrowse/modaldialog/modal.dialog.view',
            'xecmpf/widgets/integration/folderbrowse/full.page.workspace.view',
            'csui/utils/high.contrast/detector!'
          ],
          function (ModalDialogView, FullPageWorkspaceView, highContrast) {
            var _useIconsForDarkBackground;
            if (highContrast === 2) {
              _useIconsForDarkBackground = false;
            }
            else {
              _useIconsForDarkBackground = true;
            }
            that.authenticate(xhr, cgiUrl, connector);
            xhr.onreadystatechange = function () {
              if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                var viewMode = context.options.viewMode || {};
                var dialog;
                require.config({
                  config: {
                    'csui/integration/folderbrowser2/container.enforcer': {
                      enabled: false
                    }
                  }
                });
                var data = {
                  viewMode: viewMode,
                  navigateMode: navigateMode
                };
                var fullPageNoIFrameOptions = {
                  data: data,
                  nodeID: status.container.get('id'),
                  status: status,
                  context: context,
                  connector: connector,
                  renderType: 'dialog',
                  enableCollapse: config.fullPageOverlay
                };
                var fullPageWorkspace = new FullPageWorkspaceView(fullPageNoIFrameOptions);
                dialog = new ModalDialogView({
                  title: status.container.get("name"),
                  className: 'xecm-modal-dialog xecm-no-iframe-dialog',
                  iconRight: "icon-tileCollapse",
                  view: fullPageWorkspace,
                  useIconsForDarkBackground: _useIconsForDarkBackground
                });
                dialog.show();
                that.listenTo(fullPageWorkspace, 'show:dialog:header', function () {
                    that.showDialogHeader(dialog);
                  })
                  .listenTo(fullPageWorkspace, 'hide:dialog:header', function () {
                    that.hideDialogHeader(dialog);
                  });
                that.listenTo(dialog, 'destroy', function () {
                  $('body').removeClass('csui-support-maximize-widget');
                  if (config.fullPageOverlay && viewMode.mode === 'folderBrowse') {
                    require.config({
                      config: {
                        'csui/integration/folderbrowser2/container.enforcer': {
                          enabled: true
                        },
                        'csui/utils/commands/back.to.last.fragment': {
                          enabled: true
                        }
                      }
                    });
                  }
                });
                that.listenToOnce(channel, 'xecm:close:fullpage:overlay', function () {
                  dialog && dialog.destroy();
                });
              }
            }
            deferred.resolve();
          },
          function (error) {
            deferred.reject(error);
          });
      } else {
        this.getXecmToken(xhr, cgiUrl, connector)
          .done(function (data) {
            var xecm_token = encodeURIComponent(data.token);
            fullPageWorkspaceUrl = fullPageWorkspaceUrl + '?xecmToken=' + xecm_token;
            if (applyTheme && themePath &&
              (themePath.indexOf('overrides.css') > -1 || themePath.indexOf('overrides-rtl.css') > -1)) {
              var csPath;
              if (themePath.indexOf('overrides-rtl.css') > -1) {
                csPath = themePath.match('/widget_themes/(.*)/' + 'overrides-rtl.css');
              } else {
                csPath = themePath.match('/widget_themes/(.*)/' + 'overrides.css');
              }
              if (csPath !== null && csPath.length === 2 && csPath[1].length > 0) {
                var themeData = csPath[1];
                csPath = [];
                csPath = themeData.split('/');
                var overridesTheme = csPath.length === 2 && csPath[0].length > 0 && csPath[1].length > 0 ?
                  '&theme=sap.' + csPath[0] + '.' + csPath[1] : ''; // e.g. sap.belize.bcw
                fullPageWorkspaceUrl = fullPageWorkspaceUrl + overridesTheme;
              }
            }
            if (navigateMode && navigateMode !== '') {
              fullPageWorkspaceUrl = Url.appendQuery(fullPageWorkspaceUrl, 'navigateMode=' + navigateMode);
            }
            var targetWindowRef = currentWindowRef.open('');
            targetWindowRef.location.href = fullPageWorkspaceUrl;
            deferred.resolve();
          })
          .fail(function (data) {
            ModalAlert.showError(data.responseJSON.error);
          });
      }
      return deferred.promise();
    },
    getXecmToken: function (xhr, cgiUrl, connector) {
      var url = Url.combine(cgiUrl, '/api/v2/xecmauthentication/getusertoken'); //REST URL
      return connector.makeAjaxCall({
        type: 'GET',
        url: url,
        beforeSend: _.bind(function (request, settings) {
          request.setRequestHeader("OTCSTicket", connector.connection.session.ticket);
          request.settings = settings;
          if (this.reportSending) {
            this.reportSending(request, settings);
          }
        }, this),
        success: _.bind(function (data, result, request) {
          if (this.reportSuccess) {
            this.reportSuccess(request);
          }
        }, this),
        error: _.bind(function (request, message, statusText) {
          if (this.reportError) {
            this.reportError(request);
          }
        }, this)
      });
    },
    reportError: function (error) {
      require(['csui/dialogs/modal.alert/modal.alert'], function (ModalAlert) {
        ModalAlert.showError(error.message);
      });
    },
    reportSuccess: function (request) {
      if (request && request.settings) {
        log.debug('Receiving response for {0} from {1}.', request.settings.type,
          request.settings.url);
      }
    },
    reportSending: function (request, settings) {
      if (request && settings) {
        log.debug('Sending request as {0} to {1}.', settings.type, settings.url);
      }
    },

    dialogActions: function (e, cgiUrl, dialog) {
      if (e.origin &&
        (new RegExp(e.origin, "i").test(new Url(cgiUrl).getOrigin()))) {
        if (e.data) {
          if (e.data.status === 'closeDialog') {
            dialog.$el.find(".cs-close").trigger("click");
          } else if (e.data.status === 'showDialogHeader') {
            this.showDialogHeader(dialog);
          } else if (e.data.status === 'hideDialogHeader') {
            this.hideDialogHeader(dialog);
          }
        }
      }
    },

    showDialogHeader: function (dialog) {
      dialog.$el.find(".xecm-modal-header").show();
    },

    hideDialogHeader: function (dialog) {
      dialog.$el.find(".xecm-modal-header").hide();
    },

    authenticate: function (xhr, cgiUrl, connector) {
      if (connector.connection.session && connector.connection.session.ticket) {
        this.authenticateworkspace(xhr, cgiUrl, connector);
      } else if (!!connector.connection.credentials) {
        var that = this,
          request = new XMLHttpRequest();
        request.onreadystatechange = function () {
          if (request.readyState === 4) {
            try {
              if (request.status === 200) {
                var contentType = request.getResponseHeader('content-type');
                if (/^application\/json/i.test(contentType)) {
                  var response = JSON.parse(request.responseText);
                  connector.connection.session = response;
                  that.authenticateworkspace(xhr, cgiUrl, connector);
                } else {
                  throw new Error('Unsupported content type: ' + contentType);
                }
              } else {
                throw new Error(request.status + ' ' + request.statusText);
              }
            } catch (error) {
              console.error(error);
            }
          }
        };
        request.open('POST', connector.connection.url + '/auth', true);
        request.setRequestHeader('Accept', 'application/json');
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        request.send('username=' + encodeURIComponent(connector.connection.credentials.username) +
          '&' + 'password=' +
          encodeURIComponent(connector.connection.credentials.password));
      } else {
        ModalAlert.showError(lang.AuthenticationError);
      }
    },

    authenticateworkspace: function (xhr, cgiUrl, connector) {
      xhr.open("GET", cgiUrl + "/xecmauth", true);
      xhr.setRequestHeader("OTCSTicket", connector.connection.session.ticket);
      xhr.withCredentials = true;
      xhr.send(null);
    }

  });

  return OpenFullPageWorkpsace;
});
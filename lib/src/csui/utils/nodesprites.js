/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */

define([
  'csui/lib/underscore', 'csui/lib/backbone',
  'csui/models/mixins/rules.matching/rules.matching.mixin',
  'i18n!csui/utils/impl/nls/lang',
  'csui-ext!csui/utils/nodesprites'
], function (_, Backbone, RulesMatchingMixin, lang, extraIcons) {

  var NodeSpriteModel = Backbone.Model.extend({

    defaults: {
      sequence: 100,
      className: null
    },

    constructor: function NodeSpriteModel(attributes, options) {
      Backbone.Model.prototype.constructor.apply(this, arguments);
      this.makeRulesMatching(options);
    }

  });

  RulesMatchingMixin.mixin(NodeSpriteModel.prototype);

  var NodeSpriteCollection = Backbone.Collection.extend({

    model: NodeSpriteModel,
    comparator: "sequence",

    constructor: function NodeSpriteCollection(models, options) {
      Backbone.Collection.prototype.constructor.apply(this, arguments);
    },

    findClass: function (compareType, key, val) {
      var nodeSprite = this.find(function (item) {
        var values = item.get(compareType);
        if (values === undefined) {
          return undefined;
        }
        if (_.isArray(values[key])) {
          var keyValues = values[key];
          for (var i = 0; i < keyValues.length; i++) {
            if (keyValues[i] === val) {
              return true;
            }
          }
        }

        return (values[key] === val);
      });
      return nodeSprite ? nodeSprite.get('className') : undefined;
    },

    findTypeByNode: function (node) {
      var typeName = node.get('type_name') || lang.NodeTypeUnknown;

      var nodeSprite = this.findByNode(node);
      if (nodeSprite) {
        var spriteName = _.result(nodeSprite.attributes, 'mimeType');
        if (spriteName) {
          typeName = spriteName;
        }
      }

      return typeName;
    },

    findClassByNode: function (node) {
      var nodeSprite = this.findByNode(node);
      return nodeSprite && _.result(nodeSprite.attributes, 'className') || '';
    },

    findByNode: function (node) {
      return this.find(function (item) {
        return item.matchRules(node, item.attributes);
      });
    }

  });

  var nodeSprites = new NodeSpriteCollection([
    {
      equalsNoCase: {
        mime_type: [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
          'application/vnd.ms-excel.sheet.macroEnabled.12',
          'application/vnd.ms-excel.template.macroEnabled.12',
          'application/vnd.ms-excel.addin.macroEnabled.12',
          'application/vnd.ms-excel.sheet.binary.macroEnabled.12'
        ]
      },
      className: 'csui-icon mime_excel',
      iconName: 'csui_mime_excel',
      mimeType: lang.NodeTypeXLS,
      sequence: 50
    },
    {
      equalsNoCase: {
        mime_type: [
          'application/visio',
          'application/x-visio',
          'application/vnd.visio',
          'application/visio.drawing',
          'application/vsd',
          'application/x-vsd',
          'image/x-vsd',
          'application/vnd.visio2013',
          'application/vnd.ms-visio.drawing',
          'application/vnd.ms-visio.viewer',
          'application/vnd.ms-visio.stencil',
          'application/vnd.ms-visio.template'
        ]
      },
      className: 'csui-icon mime_visio',
      iconName: 'csui_mime_visio',
      mimeType: lang.NodeTypeVisio,
      sequence: 50
    },
    {
      equalsNoCase: {
        mime_type: [
          'application/vnd.oasis.opendocument.spreadsheet',
          'application/vnd.oasis.opendocument.spreadsheet-template',
          'application/vnd.sun.xml.calc',
          'application/vnd.sun.xml.calc.template',
          'application/vnd.stardivision.calc',
          'application/x-starcalc'
        ]
      },
      className: 'csui-icon mime_spreadsheet',
      iconName: 'csui_mime_spreadsheet',
      mimeType: lang.NodeTypeSpreadsheet,
      sequence: 50
    },
    {
      equalsNoCase: {
        mime_type: [
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/vnd.openxmlformats-officedocument.presentationml.template',
          'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
          'application/vnd.ms-powerpoint.addin.macroEnabled.12',
          'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
          'application/vnd.ms-powerpoint.template.macroEnabled.12',
          'application/vnd.ms-powerpoint.slideshow.macroEnabled.12'
        ]
      },
      className: 'csui-icon mime_powerpoint',
      iconName: 'csui_mime_powerpoint',
      mimeType: lang.NodeTypePPT,
      sequence: 50
    },
    {
      equalsNoCase: {
        mime_type: [
          'application/vnd.google-apps.presentation', // GSLIDE - Google Drive Presentation
          'application/x-iwork-keynote-sffkey', // KEY, KEYNOTE — Apple Keynote Presentation
          'application/vnd.wolfram.mathematica', // NB — Mathematica Slideshow
          'application/vnd.wolfram.player', // NBP — Mathematica Player slideshow
          'application/vnd.oasis.opendocument.presentation', // ODP — OpenDocument Presentation
          'application/vnd.oasis.opendocument.presentation-template', // OTP - ODP Template
          'application/vnd.sun.xml.impress',
          'application/vnd.sun.xml.impress.template',
          'application/vnd.stardivision.impress',
          'application/vnd.stardivision.impress-packed',
          'application/x-starimpress',
          'application/vnd.lotus-freelance', // PRZ — Lotus Freelance Graphics
          'application/vnd.stardivision.impress', // SDD - Star Office's StarImpress
          'application/vnd.corel-presentations', // SHW — Corel Presentations slide show creation
          'application/vnd.sun.xml.impress', // SXI — OpenOffice.org XML (obsolete) Presentation
          'application/vnd.ms-officetheme', // THMX — Microsoft PowerPoint theme template
          'application/vnd.sun.xml.impress.template '// STI — OpenOffice Impress template

        ]
      },
      className: 'csui-icon mime_presentation',
      iconName: 'csui_mime_presentation',
      mimeType: lang.NodeTypePresentation,
      sequence: 50
    },
    {
      equalsNoCase: {
        mime_type: [
          'application/vnd.ms-publisher',
          'application/x-mspublisher'
        ]
      },
      className: 'csui-icon mime_publisher',
      iconName: 'csui_mime_publisher',
      mimeType: lang.NodeTypePublisher,
      sequence: 50
    },
    {
      equalsNoCase: {
        mime_type: [
          'application/vnd.oasis.opendocument.formula',
          'application/vnd.sun.xml.math',
          'application/vnd.stardivision.math',
          'application/x-starmath'
        ]
      },
      className: 'csui-icon mime_formula',
      iconName: 'csui_mime_formula',
      mimeType: lang.NodeTypeFormula,
      sequence: 50
    },
    {
      equalsNoCase: {
        mime_type: [
          'application/vnd.pdf',
          'application/x-pdf',
          'application/pdf'
        ]
      },
      className: 'csui-icon mime_pdf',
      iconName: 'csui_mime_pdf',
      mimeType: lang.NodeTypePDF,
      sequence: 50
    },
    {
      equalsNoCase: {
        mime_type: [
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
          'application/vnd.ms-word.document.macroEnabled.12',
          'application/vnd.ms-word.template.macroEnabled.12'
        ]
      },
      className: 'csui-icon mime_word',
      iconName: 'csui_mime_word',
      mimeType: lang.NodeTypeDOC,
      sequence: 50
    },
    {
      equalsNoCase: {
        mime_type: [
          'application/dwg',
          'drawing/dwg'
        ]
      },
      className: 'csui-icon mime_dwg',
      iconName: 'csui_mime_dwg',
      mimeType: lang.NodeTypeDWG,
      sequence: 50
    },
    {
      equalsNoCase: {
        mime_type: [
          'application/onenote',
          'application/msonenote'
        ]
      },
      className: 'csui-icon mime_onenote',
      iconName: 'csui_mime_onenote',
      mimeType: lang.NodeTypeONE,
      sequence: 50
    },
    {
      equalsNoCase: {
        mime_type: [
          'application/vnd.ms-project',
          'application/msproj',
          'application/msproject',
          'application/x-msproject',
          'application/x-ms-project',
          'application/mpp'
        ]
      },
      className: 'csui-icon mime_project',
      iconName: 'csui_mime_project',
      mimeType: lang.NodeTypeMPP,
      sequence: 50
    },
    {
      startsWithNoCase: {mime_type: 'image/'},
      className: 'csui-icon mime_image',
      iconName: 'csui_mime_image',
      mimeType: lang.NodeTypeImage,
      sequence: 50
    },
    {
      startsWithNoCase: {mime_type: 'audio/'},
      className: 'csui-icon mime_audio',
      iconName: 'csui_mime_audio',
      mimeType: lang.NodeTypeAudio,
      sequence: 50
    },
    {
      startsWithNoCase: {mime_type: 'text/'},
      className: 'csui-icon mime_paper',
      iconName: 'csui_mime_paper',
      mimeType: lang.NodeTypeText,
      sequence: 50
    },
    {
      equalsNoCase: {mime_type: 'text/html'},
      className: 'csui-icon mime_html',
      iconName: 'csui_mime_html',
      mimeType: lang.NodeTypeHtml,
      sequence: 40
    },
    {
      startsWithNoCase: {mime_type: 'video/'},
      className: 'csui-icon mime_video',
      iconName: 'csui_mime_video',
      mimeType: lang.NodeTypeVideo,
      sequence: 50
    },
    {
      equalsNoCase: {
        mime_type: [
          'application/x-rar-compressed',
          'application/zip',
          'application/x-zip',
          'application/x-zip-compressed'
        ]
      },
      className: 'csui-icon mime_zip',
      iconName: 'csui_mime_zip',
      mimeType: lang.NodeTypeCompressed,
      sequence: 50
    },
    {
      equals: {type: 136},
      className: 'csui-icon compound_document',
      iconName: 'csui_mime_compound_document',
      withColorSchemaIconName: 'csui_colorschema_mime_compound_document',
      sequence: 100
    },
    {
      equals: {type: 138},
      className: 'csui-icon csui-mime-compound-release',
      iconName: 'csui_mime_compound_release32',
      sequence: 100
    },
    {
      equals: {type: 139},
      className: 'csui-icon csui-mime-compound-revision',
      iconName: 'csui_mime_compound_revision32',
      sequence: 100
    },
    {
      equals: {type: 144},
      className: 'csui-icon mime_document',
      iconName: 'csui_mime_document',
      sequence: 100
    },
    {
      equals: {type: 736},
      className: 'csui-icon mime_drawing',
      iconName: 'csui_mime_drawing',
      sequence: 100
    },
    {
      equals: {type: 258},
      className: 'csui-icon csui-icon-saved-search-query',
      iconName: 'csui_mime_saved_search',
      mimeType: lang.NodeTypeSearchQuery,
      sequence: 100
    },
    {
      equals: {type: 292},
      className: 'csui-icon csui-icon-query-form-search',
      iconName: 'csui_mime_query_form_search',
      mimeType: lang.NodeTypeSearchForm,
      sequence: 100
    },
    {
      equals: {type: 140},
      className: 'csui-icon url1',
      iconName: 'csui_mime_url',
      mimeType: lang.NodeTypeURL,
      sequence: 100
    },
    {
      equals: {type: 1},
      className: 'csui-icon shortcut1',
      iconName: 'csui_mime_shortcut',
      withColorSchemaIconName: 'csui_colorschema_mime_shortcut',
      sequence: 100
    },
    {
      equals: {type: 2},
      className: 'csui-icon mime_generation',
      iconName: 'csui_mime_generation',
      sequence: 100
    },
    {
      equals: {type: 131},
      className: 'csui-icon category1',
      iconName: 'csui_mime_category',
      sequence: 100
    },
    {
      equals: {type: 202},
      className: 'csui-icon csui-icon-project',
      iconName: 'csui_mime_cs_project',
      withColorSchemaIconName: 'csui_colorschema_mime_cs_project',
      sequence: 100
    },
    {
      equals: {type: 298},
      className: 'csui-icon collection',
      iconName: 'csui_mime_collection',
      withColorSchemaIconName: 'csui_colorschema_mime_collection',
      sequence: 100
    },
    {
      equals: {type: 141},
      className: 'csui-icon csui-icon-enterprise-volume',
      iconName: 'csui_mime_enterprise',
      sequence: 100
    },
    {
      equals: {type: 142},
      className: 'csui-icon csui-icon-personal-volume',
      iconName: 'csui_mime_enterprise',
      sequence: 100
    },
    {
      equals: {type: 133},
      className: 'csui-icon csui-icon-category-volume',
      iconName: 'csui_mime_category_volume',
      sequence: 100
    },
    {
      equals: {type: 132},
      className: 'csui-icon csui-icon-node-category-folder',
      iconName: 'csui_mime_category_volume',
      sequence: 100
    },
    {
      equals: {type: 299},
      className: 'csui-icon csui-icon-node-livereport',
      iconName: 'csui_mime_livereport',
      withColorSchemaIconName: 'csui_colorschema_mime_livereport',
      sequence: 100
    },
    {
      equals: {type: 212},
      className: 'csui-icon csui-icon-node-milestone',
      iconName: 'csui_mime_milestone',
      sequence: 100
    },
    {
      equals: {type: 218},
      className: 'csui-icon csui-icon-node-poll',
      iconName: 'csui_mime_poll',
      sequence: 100
    },
    {
      equals: {type: 384},
      className: 'csui-icon csui-icon-node-prospector',
      iconName: 'csui_mime_prospector',
      sequence: 100
    },
    {
      equals: {type: 206},
      className: 'csui-icon csui-icon-node-task',
      iconName: 'csui_mime_task',
      sequence: 100
    },
    {
      equals: {type: 205},
      className: 'csui-icon csui-icon-node-task-group',
      iconName: 'csui_mime_task_group',
      sequence: 100
    },
    {
      equals: {type: 204},
      className: 'csui-icon csui-icon-node-task-list',
      iconName: 'csui_mime_task_list',
      withColorSchemaIconName: 'csui_colorschema_mime_task_list',
      sequence: 100
    },
    {
      equals: {type: 957 },
      className: 'csui-icon csui-icon-perspective',
      iconName: 'csui_mime_perspective',
      sequence: 100
    },
    {
      equals: {type: 958 },
      className: 'csui-icon csui-icon-rule',
      iconName: 'csui_mime_rule',
      sequence: 100
    },
    {
      equals: {type: 955},
      className: 'csui-icon csui-icon-perspective-assets-folder',
      iconName: 'csui_mime_perspective_assets_folder',
      sequence: 100
    },
    {
      equals: {type: 954},
      className: 'csui-icon csui-icon-perspective-assets-volume',
      iconName: 'csui_mime_perspective_assets_volume',
      sequence: 100
    },
    {
      equals: {type: 899},
      className: 'csui-icon csui-icon-node-virtual-folder',
      iconName: 'csui_mime_virtual_folder',
      withColorSchemaIconName: 'csui_colorschema_mime_virtual_folder',
      sequence: 100
    },
    {
      equals: {type: 146},
      className: 'csui-icon mime_custom_view',
      iconName: 'csui_mime_custom_view',
      sequence: 30
    },
    {
      equals: {type: 153},
      className: 'csui-icon assignment-workflow',
      iconName: 'csui_mime_assignment_workflow',
      sequence: 100
    },
    {
      equals: {type: 128},
      className: 'csui-icon mime_workflow_map',
      iconName: 'csui_mime_workflow_map',
      withColorSchemaIconName: 'csui_colorschema_mime_workflow_map',
      sequence: 100
    },
    {
      equals: {type: 190},
      className: 'csui-icon mime_workflow_status',
      iconName: 'csui_mime_workflow_status',
      withColorSchemaIconName: 'csui_colorschema_mime_workflow_status',
      sequence: 100
    },
    {
      equals: {type: 207},
      className: 'csui-icon mime_channel',
      iconName: 'csui_mime_channel',
      withColorSchemaIconName: 'csui_colorschema_mime_channel',
      sequence: 100
    },
    {
      equals: {type: 208},
      className: 'csui-icon mime_news',
      iconName: 'csui_mime_news_item',
      sequence: 100
    },
    {
      equals: {type: 215},
      className: 'csui-icon mime_discussion',
      iconName: 'csui_mime_conversation',
      sequence: 100
    },
    {
      equals: {type: 335},
      className: 'csui-icon mime_xml_dtd',
      iconName: 'csui_mime_xml',
      withColorSchemaIconName: 'csui_colorschema_mime_xml',
      sequence: 30
    },
    {
      equals: {type: 223},
      className: 'csui-icon mime_form',
      iconName: 'csui_mime_form',
      withColorSchemaIconName: 'csui_colorschema_mime_form',
      sequence: 100
    },
    {
      equals: {type: 230},
      className: 'csui-icon mime_form_template',
      iconName: 'csui_mime_layout_template',
      withColorSchemaIconName: 'csui_colorschema_mime_layout_template',
      sequence: 100
    },
    {
      equals: {type: 1281},
      className: 'csui-icon icon-pulse-comment',
      iconName: 'csui_mime_pulse_comment',
      sequence: 100
    },
    {
      equals: {type: 5574},
      className: 'csui-icon mime_wiki_page',
      iconName: 'csui_mime_wiki_page',
      sequence: 10
    },
    {
      equals: {type: 5573},
      className: 'csui-icon mime_wiki',
      iconName: 'csui_mime_wiki',
      withColorSchemaIconName: 'csui_colorschema_mime_wiki',
      sequence: 10
    },


    {
      equals: {container: 'nonselectable'},
      className: 'csui-icon mime_folder_nonselectable',
      iconName: 'csui_mime_folder_nonselectable32',
      sequence: 1000
    },
    {
      equals: {container: true},
      className: 'csui-icon mime_folder',
      iconName: 'csui_mime_folder',
      withColorSchemaIconName: 'csui_colorschema_mime_folder',
      sequence: 1000
    },
    {
      equals: {type: 901},
      className: 'csui-icon mime_facets_volume',
      iconName: 'csui_mime_facets_volume',
      sequence: 100
    },
    {
      equals: {type: 902},
      className: 'csui-icon csui-icon-custom-column',
      iconName: 'csui_mime_custom_column',
      sequence: 100
    },
    {
      equals: {type: 903},
      className: 'csui-icon mime_facets_tree',
      iconName: 'csui_mime_facets_tree',
      sequence: 100
    },
    {
      equals: {type: 904},
      className: 'csui-icon mime_facets',
      iconName: 'csui_mime_facets',
      sequence: 100
    },
    {
      className: 'csui-icon mime_document',
      iconName: 'csui_mime_document',
      sequence: 10000
    },
    {
      startsWithNoCase: {mime_type: 'application/sdd'},
      className: 'csui-icon mime_application',
      iconName: 'csui_mime_application',
      mimeType: lang.NodeTypeSDD,
      sequence: 50
    }
  ]);

  if (extraIcons) {
    nodeSprites.add(_.flatten(extraIcons, true));
  }

  return nodeSprites;

});

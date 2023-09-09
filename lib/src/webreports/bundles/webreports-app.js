/* Copyright (c) 2016-2017  OpenText Corp. All Rights Reserved. */



define([
    "webreports/widgets/tilereport/tilereport.view",
    "json!webreports/widgets/tilereport/tilereport.manifest.json",
    "i18n!webreports/widgets/tilereport/impl/nls/tilereport.manifest",
    "webreports/widgets/nodeslistreport/nodeslistreport.view",
    "json!webreports/widgets/nodeslistreport/nodeslistreport.manifest.json",
    "i18n!webreports/widgets/nodeslistreport/impl/nls/nodeslistreport.manifest",
    "webreports/widgets/widget.carousel/widget.carousel.view",
    "json!webreports/widgets/widget.carousel/widget.carousel.manifest.json",
    "i18n!webreports/widgets/widget.carousel/impl/nls/widget.carousel.manifest",
    "webreports/widgets/table.report/table.report.view",
    "json!webreports/widgets/table.report/table.report.manifest.json",
    "i18n!webreports/widgets/table.report/impl/nls/table.report.manifest",
    "webreports/widgets/parameter.prompt.form/parameter.prompt.form.view",
    "json!webreports/widgets/parameter.prompt.form/parameter.prompt.form.manifest.json",
    "i18n!webreports/widgets/parameter.prompt.form/impl/nls/parameter.prompt.form.manifest",
    "webreports/widgets/nodestable.report/nodestable.report.view",
    "json!webreports/widgets/nodestable.report/nodestable.report.manifest.json",
    "i18n!webreports/widgets/nodestable.report/impl/nls/nodestable.report.manifest",
    "webreports/models/nodestablereport/nodestablereport.model",
    "webreports/models/tablereport/tablereport.model",
    "webreports/models/wrtext/wrtext.model",
    "webreports/models/widget.carousel/widget.carousel.model",
    "webreports/models/run.webreport.pre/run.webreport.pre.model",
    "webreports/models/run.webreport/run.webreport.model",
    "webreports/utils/commands/defaultactionitems",
    "webreports/utils/commands/open.webreport",
    "webreports/utils/commands/open.classic.webreport",
    "webreports/utils/commands/execute.webreport",
    "webreports/controls/nodestablereport/nodestablereport.view",
    "webreports/controls/run.webreport.pre/run.webreport.pre.controller",
    "webreports/controls/status.screen/status.screen.view",
    "webreports/controls/table.report/table.report.view",

    "webreports/utils/icons/icons",
    "webreports/controls/table.report/cells/launch.subwebreport/launch.subwebreport.view",
    "webreports/utils/contexts/factories/carousel.collection.factory",
    "webreports/utils/contexts/factories/nodestablereport",
    "webreports/utils/contexts/factories/nodestablereportcolumns",
    "webreports/utils/contexts/factories/run.webreport.factory",
    "webreports/utils/contexts/factories/run.webreport.pre.controller.factory",
    "webreports/utils/contexts/factories/run.webreport.pre.factory",
    "webreports/utils/contexts/factories/table.report.factory",
    "webreports/utils/contexts/factories/wrtext.model.factory"
], {});

require(["require", "css"], function (require, css) {

    css.styleLoad(require, "webreports/bundles/webreports-app");

});

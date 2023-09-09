# NodeTypeIconView

Renders an icon of a node, which should be passed to the constructor as the `node` option.

The icon consists of a *main icon* decided mainly by the node `type` and
`mime_type` for documents and by *overlay icons*, which may indicate some
node characteristics.


```javascript
var node = new NodeModel(...),
    region = new Marionette.Region(...),
    iconView = new NodeTypeIconView({node: node});
region.show(iconView);
```

In addition to node you can specify the following options that influence the rendered icon:
1) `size: 'xsmall`: the icon is rendered in the specified size. Available sizes are described in
 icons.v2.md.
2) `useTwoColorIcon: true`: if available, an alternative version of the icon is rendered, which
 is optimized for being displayed by using only two colors.
3) `colorFirst: 'OT Steal +1`: if using together with a two color icon, it overrides the default
 for the first color (fill and stroke in the svg are set to this color). Note that the name of
  the color must be from the OT color schema - described in icons.v2.md
4) `colorSecond: 'Burnt`: same as colorFirst, but for the secoond color.

Note: to be able to use useTwoColorIcon, colorFirst or colorSecond the SVG must be drawn in a way
 that all elements (path, poly, circle, etc.) that should get colorFirst must be in a layer with
 name 'colorFirst'. The exported SVG makes a group with id="colorFirst" out of this layer and
 during build of csui the layer id is converted into a corresponding class name.

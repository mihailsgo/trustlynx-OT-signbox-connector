# CSUI Context Plugin

Ensures csui-specific properties, which are supposed to be set on a context instance. The viewstate in particular.

This is not usual, because objects living in the context are supposed to be maintained by factories. This seems to be a lack of interface to pass common properties around. But as long as such properties do not conflict with each other, a plugin can be used to ensure this.

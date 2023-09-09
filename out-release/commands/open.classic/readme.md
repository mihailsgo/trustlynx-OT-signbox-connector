This sample currently only works with a valid server.
In order to make it run, open test/index.html and search for

        'csui/utils/contexts/factories/connector': {
          connection: {
            url: 'http://decker.opentext.com/alpha/cs.exe/api/v1',
            supportPath: '/alphasupport',
            // Avoid the login dialog
            credentials: {
              username: 'Admin',
              password: '...'
            }
          }
        },

Configure *url*, *supportPath* and *credentials* according to your environment.


# OpenClassicCustom

A command for opening the CS Classic UI properties page for the current node.
The command is added to the nodestable toolbar.

## Shows how to

* Override the OpenClassicPage command to extend base url by query params.
* Register the command in the CS UI framework
* Extend the nodestable toolbar to use the OpenClassicCustom command

## Integration

1. Move the command directory to a sub-directory in the `src` directory
   of your extension project.
2. Replace 'greet' prefix in all source file to the prefix of your
   extension.
3. Merge the following content to the the `<prefix>-extensions.json`
   file in the `src` directory of your extension project to register
   the command and to make a button triggering it appear on the toolbar
   of the nodestable widget.  Replace the "samples" prefix with your own.

```json
{
  "csui/utils/commands": {
    "extensions": {
      "samples": [
        "samples/commands/open.classic/open.classic.command"
      ]
    }
  },
  "csui/widgets/nodestable/toolbaritems": {
    "extensions": {
      "samples": [
        "samples/commands/open.classic/open.classic.nodestable.toolitems"
      ]
    }
  }
}
```

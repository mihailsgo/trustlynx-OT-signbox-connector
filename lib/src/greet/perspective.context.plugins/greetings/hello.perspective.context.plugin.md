# HelloPerspectiveContextPlugin

Opens a client-side perspective if `applicationScope` is set to "greetings"
and/or `greetSubject` to a defined value.

## Shows how to

* Control the opened perspective by a context model
* Implement perspectives, which are either object-specific or general
* Develop the command using a debugging page mocked by a global mock
 
## Integration

1. Move the plugin directory to a sub-directory in the `src` directory
   of your extension project.
2. Replace 'greet' prefix in all source file to the prefix of your
   extension.
3. Merge the following content to the the `<prefix>-extensions.json`
   file in the `src` directory of your extension project to register
   the perspective context plugin and router.

```json
{
  "csui/utils/contexts/perspective/perspective.context": {
    "extensions": {
      "greet": [
        "greet/perspective.context.plugins/greetings/hello.perspective.context.plugin"
      ]
    }
  },
  "csui/pages/start/perspective.routing": {
    "extensions": {
      "greet": [
        "greet/perspective.routers/greetings/hello.perspective.router"
      ]
    }
  }
}
```

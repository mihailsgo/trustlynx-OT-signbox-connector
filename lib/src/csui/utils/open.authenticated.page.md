# openAuthenticatedPage

Opens a new URL either in the same window or in a new one. That URL is known to require cookies for authentication. This function will ensure, that the authentication cookies will be set before the page is accessed, so that a login page will be avoided. The REST API authentication ticket will be used to get the cookies set.

For example, downloading a document:

```js
var cgiUrl = node.connector.getConnectionUrl().getCgiScript();
var query = {
  func: 'doc.fetchcsui', nodeid: node.get('id'), action: 'download'
};
var versionNumber = node.get('version_number');
if (versionNumber != null) {
  query.vernum = versionNumber;
}
var downloadUrl = Url.appendQuery(cgiUrl, Url.combineQueryString(query));

openAuthenticatedPage(node.connector, downloadUrl, { openInNewTab: false })
  .then(function () {
    console.log('Downloaded succeeded from', downloadUrl);
  }, function (error) {
    console.error('Download failed from', downloadUrl, '\n', error);
  });
```

## Troubleshooting

If the authentication fails, the user will face the blue screen of death. (The OTDS login page.) There will be no error message, because the original Smart UI page will be left and CS pages redirect to OTDS right away, when no authentication cookie is detected. You will need to preserve the log on the console and on the network panels to inspect the network communication. Some tips:

1. LLCookie can be rejected if you access the server over HTTP, but the cookie is available only for HTTPS (secure). Check the cookie settings in the server response.
2. The target page can be rejected, because the server allows redirecting to its pages only from trusted domains. Check the error on the page or in the server response.

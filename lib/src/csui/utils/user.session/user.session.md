UserSession
===========

UserSession provides a single point of access where the overall session 
expiration handling is done. It makes all session expiration handling related
configuration values available on a central place.

The UserSession is implemented as a "singleton". That means there exists
only one expiration warning dialog in the application.
The UserSession owns the expiration warning dialog which displays the
expiration countdown.

Here is a short description what each button does:
* "Continue session" prolongs the session by executing a REST-call
  (e.g. GET api/v1/auth) with help of the "makeAjaxCall" function.
* "End session now" terminates the session on user request.
  The authenticator has to provide a "makeAjaxCall" function which is used by
  the implementation to perform the logout call(s).
* "OK" just closes the expiration warning dialog to give the user the
  chance to initiate manually some REST-calls by e.g. browsing to/from a folder.
  This button is only offered if "makeAjaxCall" for continue session is not 
  supported.
  
In case of an error, especially with "Continue session" you get a modal alert
dialog with just a "Close" button. This signals that your session is already
invalid and that you get redirected to the determined target page.

In case of an error during "End session now" you may get a modal alert dialog
or an SmartUI error screen from ClassicUI which offers the buttons "Back" and
"Home". The only way to continue is to go to the SmartUI landing page and to 
perform as usual a login. If the buttons do not do the job, then you should
add the SmartUI landing page URL yourself in address bar.

The UserSession which works hand in hand with the authenticator has to be
initialized with the authenticator. The authenticator instance must not be 
replaced afterwards. So the authenticator instance must be the same
all the time. 
The initialization process currently looks like:

1. Call every time when a REST-call is received, including the authentication-call,
   the UserSession.updateSessionTicket(authenticator, request) function to start and 
   reset the expiration time monitoring. The authenticator must be already 
   authenticated before you can call this function. That means the 3 necessary members
   of the session tuple ('ticket', 'expires' and 'serverDate') must be valid and set.
   Each not-excluded REST-call updates internally the expiration time based on the
   retrieved "OTCSTickeExpires"- and "Date"-headers.


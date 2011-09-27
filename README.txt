****** What is KeyPass? *******

KeyPass is a password-storage solution. I tried to apply the principles of a proof-hosting application.

This is the client part of KeyPass.

Its features are :
 - store password along with a title, login and comment
 - password are organised in sections
 - a nice presentation, fully Ajax, with the bells and whistles of JQuery
 - interface & message are in French, but it's so minimalistic it should be no great deal
 - datas are encrypted client-side (so no matter if connection, or database, or anything else are compromised) with AES
 - auto-disconnect after 5 minutes idle time


****** Is there any components I should know about? ******

I've used many tiers-librairies:
 - JQuery for Ajax requests, some ui goodness
 - CryptoJS, http://code.google.com/p/crypto-js/


****** Set up ******

It's independent from server app, you can put in anywhere, on a CDN...
Then you have to set up server url in keypass.js

You will (anyway, should) want to personnalize salt and token in keypass.js, keep them pretty random and hairy.

The hard part, is to choose the user and the password.
Once choosen, you have to generate the hmac, by taping 'hmac(doPbkdf2(YOUR_PASWORD, myKey.salt), myKey.token)' in Javascript console (Google Chrome or Firebug make this pretty easy, you must be on the app).
Then, you have to set this in the database of the server app : add a line with user and the generated key (not the clear password) to key_user. You can use PhpMyAdmin for this.


****** License ******

Feel free to use, re-use it. I make no warranties about my code.
I would be happy to hear from users (or forks), don't hesitate to send me a message.

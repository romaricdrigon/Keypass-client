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
 - user/password can be changed pretty easily


****** Is there any components I should know about? ******

I've used many tiers-librairies:
 - JQuery for Ajax requests, some ui goodness
 - CryptoJS, http://code.google.com/p/crypto-js/


****** Set up ******

It's independent from server app, you can put in anywhere, on a CDN...
Then you have to set up server url in keypass.js

DO NOT personnalize salt and token now!

You can login in the app by default with admin/admin.

Then you'll see a link "Changer les informations de connexion" at the very bottom of the page. You'll have to re-enter the old password (admin), and then this allow you to change user and password.

Now you can (and should!) change salt and token in keypass.js, keep them pretty random and hairy.

****** License ******

Feel free to use, re-use it. I make no warranties about my code.
I would be happy to hear from users (or forks), don't hesitate to send me a message.

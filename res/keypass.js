/*
 * Keypass class
 * From Keypass-client app
 * You've several fields to edit here!
 */

/*
 * Globals
 */
	myKey = null;
	/* ---------------------- first step, set actual serevr URL ---------------------- */
	serverUrl = "http://localhost:8888/Keypass/"; // don't forget end slash

/*
 * Small class, to store & persist data
 */ 
function KeyPass(user, password) {
	/* ---------------------- second step, you have to personnalize theses ---------------------- */
	this.salt = 'hjK3uGD8P9a2hLKBJSQM';
	this.token = '0hwOTIaGnPXkem7qRDqWryzmgaVkUziJO4vnggoVEwh5wd7PRKZW81TphqFvlMK'; // token will be hmac-ed, and send to server for authentification
	
	/* ---------------------- no more changes to do ---------------------- */
		
	// immediatly strengten password, and store this version in a private (local) var
	var _password = doPbkdf2(password, this.salt);

	this.user = user;
	this.key = hmac(_password, this.token);
	
	this.data = []; // global that'll contain all data
	this.id = 0; // we'll use this to number items
	
	// functions - we can't access password directly
	this.encrypt = function(plain) {return myEncrypt(plain, _password)};
	this.decrypt = function(cipher) {return myDecrypt(cipher, _password)};
	this.validatePassword = function(str) {
		if (doPbkdf2(str, this.salt) == _password) {
			return true;
		} else {
			return false;
		}
	}
	this.setPassword = function(pass) {_password = pass};
}
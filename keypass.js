/* 
 * KeyPass application code
 * First version by Romaric Drigon, September 2011
 * 
 * Using Crypto Js, http://code.google.com/p/crypto-js/
 */

/*
 * Globals
 */
	myKey = null;
	serverUrl = "http://localhost:8888/Keypass/";

/*
 * "Script" code, run immediately at the launch
 */

/*
 * Auto-disconnect after some idle time
 */
	idleTime = 0;
	$(document).ready(function () {
	    //Increment the idle time counter every minute.
	    var idleInterval = setInterval("timerIncrement()", 60000); // 1 minute
	
	    //Zero the idle timer on mouse movement.
	    $(this).mousemove(function (e) {
	        idleTime = 0;
	    });
	    $(this).keypress(function (e) {
	        idleTime = 0;
	    });
	})

/* --- end of script code --- */
		
/*
 * Small class, to store & persist data
 */ 
function KeyPass(user, password) {
	this.salt = 'hjK3uGD8P9a2hLKBJSQM';
	
	// immediatly strengten password, and store this version
	this.password = doPbkdf2(password, this.salt);
	
	this.user = user;
	
	// token will be hmac-ed, and send to server for authentification
	this.token = '0hwOTIaGnPXkem7qRDqWryzmgaVkUziJO4vnggoVEwh5wd7PRKZW81TphqFvlMK';
	this.key = hmac(this.password, this.token);
	
	this.data = []; // global that'll contain all data
	
	this.id = 0; // we'll use this to number items
}

/*
 * Login
 * first function to be called, entrance point
 */ 
function login(user, password) {
	if (user.length == 0) {
		error("Veuillez renseigner le nom d'utilisateur !");
		return;
	}
	if (password.length == 0) {
		error("Veuillez renseigner le mot de passe!");
		return;
	}
	
	myKey = new KeyPass(user, password);
	
	// we send the request to server-app
	$.ajax({
		type: 'POST',
		url: serverUrl+"request/gets",
		data: {user: myKey.user, key: myKey.key},
		success: displayList,
		dataType: 'json',
		error: serverError
	});
}

/*
 * Will display uncrypted items list
 */
function displayList(data) {
	$("#login").hide();
	$("#main").show();
	
	// empty form
	document.forms['log'].elements['user'].value = 'Utilisateur';
	document.forms['log'].elements['password'].value = 'Mot de passe';
	
	success('Bienvenu '+myKey.user+' !');
	
	for (var _section in data) {
		// decrypt blop & convert from JSON
		var _json = decrypt(data[_section]["blop"], myKey.password);
		var _content = (_json=='')?[]:JSON.parse(_json); // do not decode empty JSON!
		for (var _item in _content) {
			// we attribute ids to items
			_content[_item]["id"] = myKey.id;
			myKey.id++;
		}
		
		/*
		 * we have another Json, let's display it
		 * it's basic structure is :
		 *	[
		 *		{
		 *			title
		 *			user
		 *			password
		 *			comment
		 * 			{id} (maybe be missing, will be overwritten anyway)
		 *		}
		 *	]
		 */ 
		
		var _title = decrypt(data[_section]["title"], myKey.password); // decode from base64
		var _id = data[_section]["id"];
		myKey.data.push({content: _content, title: _title, id: _id});
		
		// create (html) array
		addArray(_content, _title, _id);
	}
	
	$("#donnees").append('<input type="button" onClick="addSection()" value="Ajouter une section" />');
}

/*
 * Logout : overwrite data in memory, return to login
 */
function logout() {
	if (myKey !== null) {
		myKey = null; // yes, it's THAT easy
		
		$("#donnees").empty(); // don't forget to empyt DOM !
		$("#main").hide();
		$("#login").show();
		
		success('D&eacute;connexion...');
	}
}

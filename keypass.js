/* 
 * KeyPass application code
 * First version by Romaric Drigon, September 2011
 * 
 * Using Crypto Js, http://code.google.com/p/crypto-js/
 */

// small class, to store & persist data
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
		error("Veuille renseigner le mot de passe!");
		return;
	}
	
	myKey = new KeyPass(user, password);
	
	// we send the request to server-app
	$.ajax({
		type: 'POST',
		url: "http://localhost:8888/Keypass/request/gets",
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
	
	$('#message').html('Bienvenu '+myKey.user+' !');
	
	for (section in data) {
		// decrypt blop & convert from JSON
		var _json = decrypt(data[section]["blop"], myKey.password);
		var _content = (_json=='')?[]:JSON.parse(_json); // do not decode empty JSON!
		for (item in _content) {
			// we attribute ids to items
			_content[item]["id"] = myKey.id;
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
		
		var _title = base64ToString(data[section]["title"]); // decode from base64
		var _id = data[section]["id"];
		myKey.data.push({content: _content, title: _title, id: _id});
		
		// create (html) array
		addArray(_content, _title, _id);
	}
	
	$("#main").append('<input type="button" onClick="addSection()" value="Ajouter une section" />');
}

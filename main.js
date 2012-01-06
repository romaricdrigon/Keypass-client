/* 
 * KeyPass application code
 * First version by Romaric Drigon, September 2011
 * 
 * Using Crypto Js, and some jQuery goodness
 */

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
	
	// set timer
	setTimer();
	
	success('Bienvenu '+myKey.user+' !');
	
	for (var _section in data) {
		// decrypt blop & convert from JSON
		var _json = myKey.decrypt(data[_section]["blop"]);
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
		
		var _title = myKey.decrypt(data[_section]["title"]);
		var _id = data[_section]["id"];
		myKey.data.push({content: _content, title: _title, id: _id});
		
		// create (html) array
		addArray(_content, _title, _id);
	}
	
	$("#donnees").prepend('<input type="button" onClick="addSection()" value="Ajouter une section" /> | <input type="button" onClick="changeCredentials()" value="Changer les informations de connexion" />');
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

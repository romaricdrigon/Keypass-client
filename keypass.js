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

function displayList(data) {
	$("#login").hide();
	$("#main").show();
	
	$('#message').html('Bienvenu '+myKey.user+' !');
	
	for (section in data) {
		// decrypt blop & convert from JSON
		var _json = decrypt(data[section]["blop"], myKey.password);
		var _content = (_json=='')?[]:JSON.parse(_json); // do not decode empty JSON!
		var _title = base64ToString(data[section]["title"]); // decode from base64
		var _id = data[section]["id"];
		myKey.data.push({content: _content, title: _title, id: _id});
		
		// create (html) array
		addArray(_content, _title, _id);
		
		/*
		 * we have another Json, let's display it
		 * it's basic structure is :
		 *	[
		 *		{
		 *			title
		 *			user
		 *			password
		 *			comment
		 *		}
		 *	]
		 */ 
	}
	
	$("#main").append('<input type="button" onClick="addSection()" value="Ajouter une section" />'); // add it to DOM
}

/*
 * "Intern" function, to create an array of items
 */
function addArray(items, title, id) {
	// first, the title
	$("#donnees").append("<h3>"+title+"</h3>");
	
	// create array
	var _html = '<table width="100%"><thead><tr><th>Titre</th><th>Login</th><th>MdP</th><th>Commentaire</th></tr></thead><tbody id="section_'+id+'">';
	for (row in items) {
		_html += addRow(items[row]);
	}
	var _form = '<form name="add_'+id+'"><input type="text" name="title" size="30" /><input type="text" name="login" size="25" />';
	_form += '<input type="text" name="password" size="25" /><input type="text" name="comment" size="70" /><input type="button" onClick="add('+id+')" value="+" /></form>';
	_html += '</tbody></table>'+_form+'<hr />';
	
	$("#donnees").append(_html); // add it to DOM
}
// add an element in the array
function addRow(item) {
	var _html = '<tr>';
	
	for (column in item) {
		_html += "<td>"+item[column]+"</td>";
	}
	
	_html += "</tr>";
	
	return _html;
}

/*
 * Add an element
 */
function add(id) {
	if (document.forms['add_'+id].elements['title'].value == '' || document.forms['add_'+id].elements['login'].value == '' || document.forms['add_'+id].elements['password'].value == '') {
		error("Les champs Titre, Login et MdP sont obligatoires");
		return;
	}
	
	var _index = -1;
	
	// we have to search the right object, and feed it
	// I don't find a better way than a loop, sorry
	for (item in myKey.data) {
		if (myKey.data[item]["id"] == id) {
			_index = item;
			break;
		}
	}
	
	if (_index == -1) {
		// we did not found the right line
		error("Impossible d'ajouter l'élément");
		return;
	} else {
		var _obj = {
						title: document.forms['add_'+id].elements['title'].value,
						user: document.forms['add_'+id].elements['login'].value,
						password: document.forms['add_'+id].elements['password'].value,
						comment: document.forms['add_'+id].elements['comment'].value
					};
		myKey.data[_index]["content"].push(_obj);
	}
					
	// we serialize and then encrypt data (the whole section)
	var _content = JSON.stringify(myKey.data[_index]["content"]);
	var _data = encrypt(_content, myKey.password);
	
	// ask the server to do the same
	// we resend our key each time, to validate it's not anyone doing bullshit
	$.ajax({
		type: 'POST',
		url: "http://localhost:8888/Keypass/request/change_data",
		data: {content: _data, id: id, user: myKey.user, key: myKey.key},
		success: successMessage,
		error: serverError
	});
	
	// we add the line in DOM
	$("#section_"+id).append(addRow(_obj));
	
	// empty form
	document.forms['add_'+id].elements['title'].value = '';
	document.forms['add_'+id].elements['login'].value = '';
	document.forms['add_'+id].elements['password'].value = '';
	document.forms['add_'+id].elements['comment'].value = '';
}

/*
 * Add a section
 */
function addSection() {
	var _name = window.prompt('Veuillez rentrer le nom de la nouvelle section. Attention, le titre n\'est pas crypté.', '');
	
	if (_name != '') {
		// we have (sadly) to backup name as a global
		name = _name;
		
		// we don't know the id of the item, there maybe gaps in the database, we'll ask the server first
		$.ajax({
			type: 'POST',
			url: "http://localhost:8888/Keypass/request/add_section",
			data: {title: stringToBase64(_name), user: myKey.user, key: myKey.key},
			success: addSectionId,
			error: serverError
		});		
	} else {
		error("Veuillez rentrer un titre !");
	}
}

function addSectionId(data) {
	//check if data is numeric
 	if (!isNaN(parseFloat(data)) && isFinite(data)) {
 		_id = data;

		myKey.data[_id] = {content: [], title: name, id: _id};
		
		addArray(myKey.data[_id]["content"], myKey.data[_id]["title"], _id); 		
 	}
}

/*
 * Error from the connection
 */
function serverError() {
	error("Échec de l'opération : le serveur ne répond pas");
}

/*
 * Display 
 */
function successMessage() {
	// display message
	$('#message').html('Modification effectu&eacute;e !')
}
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

	/****************
	 * MAIN DISPLAY *
	****************/
	
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
		 * 			{id} (maybe be missing, will be overwritten anyway)
		 *		}
		 *	]
		 */ 
	}
	
	$("#main").append('<input type="button" onClick="addSection()" value="Ajouter une section" />');
}

/*
 * "Intern" function, to create an array of items
 */
function addArray(items, title, id) {
	var _html = '<div id="section_'+id+'"><h3 id="h3_'+id+'"">'+title+'</h3>'; // first, the title
	
	// create array
	_html += '<table width="100%" cellspacing="0"><thead><tr><th class="row_title">Titre</th><th class="row_login">Login</th>';
	_html += '<th class="row_password">MdP</th><th class="row_comment">Commentaire</th><th class="row_img"></th><th class="row_img"></th></tr></thead><tbody id="array_'+id+'">';
	// we add 2 <th class="row_img"></th> because of the modify & delete buttons
	
	for (row in items) {
		_html += addRow(id, items[row]);
	}
	
	var _form = '<form name="add_'+id+'"><input type="text" name="title" size="30" /><input type="text" name="login" size="30" />';
	_form += '<input type="text" name="password" size="30" /><input type="text" name="comment" size="60" />';
	_form += '<input type="button" onClick="addItem('+id+')" value="+" /></form>';
	
	// end the array, with buttons for the section
	_html += '</tbody></table>'+_form+'<form><input type="button" onClick="renameSection('+id+')" value="Renomer" />';
	_html += '<input type="button" onClick="removeSection('+id+')" value="Supprimer cette section" /></form><hr /></div>';
	
	$("#donnees").append(_html); // add it to DOM - in one time to prevent JQuery from correcting incomplete html tags
}
// add an element in the array
function addRow(section, item) {
	var _html = '<tr class="row" id="row_'+item["id"]+'">';
	
	for (column in item) {
		if (column != "id") {
			_html += '<td class="row_'+column+'">'+item[column]+"</td>";
		}
	}
	
	// we add the buttons and close the line
	_html += '<td class="row_img"><img class="mod_img" src="img/update.png" at="Modifier" onClick="editItem('+item["id"]+')" /></td>';
	_html += '<td class="row_img"><img class="del_img" src="img/delete.png" at="Supprimer" onClick="removeItem('+item["id"]+')" /></td></tr>';
	
	return _html;
}

	/********
	 * ITEM *
	********/
	
/*
 * Add an element
 * id is the id of the corresponding section
 */
function addItem(id) {
	if (document.forms['add_'+id].elements['title'].value == '' 
	|| document.forms['add_'+id].elements['login'].value == '' 
	|| document.forms['add_'+id].elements['password'].value == '') {
		error("Les champs Titre, Login et MdP sont obligatoires");
		return;
	}
	
	var _index = -1;
	
	// we have to search the right object, and feed it
	// I didn't find a better way than a loop, sorry
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
	}
	
	var _obj = {
					title: document.forms['add_'+id].elements['title'].value,
					user: document.forms['add_'+id].elements['login'].value,
					password: document.forms['add_'+id].elements['password'].value,
					comment: document.forms['add_'+id].elements['comment'].value,
					id: myKey.id++
				};
	myKey.data[_index]["content"].push(_obj);
					
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
	$("#array_"+id).append(addRow(_index, _obj));
	
	// empty form
	document.forms['add_'+id].elements['title'].value = '';
	document.forms['add_'+id].elements['login'].value = '';
	document.forms['add_'+id].elements['password'].value = '';
	document.forms['add_'+id].elements['comment'].value = '';
}

/*
 * Make an item editable
 */
function editItem(id) {
	// we search for the id
	var _index = -1;
	var _section = -1;
	for (section in myKey.data) {
		for (item in myKey.data[section]["content"]) {
			if (myKey.data[section]["content"][item]["id"] == id) {
				_section = section;
				_index = item;
				break;
			}
		}
	}
	
	var _form = '<form name="edit_'+id+'" id="row_'+id+'" class="row_form"><input type="text" name="title" size="30" value="'+myKey.data[_section]["content"][_index]["title"]+'" />';
	_form += '<input type="text" name="login" size="30" value="'+myKey.data[_section]["content"][_index]["user"]+'" />';
	_form += '<input type="text" name="password" size="30" value="'+myKey.data[_section]["content"][_index]["password"]+'" />';
	_form += '<input type="text" name="comment" size="60"value="'+myKey.data[_section]["content"][_index]["comment"]+'" />';
	_form += '<input type="button" onClick="modifyItem('+_section+','+id+')" value="OK" /></form>';
	
	$("#row_"+id).replaceWith(_form); // we remplace the line by the form
}
// will save change
// we have to proceed with id, and not index, because user may delete previous lines while editing
function modifyItem(section, id) {
	if (document.forms['edit_'+id].elements['title'].value == '' 
	|| document.forms['edit_'+id].elements['login'].value == '' 
	|| document.forms['edit_'+id].elements['password'].value == '') {
		error("Les champs Titre, Login et MdP sont obligatoires");
		return;
	}
	
	var _index = -1;
	
	// we have to search the right object, and feed it
	// I didn't find a better way than a loop, sorry
	for (item in myKey.data[section]["content"]) {
		if (myKey.data[section]["content"][item]["id"] == id) {
			_index = item;
			break;
		}
	}
	
	if (_index == -1) {
		// we did not found the right line
		error("Impossible de modifier l'élément");
		return;
	}
	
	myKey.data[section]["content"][_index] = {
					title: document.forms['edit_'+id].elements['title'].value,
					user: document.forms['edit_'+id].elements['login'].value,
					password: document.forms['edit_'+id].elements['password'].value,
					comment: document.forms['edit_'+id].elements['comment'].value,
					id: id // do not change
				};
					
	// we serialize and then encrypt data (the whole section)
	var _content = JSON.stringify(myKey.data[section]["content"]);
	var _data = encrypt(_content, myKey.password);
	
	// ask the server to do the same
	// we resend our key each time, to validate it's not anyone doing bullshit
	$.ajax({
		type: 'POST',
		url: "http://localhost:8888/Keypass/request/change_data",
		data: {content: _data, id: myKey.data[section]["id"], user: myKey.user, key: myKey.key},
		success: successMessage,
		error: serverError
	});
	
	// reset the line
	$("#row_"+id).replaceWith(addRow(_index, myKey.data[section]["content"][_index]));
}

/*
 * Delete an element of the array
 */
function removeItem(id) {
	// we search for the id
	var _index = -1;
	var _section = -1;
	for (section in myKey.data) {
		for (item in myKey.data[section]["content"]) {
			if (myKey.data[section]["content"][item]["id"] == id) {
				_section = section;
				_index = item;
				break;
			}
		}
	}
		
	var _result = window.confirm("Êtes-vous sur de vouloir supprimer '"+myKey.data[_section]["content"][_index]["title"]+"' ? Cette opération est irréversible.");
	
	if (_result === true && _index != -1 && _section != -1) {
		// we delete the line in the array
		myKey.data[_section]["content"].splice(_index,1);
							
		// we serialize and then encrypt data (the whole section)
		var _content = JSON.stringify(myKey.data[_section]["content"]);
		var _data = encrypt(_content, myKey.password);
	
		$.ajax({
			type: 'POST',
			url: "http://localhost:8888/Keypass/request/change_data",
			data: {content: _data, id: myKey.data[_section]["id"], user: myKey.user, key: myKey.key},
			success: successMessage,
			error: serverError
		});	
		
		// delete DOM
		$("#row_"+id).remove();
	}
}

	/***********
	 * SECTION *
	***********/
	
/*
 * Add a section
 */
function addSection() {
	var _name = window.prompt('Veuillez rentrer le nom de la nouvelle section. Attention, le titre n\'est pas crypté.', '');
	
	if (_name == null)  {
		// the user cancelled the dialog, we exit the function
		return;
	}
	
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
// called when preceding request successes
function addSectionId(data) {
	//check if data is numeric
 	if (!isNaN(parseFloat(data)) && isFinite(data)) {
 		_id = data;

		myKey.data[_id] = {content: [], title: name, id: _id};
		
		addArray(myKey.data[_id]["content"], myKey.data[_id]["title"], _id); 		
 	}
}

/*
 * To rename a section
 */
function renameSection(id) {
	var _name = window.prompt('Veuillez rentrer le nouveau nom de la section. Attention, le titre n\'est pas crypté.', '');
	
	if (_name == null)  {
		// the user cancelled the dialog, we exit the function
		return;
	}
	
	if (_name != '') {
		// modify DOM
		$("#h3_"+id).html(_name);
		
		// we don't know the id of the item, there maybe gaps in the database, we'll ask the server first
		$.ajax({
			type: 'POST',
			url: "http://localhost:8888/Keypass/request/modify_section",
			data: {title: stringToBase64(_name), id: id, user: myKey.user, key: myKey.key},
			success: successMessage,
			error: serverError
		});		
	} else {
		error("Veuillez rentrer un titre !");
	}
}

/*
 * Remove a section
 */
function removeSection(id) {
	var _result = window.confirm("Êtes-vous sur de vouloir supprimer cette section ? Son contenu sera définitivement effacé.");
	
	if (_result === true) {
		$.ajax({
			type: 'POST',
			url: "http://localhost:8888/Keypass/request/remove_section",
			data: {id: id, user: myKey.user, key: myKey.key},
			success: successMessage,
			error: serverError
		});		
		
		// delete DOM
		$("#section_"+id).remove();
	}
}

	/********
	 * MISC *
	********/
	
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
	$('#message').html('<div id="success">Modification effectu&eacute;e !</div>');
	
	$("#success").fadeOut(10000, 'linear'); // message pendant 10 secondes
}
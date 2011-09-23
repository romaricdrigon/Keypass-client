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
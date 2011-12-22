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
	for (var _item in myKey.data) {
		if (myKey.data[_item]["id"] == id) {
			_index = _item;
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
	var _data = myKey.encrypt(_content);
	
	// ask the server to do the same
	// we resend our key each time, to validate it's not anyone doing bullshit
	$.ajax({
		type: 'POST',
		url: serverUrl+"request/change_data",
		data: {content: _data, id: id, user: myKey.user, key: myKey.key},
		success: success,
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
	for (_sec in myKey.data) {
		for (_item in myKey.data[_sec]["content"]) {
			if (myKey.data[_sec]["content"][_item]["id"] == id) {
				_section = _sec;
				_index = _item;
				break;
			}
		}
	}
	
	var _form = '<tr id="row_'+id+'" class="row_form"><form name="edit_'+id+'">';
	_form += '<td class="form_title"><input type="text" name="title" size="30" value="'+htmlentities(myKey.data[_section]["content"][_index]["title"])+'" /></td>';
	_form += '<td class="form_login"><input type="text" name="login" size="30" value="'+htmlentities(myKey.data[_section]["content"][_index]["user"])+'" /></td>';
	_form += '<td class="form_password"><input type="text" name="password" size="30" value="'+htmlentities(myKey.data[_section]["content"][_index]["password"])+'" onKeyPress="submitEnter(\'modifyItem('+_section+','+id+')\')" /></td>';
	_form += '<td class="form_comment"><input type="text" name="comment" size="60"value="'+htmlentities(myKey.data[_section]["content"][_index]["comment"])+'" onKeyPress="submitEnter(\'modifyItem('+_section+','+id+')\')" /></td>';
	_form += '<td class="form_button"><input type="button" onClick="modifyItem('+_section+','+id+')" value="OK" /></td></form></tr>';
	
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
	for (var _item in myKey.data[section]["content"]) {
		if (myKey.data[section]["content"][_item]["id"] == id) {
			_index = _item;
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
	var _data = myKey.encrypt(_content);
	
	// ask the server to do the same
	// we resend our key each time, to validate it's not anyone doing bullshit
	$.ajax({
		type: 'POST',
		url: serverUrl+"request/change_data",
		data: {content: _data, id: myKey.data[section]["id"], user: myKey.user, key: myKey.key},
		success: success,
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
	for (var _sec in myKey.data) {
		for (var _item in myKey.data[_sec]["content"]) {
			if (myKey.data[_sec]["content"][_item]["id"] == id) {
				_section = _sec;
				_index = _item;
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
		var _data = myKey.encrypt(_content);
	
		$.ajax({
			type: 'POST',
			url: serverUrl+"request/change_data",
			data: {content: _data, id: myKey.data[_section]["id"], user: myKey.user, key: myKey.key},
			success: success,
			error: serverError
		});	
		
		// delete DOM
		$("#row_"+id).remove();
	}
}
/*
 * Create an array of items
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
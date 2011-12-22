/*
 * Create an array of items
 */
function addArray(items, title, id) {
	var _html = '<div id="section_'+id+'"><h3 id="h3_'+id+'"">'+htmlentities(title)+'</h3>'; // first, the title (espace html char)
	
	// create array
	_html += '<table width="100%" cellspacing="0"><thead><tr><th class="row_title">Titre</th><th class="row_login">Login</th>';
	_html += '<th class="row_password">MdP</th><th class="row_comment">Commentaire</th><th class="row_img"></th>';
	_html += '<th class="row_img"></th></tr></thead><tbody id="array_'+id+'">';
	// we add 2 <th class="row_img"></th> because of the modify & delete buttons
	
	for (var _row in items) {
		_html += addRow(id, items[_row]);
	}
	
	var _form = '<tr><form name="add_'+id+'"><td class="form_title"><input type="text" name="title" /></td>';
	_form += '<td class="form_login"><input type="text" name="login" /></td>';
	_form += '<td class="form_password"><input type="text" name="password" onKeyPress="submitEnter(\'addItem('+id+')\')" /></td>';
	_form += '<td class="form_comment"><input type="text" name="comment" onKeyPress="submitEnter(\'addItem('+id+')\')" /></td>';
	_form += '<td class="form_button"><input type="button" onClick="addItem('+id+')" value="+" /></td></form></tr>';
	
	// end the array, with buttons for the section
	_html += _form+'</tbody></table><form><input type="button" onClick="renameSection('+id+')" value="Renommer" />';
	_html += '<input type="button" onClick="removeSection('+id+')" value="Supprimer cette section" /></form><hr /></div>';
	
	$("#donnees").append(_html); // add it to DOM - in one time to prevent JQuery from correcting incomplete html tags
}
// add an element in the array
function addRow(section, item) {
	var _html = '<tr class="row" id="row_'+item["id"]+'">';
	
	for (var _column in item) {
		if (_column != "id") {
			var _safe = htmlentities(item[_column]); // escape, prevent injecting Javascript code
			var _str = _safe.replace(/((ftp|https?):\/\/\S*)/g, '<a href="$1" target="_blank">$1</a>'); // we detect link, make them clickables
			
			_html += '<td class="row_'+_column+'">'+_str+"</td>";
		}
	}
	
	// we add the buttons and close the line
	_html += '<td class="row_img"><img class="mod_img" src="img/update.png" at="Modifier" onClick="editItem('+item["id"]+')" /></td>';
	_html += '<td class="row_img"><img class="del_img" src="img/delete.png" at="Supprimer" onClick="removeItem('+item["id"]+')" /></td></tr>';
	
	return _html;
}

/*
 * Change credentials :
 * you can change both user and password
 */
function changeCredentials() {
	// don't be too confident : check if it's the good user
	var _oldPass = window.prompt('Veuillez rentrer votre ancien mot de passe', '');
	
	if (_oldPass == null)  {
		return;
	}
	
	if (myKey.validatePassword(_oldPass) !== true) {
		window.alert('Erreur : mot de passe invalide');
		logout(); // out, bitch
		return;
	}
	
	var _user = window.prompt("Veuillez rentrer le nouveau nom d'utilisateur", '');
	
	if (_user == null)  {
		return;
	}
	
	if (_user != '') {
		// now ask for new password
		var _pass = window.prompt('Veuillez rentrer le nouveau mot de passe', '');
		
		if (_pass == null)  {
			return;
		}
		
		if (_pass != '') {
			// confirm password
			var _pass2 = window.prompt('Veuillez confirmer le nouveau mot de passe', '');
			
			if (_pass2 != _pass) {
				error("Les mots de passe ne correspondent pas");
				return;
			}
			
			// backup credentials in globals, for next function
			newUser = _user;
			newPass = doPbkdf2(_pass, myKey.salt);
			newKey = hmac(newPass, myKey.token);
			
			// we have to re-encrypt everything (all content & all sections)
			var _content = {};
			for (var _section in myKey.data) {
				_content[_section] = {id: myKey.data[_section]["id"], title: myEncrypt(myKey.data[_section]["title"], newPass), content: myEncrypt(JSON.stringify(myKey.data[_section]["content"]), newPass)};
			}
			
			// send it back
			$.ajax({
				type: 'POST',
				url: serverUrl+"request/credentials_changed",
				data: {user: myKey.user, key: myKey.key, newUser: newUser, newKey: newKey, newContent: JSON.stringify(_content)},
				success : changeCredentialsMemory,
				error: serverError
			});	
		} else {
			error("Veuillez rentrer un mot de passe !");
		}
	} else {
		error("Veuillez rentrer un nom d\'utilisateur !");
	}	
}
// we change credentials in memory only is the server was able to change its database
function changeCredentialsMemory(data) {
	if (data == 'success') {
		// now we change data in memory
		myKey.setPassword(newPass);
		myKey.user = newUser;
		myKey.key = newKey;
		
		success();
	} else {
		error("Le serveur a rencontré une erreur, aucune modification n'a été effectuée");		
	}
	
	// delete globals
	delete newPass;
	delete newUser;
	delete newKey;
}

/*
 * Error from the connection
 * OR, the server may have responded with a "die" function, wo we display the message
 */
function serverError(data) {
	if (data.responseText) {
		switch (data.responseText) {
			case 'Invalid credentials':
				document.forms['log'].elements['password'].value = ''; // empty password form
				error("Nom d'utilisateur et/ou mot de passe invalide");
				break;
			default:
				error("Erreur du serveur : " + data.responseText);
				break;
		}
	} else {
		error("Échec de l'opération : le serveur ne répond pas");
	}
}

/*
 * Display 
 */
function success(message) {
	// if we provide a message, display it - else a generic one
	if (message) {
		$('#message').html('<div id="success">'+message+'</div>');
	} else {
		$('#message').html('<div id="success">Modification effectu&eacute;e !</div>');
	}
	
	$("#success").fadeOut(10000, 'linear'); // message pendant 10 secondes
}

/*
 * Submit form (click on the first button) when user press Enter
 */
function submitEnter(callback) {
	var _key;
     
	if (window.event) {
		_key = window.event.keyCode; //IE
	} else {
		_key = e.which; // firefox
	}
     
	if (_key == 13 || _key == 3) { // 13 is return, 3 enter in mac keypad
		eval(callback); // just run the provided callback
		return false; // the return false prevent IE from emetting a warning beep
	}
}

/*
 * Set up the timer
 */
function setTimer() {
	idleTime = 0;
	
	// increment the idle time counter each minute - watch out milliseconds!
	var idleInterval = setInterval("timerIncrement()", 60000);
	
	// zero the idle timer on mouse movement.
	$(document).mousemove(function (e) {
	    idleTime = 0;
	});
	$(document).keypress(function (e) {
	    idleTime = 0;
	});
}
	    
/*
 * Disconnect user after 5 mn of inactivity
 */
function timerIncrement() {
    idleTime++;
    
    if (idleTime >= 2) { // 2 minutes
       logout();
    }
}
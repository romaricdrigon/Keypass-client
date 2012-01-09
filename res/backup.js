/*
 * Ask to serevr to backup the database
 * It creates a dump file on the server, in /backup
 * named after server date and time
 */
function backupDatabase() {
	if (myKey === null) {
		error('Vous devez être connecté pour cette action');
	}
	
	// just one request
	$.ajax({
		type: 'POST',
		url: serverUrl+"request/backup",
		data: {user: myKey.user, key: myKey.key, doDownload: false},
		success: function(data) {success('Sauvegarde effectuée sur le serveur, dans le dossier /backup');},
		error: serverError
	});	
}
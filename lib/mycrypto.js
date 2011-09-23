/*
 * ****************
 * Crypto functions
 * ****************
 */

/*
 * Pbkdf2 to strenghten password
 */ 
function doPbkdf2(password, salt) {
	return Crypto.PBKDF2(password, salt, 32);
}

/*
 * HMAC :
 * encrypt + hash
 */
function hmac(password, message) {
	var _hmac = Crypto.HMAC(Crypto.SHA1, message, password, {asBytes: true});
	
	return Crypto.util.bytesToBase64(_hmac); // go to base64
}

/*
 * Encrypt, it's self-explanatory, no?
 */ 
function encrypt(plain, password) {
	return Crypto.AES.encrypt(plain, password);
}

/*
 * Decrypt, err...
 */ 
function decrypt(cipher, password) {
	return Crypto.AES.decrypt(cipher, password);
}

/*
 * Antalogist functions
 */
function base64ToString(base) {
	var _bytes = Crypto.util.base64ToBytes(base);
	return Crypto.charenc.Binary.bytesToString(_bytes);	// Bytes, not UTF8
}
function stringToBase64(string) {
	var _bytes = Crypto.charenc.Binary.stringToBytes(string);
	return Crypto.util.bytesToBase64(_bytes);	
}

/*
 * *************
 * Misceallanous
 * *************
 */
/* 
 * From Stanford Crypto Library : 
 * "there's probaby a better way to tell the user something, but oh well"
 */
function error(x) {
	window.alert(x);
	console.error(x); // added, maybe useful for debug purpose
}

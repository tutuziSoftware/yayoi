/**
 * セッションを取得します。
 * 
 * @param  socket	socket.ioがconnection時に出力する第一引数
 * @param function(error, session) callback
 */
module.exports = function(socket, store, callback){
	//クライアント側にクッキーが存在しない場合はエラー
	if(socket.request.headers.cookie === void 0){
		callback("cookie not found", null);
		return;
	}
	
	var cookie = require('cookie').parse(socket.request.headers.cookie);
	
	if(typeof cookie['connect.sid'] != "string"){
		callback(true, null);
	}

	store.get(cookie['connect.sid'].match(/s:([^.]*)\./)[1], function(error, session){
		callback(error, session);
		store.set(cookie['connect.sid'].match(/s:([^.]*)\./)[1], session);
	});
}

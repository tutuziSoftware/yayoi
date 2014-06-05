module.exports = (function(){
	var _db = require("./db.js");
	var db = _db("user", {
		"userName":String,
		"password":String,
		"status":{"type":String, "default":""}
	});
	
	var _ = {
		toHash:function(password){
			var hash = require('crypto').createHash('sha512');
			hash.update(password);
			return hash.digest('hex');
		}
	};
	
	return {
		db:db,
		/**
		 * ユーザのIDとパスワードをチェックします。
		 *
		 * @param function(boolean) callback	ユーザIDとパスワードが正しい場合、trueを返します。
		 */
		findUser:function(userName, password, callback){
			var query = {
				"userName":userName+"",
				"password":_.toHash(password)
			};
			
			db.find(query, function(error, data){;
				callback(data);
			});
		},
		createUser:function(userName, password){
			db.find({
				"userName":userName+""
			}, function(error, resData){
				if(resData.length == 0){
					new db({
						"userName":userName+"",
						"password":_.toHash(password)
					}).save();
					
					console.log("create user:" + userName);
				}
			});
		}
	};
})();

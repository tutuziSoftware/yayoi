module.exports = function(session){
	this.session = session;
};

module.exports.prototype = {
	/**
	 * プレイヤーをスタンダード対戦一覧に追加します。
	 */
	startEntryStandard:function(callback){
		var db = require("./userDB.js").db;
		
		db.update({
			"_id":this.session.userId
		},{
			"status":"wait_standard"
		},{multi:false},function(err){
			callback(err);
		});
	},
	/**
	 * プレイヤーをスタンダード対戦一覧から削除します。
	 */
	endEntryStandard:function(){
		var db = require("./userDB.js").db;
		
		db.update({
			"_id":this.session.userId
		},{
			"status":""
		},{multi:false},function(err){
		});
	},
	/**
	 * 自分を除いたスタンダード対戦待ちのプレイヤーを返します。
	 * このメソッドはパスワードなどの表に出てはいけない情報を消した状態の値を返します。
	 */
	findFloorUser:function(callback){
		var db = require("./userDB.js").db;
		
		db.find({
			'status':'wait_standard',
			'_id':{$ne:this.session.userId}
		},'_id status userName', callback);
	}
};

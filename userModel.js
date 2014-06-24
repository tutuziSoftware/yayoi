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
	},
	/**
	 * スタンダード対戦を開始します。
	 */
	startStandardBattle:function(enemyId, callback){
		var ObjectId = require('mongoose').Types.ObjectId;
		
		var db = require('./userDB.js').db;
		var that = this;
		
		db.findOne({
			'status':'wait_standard',
			'_id':new ObjectId(enemyId)
		}, function(error, enemy){
			if(enemy){
				[that.session.userId, enemy._id].forEach(function(_id){
					db.update({
						'_id':_id
					},{
						'status':'battle'
					},{multi:true},function(err){
						console.log(err);
					});
				});
			}else{
				if(callback) callback('error!');
			}
		});
	}
};

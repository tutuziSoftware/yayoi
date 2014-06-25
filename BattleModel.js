var battleDB = require('./db')('battle', {
	'userId':String,
	'enemyId':String,
	'life':{type:Number, default:20},
	'mana':{type:Number, default:0},
	'creatures':{type:Array, default:[]},
	'enchantFields':{type:Array, default:[]},
	'upkeeps':{type:Array, default:[]},
	'deck':{type:Array, default:[]},
	'hands':{type:Array, default:[]}
});

/**
 * @param string id クローンフィールドの一意IDです。
 */
exports.BattleModel = function(id){
	this.id = id;
};

exports.BattleModel.prototype.start = function(enemyId, callback){
	var that = this;	
	
	battleDB.find({
		'enemyId':enemyId
	}, function(error, data){
		if(data.length){
			if(callback) callback('たぶん不正な操作');
		}else{
			battleDB.remove({
				'userId':that.id
			});
			
			battleDB.remove({
				'userId':enemyId
			});
			
			//自分のクローンフィールド
			new battleDB({
				'userId':that.id,
				'enemyId':enemyId
			}).save(callback);
	
			//相手のクローンフィールド
			new battleDB({
				'userId':enemyId,
				'enemyId':that.id
			}).save(callback);
		}
	});
}

/**
 * @param callback(error, cloneField) コンストラクタのIDを元に、クローンフィールドに関する情報を出力します。
 */
exports.BattleModel.prototype.update = function(callback){
	var that = this;
	
	battleDB.findOne({
		'_id':this.id
	}, function(error, cloneField){
		battleDb.findOne({
			'_id':cloneField.enemyId
		}, function(error, enemyField){
			cloneFiled.enemyField = enemyField;
			
			that.cloneField = cloneField;
			
			callback(error);
		});
	});
};

exports.BattleModel.prototype.save = function(){
	battleDb.save(this.cloneField);
};

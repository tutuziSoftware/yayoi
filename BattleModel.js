var battleDB = require('./db')('battle', {
	'userId':String,
	'enemyId':String,
	'urlToken':String,
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
	
	battleDB.remove({
		'userId':that.id
	});
	
	battleDB.remove({
		'userId':enemyId
	});
	
	var urlToken = require('node-uuid').v4();
	console.log('userId:'+that.id);
	console.log('userId:'+enemyId);
	console.log('urlToken:'+urlToken);
	
	//自分のクローンフィールド
	new battleDB({
		'userId':that.id,
		'enemyId':enemyId,
		'urlToken':urlToken
	}).save(function(){});

	//相手のクローンフィールド
	new battleDB({
		'userId':enemyId,
		'enemyId':that.id,
		'urlToken':urlToken
	}).save(function(){});
}

/**
 * @param callback(error, cloneField) コンストラクタのIDを元に、クローンフィールドに関する情報を出力します。
 */
exports.BattleModel.prototype.update = function(callback){
	var that = this;
	
	battleDB.findOne({
		'userId':this.id
	}, function(error, cloneField){
		battleDB.findOne({
			'userId':cloneField.enemyId
		}, function(error, enemyField){
			cloneField.enemyField = enemyField;
			
			that.cloneField = cloneField;
			
			callback(error, cloneField);
		});
	});
};

exports.BattleModel.prototype.save = function(){
	battleDb.save(this.cloneField);
};

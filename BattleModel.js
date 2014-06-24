var battleDB = require('./db')('battle', {
	'enemyId':String,
	'life':{type:Number, default:20},
	'mana':{type:Number, default:0},
	'creatures':[],
	'enchantFields':[],
	'upkeeps':[],
	'deck':[],
	'hands':[]
});

/**
 * @param string id クローンフィールドの一意IDです。
 */
exports.BattleModel = function(id){
	this.id = id;
};

exports.start = function(callback){
	var cloneField = new battleDB({});
	cloneField.save(callback);
}

/**
 * @param callback(error, cloneField) コンストラクタのIDを元に、クローンフィールドに関する情報を出力します。
 */
exports.update = function(callback){
	var that = this;
	
	battleDB.findOne({
		'id':this.id
	}, function(error, cloneField){
		battleDb.findOne({
			'id':cloneField.enemyId
		}, function(error, enemyField){
			cloneFiled.enemyField = enemyField;
			
			that.cloneField = cloneField;
			
			callback(error);
		});
	});
};

exports.save = function(){
	battleDb.save(this.cloneField);
};

var battleDB = require('./db')('battle', {
	'id':String,
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

/**
 * @param callback(error, cloneField) コンストラクタのIDを元に、クローンフィールドに関する情報を出力します。
 */
exports.find = function(callback){
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

exports.save = function(){};

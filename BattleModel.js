const TURN_MY = 'my turn';
const TURN_ENEMY = 'enemy turn';

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
	'hands':{type:Array, default:[]},
	//どちらのターンかを格納する
	'turn':{type:String, default:''}
});

/**
 * @param string id クローンフィールドの一意IDです。
 */
exports.BattleModel = function(id){
	if(typeof id == 'object') throw 'コンストラクタの第一引数にobjectを指定出来ません。';
	
	this.id = id;
};

exports.BattleModel.prototype.start = function(enemyId, callback){
	var that = this;	
	var playOrDraw = Math.random() >= 0.5;
	
	battleDB.remove({
		'userId':that.id
	}, function(){
		battleDB.remove({
			'userId':enemyId
		}, function(){
			var urlToken = require('node-uuid').v4();
			console.log('userId:'+that.id);
			console.log('userId:'+enemyId);
			console.log('urlToken:'+urlToken);
	
			//自分のクローンフィールド
			new battleDB({
				'userId':that.id,
				'enemyId':enemyId,
				'urlToken':urlToken,
				'turn':playOrDraw ? TURN_MY : TURN_ENEMY
			}).save(function(){
				//相手のクローンフィールド
				new battleDB({
					'userId':enemyId,
					'enemyId':that.id,
					'urlToken':urlToken,
					'turn':(!playOrDraw) ? TURN_MY : TURN_ENEMY
				}).save(function(){
					callback();
				});
			});
		});
	});
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

exports.BattleModel.prototype.save = function(callback){
	console.log('BattleModel.prototype.save');
	var self = this;
	
	var copy = [
		'hands',
		'deck',
		'upkeeps',
		'enchantFields',
		'creatures',
		'mana',
		'life'
	].reduce(function(copy, key){
		copy[key] = self.cloneField[key];
		return copy;
	}, {});
	
	console.log(copy);
	
	battleDB.update(
		{'_id':this.cloneField._id},
		{$set:copy},
		{ upsert: false },
		function(error){
			callback(error);
		}
	);
};

/**
 * 対戦相手に見せてはいけない情報を隠した状態のクローンフィールドを返します。
 */
exports.BattleModel.prototype.toEnemy = function(){
	var enemyCloneField = {};
	var cloneField = this.cloneField;
	
	return ['life','mana','creatures','enchantFields'].reduce(function(enemyCloneField, key){
		enemyCloneField[key] = cloneField[key];
		return enemyCloneField;
	}, {});
};

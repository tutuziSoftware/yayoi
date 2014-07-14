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
	'turn':{type:String, default:''},
	//対戦相手として選ばれた場合、trueになる。主にsocket.ioのイベントリスナー二重登録を防ぐ為に使う
	'isElected':{type:Boolean, default:false}
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
					'turn':(!playOrDraw) ? TURN_MY : TURN_ENEMY,
					'isElected': true
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

/**
 * this.cloneFieldをDBに保存します。
 *
 * @param callback データ保存後に呼び出されます。
 * @param isRun 	相手ターン時はDB更新が行えませんが、例外的に更新を認める場合、ここをtrueにします。
 */
exports.BattleModel.prototype.save = function(callback, isRun){
	//相手ターン時は反応しない
	if(this.cloneField.turn === TURN_ENEMY && isRun === void 0) {
		callback('error! 相手ターン時なのでDB書き込み権限はありません。必要に応じてisRunをtrueにしてください', null);
		return;
	}
	
	var self = this;
	
	var copy = [
		'hands',
		'deck',
		'upkeeps',
		'enchantFields',
		'creatures',
		'mana',
		'life',
		'turn'
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

/**
 * 自分のターンと相手のターンを入れ替えます。
 */
exports.BattleModel.prototype.nextTurn = function(){
	console.log('nextTurn');
	var that = this;
	
	this.update(function(error, cloneField){
		console.log('nextTurn.update');
		console.log(cloneField.turn);
		if(cloneField.turn === TURN_MY){
			cloneField.turn = TURN_ENEMY;
		}else{
			cloneField.turn = TURN_MY;
		}
		console.log(cloneField.turn);
		
		that.save(function(){
			battleDB.update(
				{'_id':cloneField.enemyField._id},
				{$set:{
					turn:cloneField.enemyField.turn === TURN_MY ? TURN_ENEMY : TURN_MY
				}},
				{ upsert: false },
				function(error){
					console.log('nextTurn.update.save : ' + error);
				}
			);
		}, true);
	});
};

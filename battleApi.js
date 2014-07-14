var api = function(session, store){
	var battleModel = new (require('./BattleModel.js')).BattleModel(session.userId);
	
	return function(socket){
		console.log('api');

		socket.on("shuffle", function(data){
			console.log('shuffle');
			console.log('shuffle - UA = ' + data);

			battleModel.update(function(error, cloneField){
				console.log('shuffle - update');
				for(var i = 0 ; i != 2 ; i++){
					cloneField.hands.push({
						"id":i,
						"name":"灰色熊",
						"cardType":"creature",
						"creatureType":"熊",
						"flavorText":"標準的な自然というものを教えてくれる、かわいい毛玉さ",
						"manaCost":1,
						"power":2,
						"toughness":2
					});
				}

				battleModel.save(function(){
					console.log('shuffle - save');
					socket.emit("first draw", cloneField);
				}, true);
			});
		});

		socket.on("hand to mana", function(cardId){
			battleModel.update(function(error, cloneField){
				cloneField.hands.every(function(hand, i){
					if(cardId == hand.id){
						cloneField.mana++;
						cloneField.hands.splice(i, 1);
						return false;
					}
				});
				
				battleModel.save(function(){
					socket.broadcast.emit('enemy', battleModel.toEnemy());
				});
			});
		});
		
		socket.on("play", function(cardId){
			var engine = require("./public/javascripts/battle_engine.js");
			
			battleModel.update(function(error, cloneField){
				cloneField.hands.every(function(hand, i){
					if(cardId == hand.id){
						cloneField.card = hand;
						
						engine.doEnterBattlefield.call(cloneField, {
							field: cloneField
						});
						
						battleModel.save(function(){
							socket.broadcast.emit('enemy', battleModel.toEnemy());
						});
						return false;
					}
					
					return true;
				});
			});
		});
		
		socket.on("activated ability", function(){
			console.log("activated ability");
		});
		
		const ATTACK_STEP_API = "attack step";
		socket.on(ATTACK_STEP_API, function(attackerIds){
			console.log(ATTACK_STEP_API);
			
			battleModel.update(function(error, cloneField){
				var escapeAttackerIds = [];
				
				attackerIds.forEach(function(attackerId){
					cloneField.creatures.every(function(creature){
						if(creature.id == attackerId){
							creature.tap = true;
							creature.isAttack = true;
							escapeAttackerIds.push(attackerId);
							return false;
						}
					});
				});
				
				battleModel.nextTurn();
				socket.broadcast.emit("block step", escapeAttackerIds);
			});
		});
		
		socket.on("block step", function(blockerIds){
			console.log("block step");
		});
		
		socket.on("clone field?", function(){
			getSession(socket, store, function(error, session){
				var cloneField = "cloneField" in session ? session.cloneField : null;
				socket.emit("clone field!", cloneField);
			});
		});
	};
};

exports.api = {};

/**
 * 対戦前に返るAPIです。
 * このAPIは「socket.ioのURLを返す」「socket.ioのイベントリスナーを設置する」を行います。
 */
exports.api.id = function(io, session, cookieStore){
	return function(req, res){
		var Model = require('./BattleModel.js').BattleModel;
		var model = new Model(req.session.userId);

		console.log('exports.api.id');

		model.update(function(error, cloneField){
			console.log('exports.api.id - model.update');
			var url = '/battle/' + cloneField.urlToken;

			var tester = io.of(url);
			//対戦者に選ばれた方がイベントリスナーをもう一度設置してしまう為、二度イベントが発火するようになってしまう
			if(cloneField.isElected == false) tester.on("connection", api(req.session, cookieStore));
			
			var result = {
				result:true,
				value:url
			};
		
			res.send(result);
		});
	};
};

exports.tester = {
	api:{}
};
exports.tester.api.id = function(io, session, cookieStore){
	var api = exports.api.id(io, session, cookieStore);
	
	return function(req, res){
		var result = api(req, res);

		result.tester.on("connection", function(){
			if(result.result) {
				//socket.ioをサーバ側で開く
				var socket = require('./node_modules/socket.io/node_modules/socket.io-client')('http://localhost:3000'+result.value, {
					'force new connection':true
				});
				socket.on("connect", function(){
					robot(socket);
				});
			}
		});
	};
};

function robot(socket){
	socket.emit("shuffle");
	
	socket.on("block step", function(attackerIds){
		getSession(socket, null, function(error, session){
			var attackers = session.cloneField.enemy.creatures.filter(function(creature){
				for(var i = 0 ; i != attackerIds.length ; i++){
					if(attackerIds.id == creature.id){
						return creature;
					}
				}
			});
		});
	});
}

/**
 * セッションを取得します。
 * 
 * @param  socket	socket.ioがconnection時に出力する第一引数
 * @param function(error, session) callback
 */
function getSession(socket, store, callback){
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

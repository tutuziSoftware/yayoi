var api = function(session, store){
	var battleModel = new (require('./BattleModel.js')).BattleModel(session.userId);
	
	return function(socket){
		socket.on("shuffle", function(data){
			getSession(socket, store, function(error, session){
				if(session === void 0){
					console.log("shuffle - error session is undefined");
					return;
				}
				
				battleModel.update(function(error, cloneField){
					for(var i = 0 ; i != 5 ; i++){
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
					
					socket.emit("first draw", cloneField);
				});
			});
		});
		
		socket.on("hand to mana", function(cardId){
			battleModel.update(function(error, cloneField){
				//console.log("hand to mana - getSession");
				
				cloneField.hands.every(function(hand, i){
					if(cardId == hand.id){
						console.log('add mana');
						cloneField.mana++;
						cloneField.hands.splice(i, 1);
						return false;
					}
				});
				
				socket.broadcast.emit('enemy hand to mana', battleModel.toEnemy());
			});
		});
		
		socket.on("play", function(cardId){
			console.log("play");
			var engine = require("./public/javascripts/battle_engine.js");
			
			battleModel.update(function(error, cloneField){
				cloneField.hands.every(function(hand, i){
					if(cardId == hand.id){
						console.log("play - hand");
						console.log(hand);
						
						cloneField.card = hand;
						
						engine.doEnterBattlefield.call(cloneField, {
							field: cloneField
						});
						return false;
					}
				});
			});
		});
		
		socket.on("activated ability", function(){
			console.log("activated ability");
		});
		
		const ATTACK_STEP_API = "attack step";
		socket.on(ATTACK_STEP_API, function(attackerIds){
			console.log(ATTACK_STEP_API);
			
			getSession(socket, store, function(error, session){
				var escapeAttackerIds = [];
				
				attackerIds.forEach(function(attackerId){
					session.cloneField.creatures.every(function(creature){
						if(creature.id == attackerId){
							creature.tap = true;
							creature.isAttack = true;
							escapeAttackerIds.push(attackerId);
							return false;
						}
					});
				});
				
				console.log(ATTACK_STEP_API + " - emit");
				socket.emit("attack step");
				console.log("socket.broadcast.emit");
				console.log(attackerIds);
				console.log(escapeAttackerIds);
				socket.broadcast.emit("block step", escapeAttackerIds);
			});
		});
		
		socket.on("block step", function(blockerIds){
			console.log("block step");
		});
		
		socket.on("clone field?", function(){
			getSession(socket, store, function(error, session){
				console.log("clone field!");
				console.log(session);
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
		
		model.update(function(error, cloneField){
			console.log(cloneField);
			var url = '/battle/' + cloneField.urlToken;
		
			var tester = io.of(url);
			tester.on("connection", api(req.session, cookieStore));
		
			//TODO 対人戦の場合、最初にこのAPIを叩いた人はここで相手shuffleからのブロードキャスト待ちになる。
		
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
		console.log('http://localhost:3000'+result.value);
		
		result.tester.on("connection", function(){
			if(result.result) {
				//socket.ioをサーバ側で開く
				var socket = require('./node_modules/socket.io/node_modules/socket.io-client')('http://localhost:3000'+result.value, {
					'force new connection':true
				});
				socket.on("connect", function(){
					console.log("tester connect!");
					robot(socket);
				});
				
				console.log("exports.tester.api.id - result.result = true");
			}
		});
	};
};

function robot(socket){
	socket.emit("shuffle");
	
	socket.on("block step", function(attackerIds){
		console.log("tester block step");
		
		getSession(socket, null, function(error, session){
			var attackers = session.cloneField.enemy.creatures.filter(function(creature){
				for(var i = 0 ; i != attackerIds.length ; i++){
					if(attackerIds.id == creature.id){
						return creature;
					}
				}
			});
			
			console.log("robot - block step");
			console.log(session.enemy.creatures);
			console.log(attackers);
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

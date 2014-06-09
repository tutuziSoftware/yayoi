exports.api = function(session, store){
	return function(socket){
		console.log("connection");
	
		socket.on("shuffle", function(data){
			console.log("shuffle");
			
			getSession(socket, function(error, session){
				console.log("shuffle - getSession");
				
				if(error) {
					console.log("shuffle - error");
					return;
				}
				
				if(session === void 0){
					console.log("shuffle - error session is undefined");
					return;
				}
				
				var test = {
					//自分の情報		
					"i":{
						"life":20,
						"mana":0,
						"creatures":[],
						"enchantFields":[],
						"upkeeps":[],
						"deck":[
							{},{},{}
						],
						"hands":[]
					},
					//相手の情報
					"enemy":{
						"creatures":[],
						"enchantFields":[]
					}
				};
				for(var i = 0 ; i != 5 ; i++){
					test.i.hands.push({
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
				
				session.cloneField = test;
				
				socket.emit("first draw", test);
			});
		});
		
		socket.on("hand to mana", function(cardId){
			console.log("hand to mana:" + cardId);
			console.log("getSession.session = " + getSession.session);
			
			getSession(socket, function(error, session){
				console.log("hand to mana - getSession");
				
				session.cloneField.i.hands.every(function(hand, i){
					if(cardId == hand.id){
						session.cloneField.i.mana++;
						session.cloneField.i.hands.splice(i, 1);
						return false;
					}
				});
			});
		});
		
		socket.on("play", function(cardId){
			console.log("play");
			var engine = require("./public/javascripts/battle_engine.js");
			
			getSession(socket, function(error, session){
				session.cloneField.i.hands.every(function(hand, i){
					if(cardId == hand.id){
						console.log("play - hand");
						console.log(hand);
						
						session.cloneField.card = hand;
						
						engine.doEnterBattlefield.call(session.cloneField, {
							field: session.cloneField
						});
						return false;
					}
				});
			});
		});
		
		socket.on("activated ability", function(){
			console.log("activated ability");
		});
		
		socket.on("attack step", function(attackerIds){
			console.log("attack step");
			
			getSession(socket, function(error, session){
				console.log("attack step - getSession");
				
				attackerIds.forEach(function(attackerId){
					session.cloneField.i.creatures.every(function(creature){
						if(creature.id == attackerId){
							creature.tap = true;
							creature.isAttack = true;
							return false;
						}
					});
				});
				
				socket.emit("attack step");
			});
		});
		
		socket.on("clone field?", function(){
			getSession(socket, function(error, session){
				console.log("clone field!");
				console.log(session);
				var cloneField = "cloneField" in session ? session.cloneField : null;
				socket.emit("clone field!", cloneField);
			});
		});
	};
	
	/**
	 * セッションを取得します。
	 * 
	 * @param  socket	socket.ioがconnection時に出力する第一引数
	 * @param function(error, session) callback
	 */
	function getSession(socket, callback){
		if(getSession.session !== void 0){
			console.log("getSession.session");
			console.log(getSession.session);
			callback(null, getSession.session);
			return;
		}
		
		var cookie = require('cookie').parse(socket.request.headers.cookie);
		var memoryStore = new session.MemoryStore;
	
		if(typeof cookie['connect.sid'] != "string"){
			callback(true, null);
		}
	
		store.get(cookie['connect.sid'].match(/s:([^.]*)\./)[1], function(error, session){
			getSession.session = session;
			callback(error, session);
		});
	}
};

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
		
		socket.on("hand to mana", function(){
			console.log("hand to mana");
		});
		
		socket.on("play", function(){
			console.log("play");
		});
		
		socket.on("activated ability", function(){
			console.log("activated ability");
		});
		
		socket.on("attack step", function(){
			console.log("attack step");
		});
		
		socket.on("clone field?", function(){
			getSession(socket, function(error, session){
				console.log("clone field!");
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
		if(getSession.session !== void 0) callback(null, getSession.session);
		
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

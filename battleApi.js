exports.api = function(session, store){
	return function(socket){
		console.log("connection");
	
		socket.on("shuffle", function(data){
			console.log("shuffle");
			
			getSession(socket, function(error, session){
				console.log("shuffle - getSession");
				
				if(error) {
					console.log("shuffle - error emit");
					socket.emit("error", "");
					return;
				}
				
				//TODO フィールド情報を生成する
				//TODO セッションに記録する
				
				var test = {
					//自分の情報		
					"i":{
						"life":10,
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
	};
	
	/**
	 * セッションを取得します。
	 * 
	 * @param  socket	socket.ioがconnection時に出力する第一引数
	 * @param function(error, session) callback
	 */
	function getSession(socket, callback){
		var cookie = require('cookie').parse(socket.request.headers.cookie);
		var memoryStore = new session.MemoryStore;
	
		if(typeof cookie['connect.sid'] != "string"){
			callback(true, null);
		}
	
		store.get(cookie['connect.sid'].match(/s:([^.]*)\./)[1], callback);
	}
};

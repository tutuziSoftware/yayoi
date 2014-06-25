var Model = require("./userModel.js");

exports.route = function(req, res){
	res.render("standardFloor");
};

exports.api = function(io, sessionStore){
	floor(io, sessionStore);
	call(io, sessionStore);
};

function call(io, sessionStore){
	//TODO サーバ側から5秒ごとにstatusを返す
	
	var heartbeat = io.of('/standard_floor/heartbeat');
	
	heartbeat.on('connection', function(socket){
		require('./getSession.js')(socket, sessionStore, function(error, session){
			var model = new Model(session);
			
			var hb = setInterval(function(){
				model.get(function(error, user){
					console.log(user);
					socket.emit('heartbeat', user.status);
					
					if(user.status != 'wait_standard') clearInterval(hb);
				});
			}, 5555);
		});
	});
}

/**
 * フロア画面に入った時、出た時の待ち合わせAPIです。
 */
function floor(io, sessionStore){
	var api = io.of('/standard_floor');
	
	api.on("connection", function(socket){
		var userDB = require("./userDB.js").db;
		
		//コネクション確立時は待ちフラグ
		require('./getSession.js')(socket, sessionStore, function(error, session){
			if(session == void 0) return;
			
			var model = new Model(session);
			model.startEntryStandard(function(err, data){
				model.findFloorUser(function(error, players){
					//自分が見たい対戦相手一覧
					socket.emit("players", players);
				});
			});
		});
		
		//コネクションが切れた場合は待ちフラグ解除
		socket.on("disconnect", function(){
			require('./getSession.js')(socket, sessionStore, function(error, session){
				if(session == void 0) return;
				
				new Model(session).endEntryStandard();
			});
		});
	});
}

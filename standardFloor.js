var Model = require("./userModel.js");

exports.route = function(req, res){
	res.render("standardFloor");
};

exports.api = function(io, sessionStore){
	var api = io.of('/standard_floor');
	
	api.on("connection", function(socket){
		var userDB = require("./userDB.js").db;
		
		//コネクション確立時は待ちフラグ
		require('./getSession.js')(socket, sessionStore, function(error, session){
			if(session == void 0) return;
			
			var model = new Model(session);
			model.startEntryStandard(function(err, data){
				model.findFloorUser(function(error, players){
					socket.emit("players", players);
				});
			});
		});
		
		//対戦開始
		socket.on("start", function(){
			console.log("start");
			socket.emit('start');
		});
		
		//コネクションが切れた場合は待ちフラグ解除
		socket.on("disconnect", function(){
			require('./getSession.js')(socket, sessionStore, function(error, session){
				if(session == void 0) return;
				
				new Model(session).endEntryStandard();
			});
		});
	});
	
	/*
	var userDB = require("./userDB.js").db;
	
	userDB.find({
		"status":"wait_standard"
	}, function(err, data){
		console.log(data);
	});
	*/
};

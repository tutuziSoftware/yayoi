exports.route = function(req, res){
	var model = require("./userModel.js");
	model = new model(req.session);
	
	console.log(model);
	
	model.startEntryStandard();
	res.render("standardFloor");
};

exports.api = function(io, sessionStore){
	var api = io.of('/standard_floor');
	
	api.on("connection", function(socket){
		var userDB = require("./userDB.js").db;
		
		//コネクション確立時は待ちフラグ
		require('./getSession.js')(socket, sessionStore, function(error, session){
			console.log("123");
			if(session == void 0) return;
			
			var where = {_id:session.userId};
			var update = {$set:{status:'wait_standard'}};
			
			userDB.update(where, update, {multi:true}, function(){
				userDB.find({
					"status":"wait_standard",
					"_id":{$ne:session.userId}
				}, function(err, data){
					socket.emit("players", data);
				});
			});
		});
		
		//コネクションが切れた場合は待ちフラグ解除
		socket.on("disconnect", function(){
			require('./getSession.js')(socket, sessionStore, function(error, session){
				if(session == void 0) return;
				
				var where = {_id:session.userId};
				var update = {$set:{status:''}};
				
				userDB.update(where, update, {multi:true}, function(){});
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

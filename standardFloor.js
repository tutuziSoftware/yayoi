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
		
		userDB.find({
			"status":"wait_standard"
		}, function(err, data){
			console.log(data);
			socket.emit("players", data);
		});
		
		socket.on("disconnect", function(){
			//TODO ここでDBのstatusを変更する
			//どうやって？　セッションに_id保存してたはずでは。
			//どうやってセッションを探すの？　ああ…。
			console.log(sessionStore);
			
			console.log("disconnect");
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

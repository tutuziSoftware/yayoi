exports.route = function(req, res){
	var model = require("./userModel.js");
	model = new model(req.session);
	
	console.log(model);
	
	model.startEntryStandard();
	res.render("standardFloor");
};

exports.api = function(req, res){
	var userDB = require("./userDB.js").db;
	
	userDB.find({
		"status":"wait_standard"
	}, function(err, data){
		console.log(data);
		
		res.send(data);
	});
};

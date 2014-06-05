var userDB = require('./userDB.js');

exports.route = function(req, res){
	res.render("newUser");
};

exports.saveRoute = function(req, res){
	console.log(req.body);
	console.log(userDB);
	
	userDB.createUser(req.body.userName, req.body.password);
	
	res.end();
};

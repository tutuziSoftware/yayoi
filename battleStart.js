module.exports = function(req, res){
	var Model = require('./userModel.js');
	var model = new Model(req.session);
	
	console.log(model);
	console.log(req.params);
	model.startStandardBattle(req.params.id);
};

module.exports = function(req, res){
	startStandardBattle(req);
	startBattle();
	
	res.redirect('/battle');
};

function startStandardBattle(req){
	var Model = require('./userModel.js');
	var model = new Model(req.session);
	
	model.startStandardBattle(req.params.id);
}

function startBattle(){
	var battle = new (require('./BattleModel.js').BattleModel);
	battle.start();
}

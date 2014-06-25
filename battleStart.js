module.exports = function(req, res){
	startStandardBattle(req);
	startBattle(req, function(){
		res.redirect('/battle');
	});
};

function startStandardBattle(req){
	var Model = require('./userModel.js');
	var model = new Model(req.session);
	
	model.startStandardBattle(req.params.id);
}

function startBattle(req, callback){
	var battle = new (require('./BattleModel.js').BattleModel)(req.session.userId);
	battle.start(req.params.id, callback);
}

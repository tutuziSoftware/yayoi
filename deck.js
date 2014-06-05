var mongoose = require('mongoose')
var db = require("./db.js")("deck", {
	"deck":Array,
	"user":mongoose.Schema.ObjectId
});


exports.route = function(req, res){
	res.render("deck");
};

exports.routeSave = function(req, res){
	//枚数チェック
	if(Object.keys(req.body).some(function(key){
		return req.body[key] >= 0 && req.body[key] <= 4;
	}) == false){
		console.log();
		return;
	}
	
	var put = new db;	
	put.deck = Object.keys(req.body).reduce(function(deck, cardName){
		var card = {};
		card[cardName] = req.body[cardName];
		
		deck.push(card);
		return deck;
	}, []);
	put.user = req.session.userId;
	put.save();
	
	console.log("save");
	
	res.end();
};

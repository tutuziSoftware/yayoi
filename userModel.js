module.exports = function(session){
	this.session = session;
};

module.exports.prototype = {
	startEntryStandard:function(){
		var db = require("./userDB.js").db;
		
		db.update({
			"_id":this.session.userId
		},{
			"status":"wait_standard"
		},{multi:false},function(err){
		});
	},
	endEntryStandard:function(){
		var db = require("./userDB.js").db;
		
		new db({
			"status":""
		}).save();
	}
};

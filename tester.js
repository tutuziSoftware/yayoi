exports.api = function(io, session, COOKIE.store){
	return function(req, res){
		var id = require('node-uuid').v4();
		console.log(id);
		
		var tester = io.of('/battle/tester/' + id);
		tester.on("connection", require("./battleApi.js").api(session, COOKIE.store));
		
		res.send(id);
	};
};

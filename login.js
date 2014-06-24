var userDB = require('./userDB.js');

/**
 * ログイン状態の維持を確認します。
 */
exports.checkLogin = function(req, res, next){
	//? リダイレクトをここに書くのは何か間違ってると思う……可能ならapp.jsで処理すべきか？
	if("userId" in req.session){
		if(req.url == "/login") res.redirect("/");
		
		next();
	}else{
		if(req.url != "/login"){
			res.redirect("/login");
		}else{
			next();
		}
	}
};

exports.route = function(req, res){
	res.render("login.jade");
};

/**
 * ログインを行います。
 */
exports.routePost = function(req, res){
	var key = req.body;
	
	userDB.findUser(key.userName, key.password, function(user){
		if(user.length){
			req.session.userId = user[0]._id;
			
			var model = new (require('./userModel.js'))(req.session);
			model.initLoggadIn();
			
			res.redirect("/");
		}else{
			res.redirect("/login");
		}
	});
}

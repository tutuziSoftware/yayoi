
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var cookieParser = require('cookie-parser');
var session = require("express-session");

var app = express();

// all environments
var login = require("./login.js");
app.use(require('body-parser')());
app.use(cookieParser());
const COOKIE = {
	store: new session.MemoryStore,
	secret: 'yayoi',
	cookie: {
		maxAge: 86400000,
		httpOnly: false
	}
};
app.use(session(COOKIE));
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));


//新規登録
app.get('/new_user', require("./newUser.js").route);
app.post('/new_user', require("./newUser.js").saveRoute);

app.get('/', function(req, res){
	res.render('index');
});
app.get('/login', login.checkLogin, login.route);
app.post('/login', login.routePost);

app.get('/standard_floor', login.checkLogin, require("./standardFloor.js").route);
app.post('/standard_floor/api', login.checkLogin, require("./standardFloor.js").api);

app.get('/deck', login.checkLogin, require("./deck.js").route);
app.post("/deck_save", login.checkLogin, require("./deck.js").routeSave);

var server = http.createServer(app);

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server);

//練習対戦画面
app.get('/battle/tester', login.checkLogin, routes.index);
app.get('/battle/tester/api/id', login.checkLogin, require("./battleApi.js").api.id(io, session, COOKIE.store));

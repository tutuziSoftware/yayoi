var mongoose = require('mongoose');

/**
 * DBを定義するための関数です。
 * @param string name スキーマ名です
 * @param object schema スキーマを定義したオブジェクト
 * @return Mongooseオブジェクト
 */
module.exports = function(name, schema){
	var db = mongoose.createConnection('mongodb://localhost/yayoi');
	return db.model(name, new mongoose.Schema(schema));
};

module.exports.mongoose = mongoose;

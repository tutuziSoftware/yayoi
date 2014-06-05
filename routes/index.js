
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('battle', { title: 'Express' });
};

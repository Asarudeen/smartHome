
var mongoose = require('mongoose');

module.exports = mongoose.model('Item',{
	id: String,
  	user_id: String,
  	username: String,
  	month: String,
	item_name: String,
	descp: String,
  	amount: Number,
  	created_date: String
});

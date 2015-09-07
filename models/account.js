
var mongoose = require('mongoose');

module.exports = mongoose.model('Account',{
	id: String,
	user_id: String,
	month: String,
	username: String,
	amount: String
});

var express = require('express');
var router = express.Router();
var Item = require('../models/item');
var User = require('../models/user');
var Account = require('../models/account');
var nodemailer = require("nodemailer");

var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/login');
}

module.exports = function(passport){

	/* GET login page. */
	router.get('/', function(req, res) {

    	// Display the Login page with any flash message, if any
		//res.render('index', { message: req.flash('message') });
		res.redirect('/');
	});

  /* GET item create page. */
	router.get('/create', isAuthenticated, function(req, res){
		res.render('item/create', { user: req.user });
	});

	/* POST item adding to db */
	router.post('/add',function(req,res){

		currentDate = new Date();
		currentYear = currentDate.getYear();
		currentMonth = currentDate.getMonth();
		monthId = "mon_"+currentMonth+"_"+currentYear;

		  var dd = currentDate.getDate();
	      var mm = currentDate.getMonth()+1; //January is 0!
	      var yyyy = currentDate.getFullYear();
	      if(dd<10) {
	          dd='0'+dd
	      } 

	      if(mm<10) {
	          mm='0'+mm
	      } 
	      newDate = dd+'/'+mm+'/'+yyyy;

		newItem = new Item();
		newItem.user_id = req.body.user_id;
		newItem.month = monthId;
		newItem.item_name = req.body.item_name;
		if(req.body.descp)
		{
			newItem.descp = req.body.descp;
		}
		newItem.amount = req.body.amount;
		newItem.created_date = newDate;
		newItem.username = req.body.username;
		newItem.save();
		res.redirect('/');

	});

	router.get('/sendmail', isAuthenticated, function(req, res){
		var emailArray = new Array();
		var userNames = new Array();
		var indiAmt = new Array();

		User.find({},function(err,data){
			totalMembers = 0;
			for(user in data)
			{
				emailArray.push(data[user].email);
				userNames.push(data[user].username);
				totalMembers++;
			}

			//for sending mail 
			var smtpTransport = nodemailer.createTransport("SMTP",{
			   service: "Gmail",
			   auth: {
			       user: "Username@gmail.com",
			       pass: "password"
			   }
			});
			/*dynamic table*/
			totalAmt = 0;
			currentDate = new Date();
			currentMonth = currentDate.getMonth();
			currentYear = currentDate.getYear();
			monthId = "mon_"+currentMonth+"_"+currentYear;
			monthList = ['January','February','March','April','May','June','July','August','September','October','November','December'];
			  var htmlMail = "Hi, <br>";
		      htmlMail += "<p>This is the mail from smartHome</p>";
		      htmlMail += "<table border='1'><thead>";
		      htmlMail += "<tr>";
		      htmlMail += "<th>Date</th>";
		      htmlMail += "<th>User</th>";
		      htmlMail += "<th>Product</th>";
		      htmlMail += "<th>Amount</th>";
		      htmlMail += "</tr>";

		      Item.find({'month':monthId},function(error,tableData){
		      	for(item in tableData)
		      	{
		      		htmlMail += "<tr>";
				    htmlMail += "<td>"+tableData[item].created_date+"</td>";
				    htmlMail += "<td>"+tableData[item].username+"</td>";
				    htmlMail += "<td>"+tableData[item].item_name+"</td>";
				    htmlMail += "<td>"+tableData[item].amount+"</td>";
				    htmlMail += "</tr>";
				 	totalAmt = (totalAmt*1)+(tableData[item].amount*1);

				 	/*for(var i=0; i<userNames.length;i++)
				 	{
				 		if(userNames[i] == tableData[item].username)
				 		{
				 			indiAmt[userNames[i]].push() = tableData[item].amount;
				 		}
				 	}*/
		      	}

		      	Item.aggregate([{$group:{_id:"$username",amounts:{$sum:"$amount"}}}],function(mistake,initdata){
		      	indiAmt = initdata;

		      	if(tableData){
		      	var perHead = totalAmt/totalMembers;
		      	htmlMail += "<tr><td colspan='3'>Total Expense</td>";
		      	htmlMail += "<td><strong>"+totalAmt+"</strong></td></tr>";
		      	htmlMail += "</tbody></table>";
		      	htmlMail += "<p>Total Number of users "+totalMembers+"</p>";
		      	htmlMail += "<p>Total Expense per Head "+totalAmt/totalMembers+"</p>";
		      	htmlMail += "<table border='1'><thead>";
		        htmlMail += "<tr>";
		      	htmlMail += "<th>Users</th>";
		      	htmlMail += "<th>Total Exp</th>";
		      	htmlMail += "<th>Amount</th>";
		      	htmlMail += "<th>Final</th>";
		      	htmlMail += "</tr>";

		      	console.log(indiAmt.length);
		      	for(var g=0;g<indiAmt.length;g++)
		      	{
		      		finalAmt = perHead - indiAmt[g]['amounts'];
					htmlMail += "<tr>";
			      	htmlMail += "<td>"+indiAmt[g]['_id']+"</td>";
			      	htmlMail += "<td>"+perHead+"</td>";
			      	htmlMail += "<td>"+indiAmt[g]['amounts']+"</td>";
			      	htmlMail += "<td><strong>"+finalAmt+"</strong></td>";
			      	htmlMail += "</tr>";		      		
		      	}
		      	htmlMail += "</tbody></table>";
		      	htmlMail += "<p><strong>Note:</strong> Mail event is iniated by "+req.user.username+"</p>";
		      	htmlMail += "<p><strong>+</strong>Have to collect from user</p>";
		      	htmlMail += "<p><strong>-</strong>Have to give to user</p>";

		      	//mail sending codings
		      	smtpTransport.sendMail({
				   from: "Smart Home <smarthome4us@gmail.com>",
				   to: emailArray,
				   subject: "Expense List in the Month of "+monthList[currentMonth], 
				   html: htmlMail
				}, function(error, response){
				   if(error){
				       console.log(error);
				   }else{
				       console.log("Message sent: " + response.message);
				   }
				});
		      }
		      });
		      });

			
			res.render('item/mail', { emails: emailArray });
			if(err)
			{
				res.render('/',{message:'Some problem in server'});
			}
		});
	});


	return router;
}

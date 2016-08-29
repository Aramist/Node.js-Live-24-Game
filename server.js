var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var fs = require("fs");
var algebra = require("algebra.js");

console.log("Started 24-Game Server.");

var equations = [];
var currentEquation = "";

fs.readFile("equations.txt", "utf-8", (error, file) => {
	if (error) {
		console.log("Error loading equationfile:\n" + error.stack);
		return;
	}
	equations = file.split("\n");
});

const ROUND_TIME = 90;
var roundtime = ROUND_TIME;
var usercount = 0;
var users = [];



/*var toinfix = function(expression){
	var pfixString = "";
	var infixStack = new LinkedStack();
	
	var precedence = function(operator){
		switch(operator){
		case "^":
			return 3;
		case "*":
		case "/":
			return 2;
		case "+":
		case "-":
			return 1;
		default:
			return 0;
		}
	}
	
	for(var i=0; i<expression.length; i++){
		var c = expression.charAt(i);
		if(!isNaN(parseInt(c))){
			pfixString += c;
		}else if(c === "+" || c==="-" || c === "*" || c==="/" || c==="^"){
			while(c != "^" && !infixStack.isStackEmpty() && (precedence(c) <= precedence(infixStack.stackTop()))){
				pfixString += infixStack.popFromStack().item;
			}
			infixStack.pushToStack(c);
		}
	}
	while(!infixStack.isStackEmpty()){
		pfixString += infixStack.popFromStack().item;
	}
	
	
	
	this.getPostfix = function(){
		return pfixString;
	}
};*/

var isCorrect = function(s) {
	var exp = new algebra.parse(s);
	console.log(exp.toString());
	console.log(parseNumbers(currentEquation));
	console.log(exp.eval(parseNumbers(currentEquation)));
	console.log(exp.eval(parseNumbers(currentEquation)).toString());
	return exp.eval(parseNumbers(currentEquation)).toString() === "24";
};

var loadEquation = function() {
	if(equations.length == 0){
		console.log("Equation array empty");
		return false;
	}
	var line = Math.floor(Math.random() * (661 - 1) + 1);
	currentEquation = equations[line];
	return true;
};

app.use(express.static("static"));

app.get("/", function(req, res) {
	res.sendFile(__dirname + "/static/index.html");
});

http.listen(80, function() {
	console.log("listening on port 80");
});

io.on("connection", function(socket) {
	console.log("Connection received");

	socket.on("usernamereq", function(username) {
		console.log("Username request received");
		if(username == ""){
			socket.emit("usernamereq", "invalid");
			return;
		}
		if (users.indexOf(username) === -1) {
			users.push(username);
			console.log("Users: " + users);

			usercount++;
			console.log(usercount + " usercount");
			io.emit("usercount", usercount);
			socket.username = username;
			
			if(gameloop == null){
				console.log("starting match");
				startMatch();
			}
			io.emit("numbers", parseNumbers(currentEquation));
			socket.on("userlist", function(data){
				socket.emit("userlist", users);
			});
			
			//events
			socket.on("disconnect", function() {
				console.log("Disconnection received");
				usercount--;
				io.emit("usercount", usercount);
				console.log(usercount + " usercount");
				
				if(usercount == 0){
					console.log("ending current match");
					endMatch(null);
				}
				
				if(socket.username){
					if(users.indexOf(socket.username) != -1){
						users.splice(users.indexOf(socket.username), 1);
					}
				}
			});

			socket.on("equation", function(eq) {
				console.log("equation: " + eq);
				socket.emit("verification", isCorrect(eq));
				if(isCorrect(eq)){
					io.emit("matchend", socket.username + " has won the round! Sample solution: " + currentEquation.split(":")[1]);
					endMatch();
				}
			});
		} else {
			socket.emit("usernamereq", "taken");
		}
	});
});

var parseNumbers = function(eq){
	var nums = eq.split(":")[0].split(",");
	return {A: parseInt(nums[0], 10), B: parseInt(nums[1], 10), C: parseInt(nums[2], 10), D: parseInt(nums[3], 10)};
};

var gameloop = null;
var startMatch = function(){
	if(gameloop){
		console.log("Match already running!");
		return;
	}
	if (loadEquation()){
		io.emit("numbers", parseNumbers(currentEquation));
		roundtime = ROUND_TIME;
		gameloop = setInterval(function(){
			io.emit("roundtime", roundtime);
			if(roundtime === 0){
				io.emit("matchend", "There was no winner... Sample solution: " + currentEquation.split(":")[1]);
				endMatch(null);
			}
			roundtime--;
		}, 1000);
	}
};

var endMatch = function(winner){
	if(gameloop){
		clearInterval(gameloop);
		gameloop = null;
		console.log("ended match, starting a new one in 5 seconds");
		setTimeout(function(){
			io.emit("clear","");
			startMatch();
		}, 5000);
	}else{
		console.log("no match currently running!");
		gameloop = null;
		return;
		startMatch();
	}
};
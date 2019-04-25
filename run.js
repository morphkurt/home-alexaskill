var express = require("express");
var alexa = require("alexa-app");
var httprequest = require("request");
var options = require('./options.json');


var PORT = process.env.PORT || 8080;
var app = express();

var alexaApp = new alexa.app("home");

alexaApp.express({
  expressApp: app,
  checkCert: true,
  debug: true
});

app.set("view engine", "ejs");

alexaApp.launch(function(request, response) {
  response.say("Welcome to guns family");
  response.shouldEndSession(false);
	
});

alexaApp.customSlot("state",['arm','disarm','monitor']);
alexaApp.customSlot("garagestate",['open','close','check']);

alexaApp.intent("tvmute", {
    "utterances": [
	"set the tv to mute",
	"mute the tv",
	"time to mute the tv"
    ]
  },
  function(request, response) {
    var say=""
    say="muting the TV";
    fire('/api/tv/mute',options);
    response.say(say);
  });

alexaApp.intent("garage", {
    "slots": {
      "garagestate": "garagestate"
    },
	"utterances": [
	"garage to {garagestate}",
	"{garagestate} the garage"
    ]
  },
  async function(request, response) {
    var say=""
    var body = await getStatus('/api/garage/check',options);
    var result = JSON.parse(body);
    if (request.slot("garagestate") == "check" ){
		if (result.reed1State == "off"){
			say= "the garage door is closed";
		} else if(result.reed1State == "on") {
			say= "the garage door is open";
		} else {
			say="sorry, I couldn't get a valid response"
		}
    } else if (request.slot("garagestate") == "open" ){
	if (result.reed1State == "off"){
		say= "openning the garage door";
		fire('/api/garage/open',options);
	} else if(result.reed1State == "on") {
		say= "the garage door is already open";
	} else {
		say="sorry, I couldn't get a valid response"
	}
    } else if (request.slot("garagestate") == "close" ){
		if (result.reed1State == "on"){
			say= "closing the garage door";
			fire('/api/garage/close',options);
		} else if(result.reed1State == "off") {
			say= "the garage door is already closed";
		} else {
			say="sorry, I couldn't get a valid response"
		}
    } else {
	say="sorry something went wrong, I couldn't quite catch that"
    }
    response.say(say);
});



alexaApp.intent("tvpower", {
    "utterances": [
	"power off the tv",
	"turn off the tv",
	"time to turn the tv off",
	"off the tv"
    ]
  },
  function(request, response) {
    var say=""
    say="ok, turn the tv off"; 
    fire('/api/tv/poweroff',options);
    response.say(say);
});


alexaApp.intent("tvvolume", {
    "slots": {
      "number": "AMAZON.NUMBER"
    },
    "utterances": [
	"set the tv volume to {number}"
    ]
  },
  function(request, response) {
    var say=""
    console.log(request.slot("number"));

    var number=parseInt(request.slot("number"));
    console.log(number);
    if (number >= 0 && number <= 100){
	say="roger that";
	fire('/api/tv/volume/'+number,options);
    }
    else  {
	say="Sorry something not quite right";
    }
    response.say(say);
});



alexaApp.intent("alarm", {
    "slots": {
      "state": "state"
    },
    "utterances": [
	"{state} the alarm",
	"put the alarm to {arm}"
    ]
  },
  function(request, response) {
    var say=""
    if (request.slot("state") == "arm"){
	say="roger that, arming";
	fire('/api/alarm/on',options);
    }
    else if (request.slot("state") == "disarm"){
	say="yep, disarming the alarm";
	fire('/api/alarm/off',options);
    }
    else if (request.slot("state") == "monitor"){
	say="ok, monitoring the house for movements";
	fire('/api/alarm/monitor',options);
    }
    response.say(say);
});

function fire(url,options){
	httprequest.get(options.protocol+'://'+options.username+':'+options.password+'@'+options.hostname+url,function(error,response,body){
	}).end();
}

function getStatus(url,options){
	return new Promise(function(resolve,reject){
		httprequest.get(options.protocol+'://'+options.username+':'+options.password+'@'+options.hostname+url,function(error,response,body){
			if (response.statusCode==200){
				resolve(body);
			} else {	
				reject(error);
			}
		});
	});
}

app.listen(PORT);
console.log("Listening on port " + PORT + ", try http://localhost:" + PORT + "/home");

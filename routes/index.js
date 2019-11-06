var express = require('express');
var router = express.Router();
var request = require('request');
var rssReader = require('feed-read');

// if our user.js file is at app/models/user.js
var User = require('../Model/user.js');

var simpleResponse = "Hi! I'm NewsBot. I Just Born on 16-10-2017. @DarshanBhavsar Created Me For Serving News Articles To Users. Can I Serve You Some? Tell me if you want to read some.";

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express - Working' });
});

router.get('/webhook/', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === '12345') {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }  
});

router.post('/webhook/', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;
  var articles;
  if (messageText) {
    
    var normalizedText = messageText.toLocaleLowerCase();
    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    
    //============================Changed The Logic=========================
    //============================Changed The Logic=========================
    //============================Changed The Logic=========================
    
      switch (normalizedText) {
          case "/subscribe":
            subscribeUser(senderID);
            break;
            
          case "/unsubscribe":
            unsubscribeUser(senderID);
            break;
            
          case "/subscribestatus":
            subscribeStatus(senderID);
            break;
          
          default:
            // code
            callWitAI(normalizedText, function(err, intent) {
                if(err) {
                  console.log(err);
                }
                handleIntent(intent, senderID);
            });
            break;
      }
    //============================Changing The Logic=========================
    //============================Changing The Logic=========================
    //============================Changing The Logic=========================
  }
}

var joke = "Today a man knocked on my door and asked for a small donation towards the local swimming pool. I gave him a glass of water.";

function handleIntent(intent, sender) {
  switch(intent) {
    case "joke":
      sendTextMessage(sender, joke);
      break;
    case "greeting":
      sendTextMessage(sender, simpleResponse);
      break;
    case "identification":
      sendTextMessage(sender, "I'm Newsbot.");
      break;
    case "more news":
      getArticles(function(err, articles) {
        if (err) {
          console.log(err);
        } else {
          sendTextMessage(sender, "How about these?");
          var maxArticles = Math.min(articles.length, 5);
          for (var i=0; i<maxArticles; i++) {
            sendArticleMessage(sender, articles[i]);
          }
        }
      });
      break;
    case "general news":
      getArticles(function(err, articles) {
        if (err) {
          console.log(err);
        } else {
          sendTextMessage(sender, "Here's what I found...");
          sendArticleMessage(sender, articles[0]);
        }
      });
      break;
    case "local news":
      getArticles(function(err, articles) {
        if (err) {
          console.log(err);
        } else {
          sendTextMessage(sender, "I don't know local news yet, but I found these...");
          sendArticleMessage(sender, articles[0]);
        }
      });
      break;
    default:
      sendTextMessage(sender, "I'm not sure about that one :/");
      break;

  }
}

function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",               
            image_url: "http://messengerdemo.parseapp.com/img/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

function sendMessage(recipientId, messageText, send) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function sendArticleMessage(recipientId, article) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
        attachment:{
            type:"template",
            payload:{
                template_type:"generic",
                elements:[
                    {
                        title:article.title,
                        subtitle:article.published.toString(),
                        item_url:article.link
                    }
                ]
            }
        }        
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: '<YOUR_ACCESS_TOKEN>' },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}

//Google News Endpoint and Sending Articles...
var googleNewsEndpoint = 'https://news.google.com/news?output=rss';

function getArticles(callback) {
    rssReader(googleNewsEndpoint, function(err, articles) {
        if(err) {
            console.log(err);
        } else {
            if(articles.length > 0) {
                callback(null, articles);
            } else {
                callback("No Articles Found...");
            }
        }
    });
}

//User Subscription Related Functions...
function subscribeUser(id) {
  // create a new user called chris
  var newUser = new User({
    fb_id: id,
  });
  
  User.findOneAndUpdate({fb_id: id}, {fb_id: id}, {upsert: true}, function(err, user) {
    if (err) {
      sendTextMessage(newUser.fb_id, "There Was an Error While Subscribing You For Daily Articles!");
    } else {
      console.log('User saved successfully!');
      sendTextMessage(newUser.fb_id, "You've Been Subscribed!");
    }
  });
}

function unsubscribeUser(id) {
  // create a new user called chris
  var newUser = new User({
    fb_id: id,
  });
  
  User.findOneAndRemove({fb_id: id}, function(err, user) {
    if (err) {
      sendTextMessage(newUser.fb_id, "There Was an Error While Unsubscribing You For Daily Articles!");
    } else {
      console.log('User deleted successfully!');
      sendTextMessage(newUser.fb_id, "You've Been Unsubscribed!");
    }
  });
}

function subscribeStatus(id) {
  User.findOne({fb_id: id}, function(err, user) {
    var subscriptionStatus = false;
    if(err) {
      console.log(err);
    } else {
      if(user != null) {
        subscriptionStatus = true;
      }
      var subscribedText = "Your Subscription Status is: " + subscriptionStatus;
      //console.log("Your Subscription Status is: " + subscriptionStatus);
      sendTextMessage(id, "Your Subscription Status is: " + subscriptionStatus);
    }
  });
}

//Calling Wit.ai
function callWitAI(query, callback) {
  query = encodeURIComponent(query);
   request({
    uri: 'https://api.wit.ai/message?v=18/10/2017&q='+query,
    qs: { access_token: '<YOUR_ACCESS_TOKEN>' },
    method: 'GET'
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log("Successfully got %s", response.body);
      try {
        body = JSON.parse(response.body);
        var intent = body["entities"]["intent"][0]["value"];
        callback(null, intent);
      } catch (e) {
        callback(e);
      }
    } else {
      console.log(response.statusCode);
      console.error("Unable to send message. %s", error);
      callback(error);
    }
  });
}


//Reference: https://stackoverflow.com/questions/33865068/typeerror-is-not-a-function-in-node-js
module.exports = router;
module.exports.getArticles = getArticles;
module.exports.sendArticleMessage = sendArticleMessage;

//Image Module
//image_url:'http://technology.inquirer.net/files/2017/06/67966510_M.jpg'

//Wit Alternatives:
//https://alternativeto.net/software/wit-ai/
//https://recast.ai
//https://www.quora.com/What-is-an-open-source-alternative-to-wit-ai
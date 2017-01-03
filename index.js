var http = require('http');
var express = require('express');
var ShareDB = require('sharedb');
var WebSocket = require('ws');
var WebSocketJSONStream = require('websocket-json-stream');
var bodyParser = require('body-parser')

var backend = new ShareDB();
createDoc(startServer);

// Create initial document then fire callback
function createDoc(callback) {
  var connection = backend.connect();
  var doc = connection.get('vmaps', 'controller');
  doc.fetch(function(err) {
    if (err) throw err;
    if (doc.type === null) {
        doc.create({
            'mapConfig': {
                lonLat: [-117, 32],
                zoom: 7
            }
        }, callback);
      return;
    }
    callback();
  });
}

function startServer() {

    var app = express();


    app.use( bodyParser.json() );       // to support JSON-encoded bodies
    app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
        extended: true
    }));


    app.set('port', (process.env.PORT || 8080));


    app.post('/receive-alexa', function(req, res) {
        console.log(req)
        plainText = req.body.request.intent.slots.Text.value;
        res.json({
            version: '1.0',
            response: {
                outputSpeech: {
                    type: 'PlainText',
                    text: plainText
                },
            }
        });
    });


    var server = http.createServer(app);

    // Connect any incoming WebSocket connection to ShareDB
    var wss = new WebSocket.Server({server: server});
    wss.on('connection', function(ws, req) {
        var stream = new WebSocketJSONStream(ws);
        backend.listen(stream);
    });


    server.listen(app.get('port'), function() {
        console.log('running on port', app.get('port'));
    });

}

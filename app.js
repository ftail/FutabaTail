
/**
 * Module dependencies.
 */

var express = require('express')
, routes = require('./routes')
, http = require('http')
, path = require('path')
, ifaces = require('os').networkInterfaces();

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

app.get('/api/catalog', routes.catalog);
app.get('/api/thread', routes.thread)


http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
	for (var dev in ifaces) {
		var alias=0;
		ifaces[dev].forEach(function(details){
			if (details.family=='IPv4') {
				console.log('http://'+details.address+':' + app.get('port'));
			}
		});
	}
});

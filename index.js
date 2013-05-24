var express = require('express');
var app = express();
var uuid = require('node-uuid');
var async = require('async');
var redis = require('redis');
var _ = require('lodash');

if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var client = redis.createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(":")[1]);
} else {
  client = redis.createClient();
}

app.configure(function(){
  app.use(express.responseTime()); 
  app.use(express.compress());
  app.use(app.router);
  app.use(express.errorHandler()); 
});

app.get('/api/flag', function(req, res, next){
  var flag = uuid.v4();
  var id = req.query.id || '';
  var flagged = 0;
  if (!req.query.callback || !req.query.callback.match(/jquery/i)){
    // someone trying to access the api directly??
    return res.jsonp(403, {result: 'invalid'});
  }
  if (!id.match(/1-\w{3,8}/)){
    return res.jsonp(404, {result: 'id not found'});
  }
  async.waterfall([
    function(cb){ client.sadd(id, flag, cb); },
    function(result, cb){ client.smembers(id, cb); },
    function(flags, cb){
      flagged = flags.length;
      client.hset('flags', id, flagged, cb);
    },
  ], function(err){
    if (err) return next(err);
    res.jsonp({flag: flag, flagged: flagged});
  })
});

app.get('/api/unflag', function(req, res, next){
  var id = req.query.id || '';
  var flag = req.query.flag || '';
  var flagged = 0;
  if (!flag || !id) return res.jsonp(404, {result: 'id and flag combination not found'});
  async.waterfall([
    function(cb){ client.srem(id, flag, cb); },
    function(result, cb){ client.smembers(id, cb); },
    function(flags, cb){
      flagged = flags.length;
      client.hset('flags', id, flagged, cb);
    },
  ], function(err){
    if (err) return next(err);
    res.jsonp({flag: flag, flagged: flagged});
  })
});

app.get('/api/flagged', function(req, res, next){
  client.hgetall('flags', function(err, flags){
    // Alas, we seem to have to parse integers
    flags = flags || {};
    _.forOwn(flags, function(count, id){
      flags[id] = parseInt(count, 10);
    });
    res.jsonp({flags: flags});
  });
});

module.exports.app = app;
module.exports.close = function(){
  client.quit();
};

module.exports.serve = function(port, cb){
  client.select(process.env.NODE_ENV === 'test' ? 0 : 1, function(err){
    server = app.listen(process.env.PORT || port || 8080);
    if (cb) server.on('listening', cb)
  });
};


if (!module.parent){
  module.exports.serve();
}

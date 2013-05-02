var express = require('express');
var app = express();
var uuid = require('node-uuid');
var async = require('async');
var redis = require('redis');
client = redis.createClient();

var cors = function(req, res, next) {
  res.header('Cache-Control', 'max-age=300');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Expose-Headers', 'If-None-Match,Etag');
  res.header('Access-Control-Max-Age', '36000');
  next();
};

app.configure(function(){
  app.use(express.responseTime()); 
  app.use(cors);
  app.use(express.compress());
  app.use(express.bodyParser()); 
  app.use(app.router);
  app.use(express.errorHandler()); 
});

app.post('/api/flag', function(req, res, next){
  var flag = uuid.v4();
  var id = req.body.id || '';
  if (!id.match(/1-\w{3,8}/)){
    return res.json(404, {result: 'id not found'});
  }
  async.waterfall([
    function(cb){ client.sadd(id, flag, cb); },
    function(result, cb){ client.smembers(id, cb); },
    function(flags, cb){ client.hset('flags', id, flags.length, cb); },
  ], function(err){
    if (err) return next(err);
    res.json({flag: flag});
  })
});

app.post('/api/unflag', function(req, res, next){
  var id = req.body.id || '';
  var flag = req.body.flag || '';
  if (!flag || !id) return res.json(404, {result: 'id and flag combination not found'});
  async.waterfall([
    function(cb){ client.srem(id, flag, cb); },
    function(result, cb){ client.smembers(id, cb); },
    function(flags, cb){ client.hset('flags', id, flags.length, cb); },
  ], function(err){
    if (err) return next(err);
    res.json({flag: flag});
  })
});

app.get('/api/flagged', function(req, res, next){
  client.hgetall('flags', function(err, flags){
    // use etag where possible
    // add randomness in there or do this on client??
    console.error(flags);
    res.json({flags: flags});
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

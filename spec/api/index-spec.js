process.env.NODE_ENV = 'test';
var frisby = require('frisby');
var URL = 'http://localhost:6060';
var api = require('../../');

describe('test', function(){
it("should work", function(done){
api.serve(6060, function(){

    console.error('server??');
  var redis = require('redis');
  client = redis.createClient();
  client.flushdb(function(err){

    console.error('flush done??' + err);

    frisby.create('/api/flag')
      .post(URL + '/api/flag', {id: '1-34534'})
      .expectStatus(200)
      .expectHeaderContains('content-type', 'application/json')
      .expectJSONTypes( { flag: String } )
      .afterJSON(function(res){
        
        frisby.create('/api/flagged')
          .get(URL + '/api/flagged')
          .expectStatus(200)
          .expectHeaderContains('content-type', 'application/json')
          .afterJSON(function(result){
            expect(result.flags).toEqual({'1-34534': '1'})
          })
          .after(function(r){

            frisby.create('/api/unflag')
              .post(URL + '/api/unflag', {id: '1-34534', flag: res.flag})
              .expectStatus(200)
              .expectHeaderContains('content-type', 'application/json')
              .expectJSONTypes( { flag: String } )
              .after(function(r){
                server.close();
                api.close();
                done();
              })
              .toss();
          })
          .toss();
      })
      .toss();
  });
});
});
});


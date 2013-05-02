process.env.NODE_ENV = 'test';
var PORT = 6060;
var URL = 'http://localhost:' + PORT;
var api = require('../../');
var redis = require('redis');
var request = require('request');
var should = require('should');

describe('/api', function(){

  var client;

  before(function(done){
    client = redis.createClient();
    client.flushdb(function(err){
      api.serve(PORT, done);
    });
  });

  describe('/api/flag' , function(){
    
    describe('POSTed to with a valid flag id' , function(){

      var json;

      before(function(done){
        request.post({url: URL + '/api/flag', form: {id: '1-2522'}}, function(err, res, body){
          json = JSON.parse(body);
          done();
        });
      });

      it("should return a unique flag id to be used for unflagging", function(){
        json.flag.length.should.equal(36)
      });

      it("should return the total number of times that incident has been flagged", function(){
        json.flagged.should.equal(1)
      });
    });
  });

  describe('/api/unflag' , function(){
    
    describe('POSTed to with a id and flag id of a previousy flagged incident' , function(){

      var id = '1-3333';
      var flag;
      var flagged;

      beforeEach(function(done){
        request.post({url: URL + '/api/flag', form: {id: id}}, function(err, res, body){
          var json = JSON.parse(body)
          flag = json.flag;
          flagged = json.flagged;
          done();
        });
      });

      it("should return the total number of times it has been flagged after being unflagged once", function(done){
        request.post({url: URL + '/api/unflag', form: {id: id, flag: flag}}, function(err, res, body){
          var json = JSON.parse(body);
          json.flagged.should.equal(flagged - 1);
          done();
        });
      });
    });
  });

  describe('/api/flagged' , function(){
    
    describe('with a previously flagged incident' , function(){

      var id = '1-3333';
      var flag;
      var flagged;

      beforeEach(function(done){
        request.post({url: URL + '/api/flag', form: {id: id}}, function(err, res, body){
          var json = JSON.parse(body)
          flag = json.flag;
          flagged = json.flagged;
          done();
        });
      });

      it("should return an object with all the flags made", function(done){
        request.get(URL + '/api/flagged', function(err, res, body){
          var json = JSON.parse(body);
          json.flags[id].should.equal('1');
          done();
        });
      });
    });
  });

  after(function(){
    server.close();
    api.close();
  });
});

/*

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

  after(function(done){
    server.close();
    api.close();
    done();
  });
});
*/

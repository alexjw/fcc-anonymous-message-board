/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');
var MongoClient = require('mongodb').MongoClient;

chai.use(chaiHttp);

suite('Functional Tests', function() {

  let threadID = undefined
  let replyID = undefined
  
  const DATABASE = "mongodb://alex:alex1995@freecodecamp-shard-00-02-w89rl.gcp.mongodb.net:27017/test?ssl=true&replicaSet=FreeCodeCamp-shard-0&authSource=admin&retryWrites=true&w=majority"
  
  MongoClient.connect(DATABASE, (err, db) => db.collection('threads').deleteMany( { board: 'test' } ))
  
  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      
      test('Create Thread with all fields', function(done) {
         chai.request(server)
        .post('/api/threads/test')
        .send({text: 'Test Thread', delete_password: "12345"})
        .end(function(err, res){
           
           var id = res.res.req.path.split("new_thread_id=")[1]
           threadID = id
           assert.equal(res.status, 200)
           done()
        })
      })
      
      test('Create Thread with missing fields', function(done) {
         chai.request(server)
        .post('/api/threads/test')
        .send({delete_password: "12345"})
        .end(function(err, res){
           assert.equal(res.status, 400)
           done()
        })
      })
    });
    
    suite('GET', function() {
      
      test('GET recent Threads', function(done) {
         chai.request(server)
        .get('/api/threads/test')
        .end(function(err, res){
           assert.equal(res.status, 200)
           assert.isArray(res.body, "Result should be an array")
           assert.property(res.body[0], "_id")
           assert.property(res.body[0], "text")
           assert.property(res.body[0], "created_on")
           assert.property(res.body[0], "bumped_on")
           assert.notProperty(res.body[0], "reported")
           assert.notProperty(res.body[0], "delete_password")
           assert.isArray(res.body[0].replies, "Replies should be an array")
           done()
        })
      })
      
    });
    
    suite('PUT', function() {
      
      test('Report a Thread', function(done) {
         chai.request(server)
        .put('/api/threads/test')
        .send( {thread_id: threadID} )
        .end(function(err, res){
           assert.equal(res.status, 200)
           assert.equal(res.res.text, "Success")
           done()
        })
      })
        
    });
    
    /*suite('DELETE', function() {
      
    });*/
    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      
      test('Create reply with all fields', function(done) {
         chai.request(server)
        .post('/api/replies/test')
        .send({text: 'Test Thread', delete_password: "12345", thread_id: threadID})
        .end(function(err, res){
           var id = res.res.req.path.split("reply_id=")[1]
           replyID = id
           assert.equal(res.status, 200);
           done();
        });
      });
      
      test('Create reply with missing fields', function(done) {
         chai.request(server)
        .post('/api/replies/test')
        .send({text: 'Test Thread', thread_id: threadID})
        .end(function(err, res){
           assert.equal(res.status, 400);
           done();
        });
      });
      
    });
    
    suite('GET', function() {
      
      test('GET recent Threads', function(done) {
         chai.request(server)
        .get('/api/replies/test?thread_id=' + threadID)
        .end(function(err, res){
           assert.equal(res.status, 200)
           assert.isArray(res.body.replies, "Result should be an array")
           assert.equal(res.body._id, threadID)
           assert.equal(res.body.replies[0]._id, replyID)
           assert.property(res.body, "text")
           assert.property(res.body, "created_on")
           assert.property(res.body, "bumped_on")
           assert.notProperty(res.body, "reported")
           assert.property(res.body.replies[0], "text")
           assert.property(res.body.replies[0], "created_on")
           assert.notProperty(res.body.replies[0], "reported")
           done()
        })
      })
      
    });
    
    suite('PUT', function() {
      
      test('Report a Reply', function(done) {
         chai.request(server)
        .put('/api/replies/test')
        .send( {thread_id: threadID, reply_id: replyID} )
        .end(function(err, res){
           assert.equal(res.status, 200)
           assert.equal(res.res.text, "Success")
           done()
        })
      })
      
    });
    
    suite('DELETE', function() {
      
      test('Delete a comment with incorrect password', function(done) {
         chai.request(server)
        .delete('/api/replies/test')
        .send( {thread_id: threadID, reply_id: replyID, delete_password: "123456"} )
        .end(function(err, res) {
           assert.equal(res.status, 400)
           done()
        })
      })
      
      test('Delete a comment with correct password', function(done) {
         chai.request(server)
        .delete('/api/replies/test')
        .send( {thread_id: threadID, reply_id: replyID, delete_password: "12345"} )
        .end(function(err, res) {
           assert.equal(res.status, 200)
           done()
        })
      })
      
    });
    
  });
  
  suite('DELETE FOR /api/threads/:board', function() {
      
    test('Delete a thread with incorrect password', function(done) {
         chai.request(server)
        .delete('/api/threads/test')
        .send( {thread_id: threadID, delete_password: "123456"} )
        .end(function(err, res) {
           assert.equal(res.status, 400)
           done()
        })
    })
    
    test('Delete a thread with correct password', function(done) {
         chai.request(server)
        .delete('/api/threads/test')
        .send( {thread_id: threadID, delete_password: "12345"} )
        .end(function(err, res) {
           assert.equal(res.status, 200)
           done()
        })
    })
    
  })

});

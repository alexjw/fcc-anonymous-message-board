/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
const DATABASE = "mongodb://alex:alex1995@freecodecamp-shard-00-02-w89rl.gcp.mongodb.net:27017/test?ssl=true&replicaSet=FreeCodeCamp-shard-0&authSource=admin&retryWrites=true&w=majority"
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .get(function (req, res){
      MongoClient.connect(DATABASE, (err, db) => {
        if(err) {
          console.log('Database error: ' + err);
          return
        }
        var date = new Date();
        
        db.collection('threads').find( { board: req.params.board }, { fields: { delete_password: 0, board: 0, 'replies.delete_password': 0, reported: 0, "reply.reported": 0} } ).sort( { bumped_on: -1 } ).limit(10).toArray(function(err, result) {
          if (err) {
            res.status(400).send('Error')
            return
          }
          result.forEach((item) => {
            item.replies.sort((a, b) => a.created_on < b.created_on)
            item.replies = item.replies.slice(0,3)
            item.replies.sort((a, b) => a.created_on > b.created_on)
            delete item.reported
          })
          res.json(result)
          return
        })
      })
    })
         
    .post(function (req, res){
      console.log(req.body)
      console.log(req.query)
      console.log(req.params)
      if(req.params.board == null || req.body.text == null || req.body.delete_password == null) {
        res.status(400).send("Insert all fields (board, text and delete_password)")
        return
      }
      MongoClient.connect(DATABASE, (err, db) => {
        if(err) {
          console.log('Database error: ' + err);
          return
        }
        var date = new Date();
        db.collection('threads').insert(
          { board: req.params.board, text: req.body.text, delete_password: req.body.delete_password, created_on: date.toISOString(), bumped_on: date.toISOString(), reported: false, replies: []},
          (error, response) => {
           if(error) {
             res.status(400).send('Error while inserting')
             console.log("error")
           } else {
             res.redirect("/b/" + req.params.board + "?new_thread_id=" + response.ops[0]._id)
             return
           }
         }
        )
      })
    })
         
    .put(function (req, res){
      MongoClient.connect(DATABASE, (err, db) => {
        if(err) {
          console.log('Database error: ' + err);
          return
        }
        var date = new Date();
        if(req.body.thread_id.length != 24) {
          res.status(200).send("ID error")
          return
        }
        
        db.collection('threads').update(
          {_id: new ObjectID(req.body.thread_id), board: req.params.board},
          { $set: { reported: true }},
          (err, doc) => {
            if(err != null) {
              res.status(200).send("Could not report the Thread")
              return
            }
            res.status(200).send("Success")
            return
          })
      })
    })
         
    .delete(function (req, res){
      if(req.body.thread_id.length != 24) {
        res.status(400).send('ID length Error')
        return
      }
      console.log(req.body)
      MongoClient.connect(DATABASE, (err, db) => {
          if(err) {
            console.log('Database error: ' + err);
            res.status(500).send('Error')
            return
          }
        db.collection('threads').deleteOne({ board: req.params.board, _id: new ObjectID(req.body.thread_id), delete_password: req.body.delete_password }, (err, result) => {
          if (err) {
            res.status(400).send('Error')
            return
          }
          if(result.result.n == 1) {
            res.status(200).send('success')
          }
          else {
            res.status(400).send('incorrect id or password')
          }
          return
        })
      })
    })
    
  app.route('/api/replies/:board')
    .get(function (req, res){
      if(req.query.thread_id.length != 24) {
        res.status(400).send('ID length Error')
        return
      }
      MongoClient.connect(DATABASE, (err, db) => {
        if(err) {
          console.log('Database error: ' + err);
          res.status(500).send('Error')
          return
        }
        var date = new Date();
        
        db.collection('threads').findOne( { board: req.params.board, _id: new ObjectID(req.query.thread_id) }, { fields: { delete_password: 0, board: 0, 'replies.delete_password': 0, reported: 0, "replies.reported": 0} }, function(err, result) {
          if (err) {
            res.status(400).send('Error')
            return
          }
          result.replies.sort((a, b) => a.created_on > b.created_on)
          res.json(result)
          return
        })
      })
    })
         
    .post(function (req, res){
      console.log(req.body)
      console.log(req.query)
      console.log(req.params)
      if(req.body.thread_id == null || req.params.board == null || req.body.text == null || req.body.delete_password == null) {
        res.status(400).send("Insert all fields (board, text, thread_id and delete_password)")
        return
      }
      MongoClient.connect(DATABASE, (err, db) => {
        if(err) {
          console.log('Database error: ' + err);
          return
        }
        var date = new Date();
        if(req.body.thread_id.length != 24) {
          res.status(200).send("ID error")
          return
        }
        
        let reply_id = new ObjectID()
        db.collection('threads').update(
          {_id: new ObjectID(req.body.thread_id), board: req.params.board},
          { $set: { bumped_on: date.toISOString() }, $addToSet:{
              replies: {_id: reply_id, text: req.body.text, delete_password: req.body.delete_password, created_on: date.toISOString(), reported: false}
          }},
          (err, doc) => {
            //console.log(doc.result.nModified)
            if(doc.result.nModified == 0) {
              res.status(200).send("Could not update the Thread")
              return
            }
            res.redirect("/api/replies/" + req.params.board + "?thread_id=" + req.body.thread_id + "&reply_id=" + reply_id)
            return
          })
      })
    })
         
    .put(function (req, res){
      MongoClient.connect(DATABASE, (err, db) => {
        if(err) {
          console.log('Database error: ' + err);
          return
        }
        var date = new Date();
        if(req.body.thread_id.length != 24) {
          res.status(200).send("ID error")
          return
        }
        
        db.collection('threads').findOne(
          {_id: new ObjectID(req.body.thread_id), board: req.params.board},
          (err, doc) => {
            if(err != null) {
              res.status(200).send("Could not report the Thread")
              return
            }
            var flag = false
            doc.replies.forEach((element) => {
              if(element._id == req.body.reply_id) {
                element.reported = true
                flag = true
              }
            })
            if(!flag) {
              res.status(200).send("Couldn't find comment")
              return
            }
            db.collection('threads').update(
            {_id: new ObjectID(req.body.thread_id), board: req.params.board},
            { $set: { replies: doc.replies }},
            (err1, doc1) => {
              if (err1) {
                res.status(500).send('Error')
                return
              }
              res.status(200).send('Success')
              return
            })
          })
      })
    })
         
    .delete(function (req, res){
      if(req.body.thread_id.length != 24 || req.body.reply_id.length != 24) {
        console.log("length error")
        res.status(400).send('ID length Error')
        return
      }
      console.log(req.body)
      MongoClient.connect(DATABASE, (err, db) => {
          if(err) {
            console.log('Database error: ' + err);
            res.status(500).send('Error')
            return
          }
        db.collection('threads').findOne({ board: req.params.board, _id: new ObjectID(req.body.thread_id) }, (err, result) => {
          if (err) {
            res.status(400).send('Error')
            return
          }
          if(result == null) {
            console.log("Couldn't find the Thread")
            res.status(400).send("Couldn't find the Thread")
            return
          }
          var flag = false
          var incorrectPassword = false
          result.replies.forEach((element) => {
            if(element._id == req.body.reply_id) {
                console.log("element.delete_password = " + element.delete_password + " req.body.delete_password = " + req.body.delete_password)
              if(element.delete_password == req.body.delete_password) {
                console.log("[deleted]")
                element.text = "[deleted]"
                flag = true
              }
              else {
                console.log("incorrect password")
                res.status(400).send("incorrect password")
                incorrectPassword = true
                return
              }
            }
          })
          if(incorrectPassword)
            return
          if(!flag) {
            console.log("Couldn't find comment")
            res.status(400).send("Couldn't find comment")
            return
          }
          db.collection('threads').update(
            {_id: new ObjectID(req.body.thread_id), board: req.params.board},
            { $set: { replies: result.replies }},
            (err1, doc1) => {
              if (err1) {
                console.log("Error")
                res.status(500).send('Error')
                return
              }
              console.log("Success")
              res.status(200).send('Success')
              return
          })
        })
      })
    })
};

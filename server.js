var http = require('http');
var express = require('express');
var bodyParser = require("body-parser");
var app = express();
var mustacheExpress = require('mustache-express');
var path = require('path');
var public_dir = './public/';

//MONGODB
var mongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var url = "mongodb://localhost:27017/products";


// MUSTACHE
app.engine('html', mustacheExpress());

app.set('view engine', 'mustache');
app.set('views', __dirname + '/public');


mongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("connected correctly to server");
  //db.collection("products").remove({});
  db.close();
});

function getAllItems(callback){

  mongoClient.connect(url, function(err, db){
    assert.equal(null, err);

    db.collection("products").find().toArray(function(err,items){
      if(err) {
        callback(err);
      } else {
        callback(items);
      }
    });
    db.close();
  });
}


function addItem(newdoc){
  mongoClient.connect(url, function(err, db){
    assert.equal(null, err);
    db.collection("products").insertOne(newdoc, function(err, res) {
      if (err) throw err;
      console.log("1 record inserted");
      db.close();
    });
  });
}


function findItem(stylenum, callback){
  mongoClient.connect(url, function(err, db){
    assert.equal(null, err);
    db.collection("products").findOne({style:stylenum}, function(err, doc) {
        if (err){
          throw err;
        } else {
          callback(doc);
        }
    });
    db.close();
  });
}

function updateItem(newdoc, stylenum){
  mongoClient.connect(url, function(err, db){
    assert.equal(null, err);
    var query = {style: stylenum};
    console.log(query);
    console.log(newdoc);
    var findoc = {$set: newdoc};
    db.collection("products").update(query, findoc, function(err, res){
      console.log("updated!");
      if (err) throw err;
    });
    db.close();
  });
}

// TEMPLATE CALLBACK FUNCTION

/*
getAllItems(function(results){
  console.log(results);
});
*/


app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(express.static('public'));



//ROUTING


//INDEX: HOMEPAGE

app.get('/', function(req, res, next){
    res.sendFile(public_dir + 'index.html', {root: __dirname});
  });


app.get('/clothing', function(req, res, next){

      getAllItems(function(allItems){
        res.render('clothing.html', {products: allItems});
      });
  });



app.get('/products', function(req, res, next){

  var styleNum = req.query.style;

  //console.log(styleNum);

  findItem(styleNum, function(result){
    //console.log(result);
    res.render('item.html', {product: result});
  });

});

app.get('/about', function(req, res, next){
      res.sendFile(public_dir + 'about.html', {root: __dirname});
    });

app.get('/collections', function(req, res, next){
      res.sendFile(public_dir + 'collections.html', {root: __dirname});
    });


app.get('/login', function(req, res, next){
      res.sendFile(public_dir + 'login.html', {root: __dirname});
    });


app.get('/admin', function(req, res, next){
    getAllItems(function(allItems){
      res.render('admin.html', {products: allItems});
    });
  });

app.get('/add', function(req, res, next){
          res.sendFile(public_dir + 'admin_2.html', {root: __dirname});
        });

app.post('/add', function(req, res, next){

      var itemImg = "img/fall2017/" + req.body.image;
      var itemName = req.body.name;
      var desc = req.body.description;
      var style = req.body.style;
      var price = req.body.price;
      var size = req.body.size;
      var color = req.body.color;
      var about = req.body.about;

      var itemObj = {image: itemImg, name: itemName, description: desc, style: style, price: price, size: size, color: color, about: about};

      addItem(itemObj);

      //res.sendFile(public_dir + 'admin_2.html', {root: __dirname});
      res.redirect('/admin');
    });


app.get('/edit', function(req, res, next){

      var styleNum = req.query.style;

      findItem(styleNum, function(result){

        res.render('edit.html', {product: result});
      });

    });

app.post('/edit', function(req, res, next){

  var possibleAttributes = ["image", "name", "description", "style", "color", "about"];
  var itemObj = {};
  var styleNum = req.body["id"];

  for (var i = 0; i < possibleAttributes.length; i++){
    var curr = possibleAttributes[i];
    if (req.body.hasOwnProperty(curr)) {
      //console.log("YAYAY HERE WE ARE");
      itemObj[possibleAttributes[i]] = req.body[curr];
    }
  }

    updateItem(itemObj, styleNum);
    getAllItems(function(allItems){
      console.log(allItems);
    });

    res.redirect('/admin');
  });

app.listen(8080, function(){
    console.log("Server running on port 8080");
  });

var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var dataUtil = require("./util");
var _ = require("underscore");
var logger = require('morgan');
var exphbs = require('express-handlebars');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.use('/public', express.static('public'));

// dataUtil.restoreOriginalData();
var _DATA = dataUtil.loadData().reviews;

/* Add whatever endpoints you need! Remember that your API endpoints must
 * have '/api' prepended to them. Please remember that you need at least 5
 * endpoints for the API, and 5 others.
 */

app.get('/',function(req,res){
  res.render('home',{
    data: _DATA,
    dataString: encodeURIComponent(JSON.stringify(_DATA))
  });
})

app.get("/create", function(req, res) {
    res.render('create');
});

app.get('/review/:id', function(req, res) {
    var _id = parseInt(req.params.id);
    var review = _.findWhere(_DATA, { id: _id });
    if (!review) return res.render('404');
    res.render('post', review);
});

app.get('/restaurant/:name', function(req, res) {
    var name = req.params.name;
    var reviews = _.where(_DATA, { restaurant: name });
    if (!reviews) return res.render('404');
    res.render('home',{
      data: reviews,
      restaurant: name,
    });
});

app.post('/addReview', function(req, res) {

    var images = []
    if (req.body.images) {
      try{
        images = JSON.parse(req.body.images)
      } catch(err) {
        images = []
      }
    }
    var currentDate = new Date()
    var review = {
      id: _DATA.length+1,
      restaurant: req.body.restaurant,
      user: req.body.user,
      rating: parseInt(req.body.rating),
      text: req.body.text,
      images: images,
      date: currentDate.toDateString()
    }

    _DATA.unshift(review)
    dataUtil.saveData(_DATA)
    res.redirect("/");
});

app.get('/api/getReviews',function(req,res){
  res.send(_DATA)
})

app.post("/api/addReview", function(req, res) {
  // Enforce fields in review
  if (!req.body.restaurant || !req.body.user || !req.body.rating || !req.body.text) {
    res.send("Missing field in review. Be sure to add restaurant, user, rating, and text.")
  } else if (isNaN(parseInt(rating)) || parseInt(req.body.rating) < 0 || parseInt(req.body.rating) > 10) {
    res.send("Rating is not a number between 0 and 10")
  }
  var images = []
  if (req.body.images) {
    images = JSON.parse(req.body.images)
  }

  // Get current date
  var currentDate = new Date()
  var review = {
    id: _DATA.length+1,
    restaurant: req.body.restaurant,
    user: req.body.user,
    rating: parseInt(req.body.rating),
    text: req.body.text,
    images: images,
    date: currentDate.toDateString()
  }

  // Push to datastore
  _DATA.unshift(review)
  dataUtil.saveData(_DATA)

  res.json(review)
});

app.get('/top', function(req, res) {
  sortedData = JSON.parse(JSON.stringify(_DATA))
  sortedData.sort(function(a, b) {
      return b.rating - a.rating;
  })
  res.render('home',{
    data: sortedData,
  });
});

app.get('/lowest', function(req, res) {
  sortedData = JSON.parse(JSON.stringify(_DATA))
  sortedData.sort(function(a, b) {
      return a.rating - b.rating;
  })
  res.render('home',{
    data: sortedData,
  });
});

app.get('/today', function(req, res) {
  var currentDate = new Date().toDateString()
  var reviews = _.where(_DATA, { date: currentDate });
  res.render('home',{
    data: reviews,
  });
});

app.get('/random/restaurant', function(req, res) {
  restaurants = []
  for (let review of _DATA) {
    if (!restaurants.includes(review.restaurant)) {
      restaurants.push(review.restaurant)
    }
  }

  var random = Math.floor(Math.random() * restaurants.length)
  restaurant = restaurants[random]

  // var reviews = _.where(_DATA, { restaurant: restaurant });
  res.redirect("/restaurant/"+restaurant);
});

app.get('/random/review', function(req, res) {
  count = _DATA.length
  var random = Math.floor(Math.random() * (count)) + 1
  res.redirect("/review/"+random);
});

app.listen(3000, function() {
    console.log('Listening on port 3000!');
});
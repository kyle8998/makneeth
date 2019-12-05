var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var dataUtil = require("./util");
var _ = require("underscore");
var logger = require('morgan');
var exphbs = require('express-handlebars');
// SOCKET LOGIC
var sockets = require('./syncserver');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.use('/public', express.static('public'));

// Start syncserver
var server = require('http').createServer(app);
sockets.startSocketServer(server);

// dataUtil.restoreOriginalData();
var _DATA = dataUtil.loadData().reviews;

// CHANGE EVERYTHING BELOW

app.get('/',function(req,res){
  res.render('home',{
    data: _DATA,
    dataString: encodeURIComponent(JSON.stringify(_DATA))
  });
})

// Just my testing path
app.get('/v/test',function(req,res){
  video = {
    title: `Workaholic`,
    videoId: "mrAIqeULUL0",
    thumbnail: "http://i3.ytimg.com/vi/mrAIqeULUL0/maxresdefault.jpg"
  }
  res.render('video',{
    video: video,
  });
})

app.get('/v/:videoId',function(req,res){
  video = {
    title: `<Title Here> (vid: ${req.params.videoId})`,
    // videoId: "4OrCA1OInoo",
    videoId: req.params.videoId,
    thumbnail: "http://i3.ytimg.com/vi/4OrCA1OInoo/maxresdefault.jpg"
  }
  res.render('video',{
    // HARDCODED FOR NOW
    video: video,
    // scripts: scripts
  });
})

app.get("/create", function(req, res) {
    res.render('create');
});

app.get("/feedback", function(req, res) {
  res.render('feedback');
});

app.post('/addFeedback', function(req, res) {

  var feedback = {
    name: req.body.name,
    feedback: req.body.feedback,
    rating: req.body.rating,
  }

  //NAVNEETH: add feedback to database HERE

  res.redirect("/");
});

app.post('/addVideo', function(req, res) {

    var currentDate = new Date()
    var url = req.body.url
    var x = url.indexOf("=")
    var videoId = url.substring(x , len(url))

    var video = {
      name: req.body.name,
      videoId: videoId,
      date: currentDate,
      comments: [],
    }

    // NAVNEETH: ADD VIDEO TO DATABASE
    res.redirect("/");
});


//change to getfeedback
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

server.listen(3000, function() {
    console.log('Listening on port 3000!');
});

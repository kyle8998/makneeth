var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var dataUtil = require("./util");
var _ = require("underscore");
var logger = require('morgan');
var exphbs = require('express-handlebars');
// Mongoose/Mongo
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var dotenv = require('dotenv');
var Schema = require('./models/Video');
var Video = Schema.Video;
var Feedback = Schema.Feedback;
// load environment variables
dotenv.load();

// connect to MongoDB
mongoose.connect(process.env.MONGODB, { useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connection.on('error', err => {
    console.log(err);
    console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
    process.exit(1);
});

// SOCKET LOGIC
var sockets = require('./syncserver');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.use('/public', express.static('public'));

// Start syncserver
var server = require('http').createServer(app);
sockets.startSocketServer(server);

// dataUtil.restoreOriginalData();

// NAVNEETH change this to be the json data from the DB
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

app.get('/v/:videoId/:name',function(req,res){

  Video.find({title: req.params.name, id: req.params.videoId}, function(err, video){
    if (err) throw err;

    if (video.length == 0) {
      return res.render('404', {});
    }
    outputVid = {
      title: video[0].title,
      videoId: video[0].id,
      thumbnail: "http://img.youtube.com/vi/${video[0].id}/maxresdefault.jpg"
    }
    res.render('video', {
      video: outputVid,
    });

  });

})

app.get("/create", function(req, res) {
    res.render('create');
});

app.get("/feedback", function(req, res) {
  res.render('feedback');
});

app.post('/addFeedback', function(req, res) {

  var feedback = new Feedback({
    rating: req.query.rating,
    comment: req.query.comment
  });

  feedback.save(function(err) {
    if (err) throw err;
    return res.send('Successfully inserted feedback');
  });

  //NAVNEETH: add feedback to database HERE AND TO _DATA
});

//passing in title, url
app.post('/addVideo', function(req, res) {

    var currentDate = new Date()
    var url = req.query.url
    var x = url.indexOf("=") + 1
    var videoId = url.substring(x , url.length)

    var video = new Video({
      title: req.query.title,
      id: videoId,
      date: currentDate,
      comments: []
    });

    Video.find({title: req.query.title, id: videoId}, function(err, video) {
      if (!err) res.send("Page already exists!");
      else
        video.save(function(err) {
          if (err) throw err;
          return res.send('Successfully inserted video');
        })
    });

    // NAVNEETH: ADD VIDEO TO DATABASE AND TO _DATA
    // _DATA.unshift(video)
    // dataUtil.saveData(_DATA)

    // res.redirect("/");
});


//change to getfeedback
app.get('/api/getFeedback',function(req,res){

  Feedback.find({rating: req.query.rating, comment: req.query.comment}, function(err, feedback){
    if (err) throw err;
    console.log(feedback);
    res.send(feedback);
  });

})

//post comment
app.post('/v/:videoId/comment', function(req, res) {

  var currentDate = new Date()

  Video.findOne({id: req.params.videoId}, function(err, video) {
    if (err) throw err;
    if (!video) return res.send('No video found with that ID.');
    video.comments.push({
      name: req.query.name,
      text: req.query.text,
      date: currentDate
    });
    video.save(function(err) {
      if (err) throw err;
      return res.send('Successfully inserted comment');
    });
  });
})

//get all comments
app.get('/c/:videoId/comments', function(req, res) {
  Video.find({id: req.params.videoId}, function(err, video) {
    if (err) throw err;
    res.send(video[0].comments);
  });
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

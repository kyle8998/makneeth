var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var dataUtil = require("./util");
var _ = require("underscore");
var logger = require('morgan');
var exphbs = require('express-handlebars');
const request = require('request');
// Mongoose/Mongo
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var dotenv = require('dotenv');
var Schema = require('./models/Video');
var Video = Schema.Video;
var Feedback = Schema.Feedback;
// load environment variables
dotenv.load();

YT3_API_KEY = process.env.YT3_API_KEY;

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

q =   Video.find({})

var _DATA = []

q.exec(function(err,videos){
  if(err)
     return console.log(err);

  ans = []
  videos.forEach(function(video){
     _DATA.push(video);
  });

});

// CHANGE EVERYTHING BELOW

app.get('/',function(req,res){
  console.log(_DATA)
  res.redirect('/recent')
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

  Video.find({id: req.params.videoId}, function(err, video){
    if (err) throw err;

    if (video.length == 0) {
      return res.render('404', {});
    }
    outputVid = {
      title: video[0].title,
      videoId: video[0].id,
      thumbnail: "http://img.youtube.com/vi/${video[0].id}/maxresdefault.jpg",
      comments: video[0].comments
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
    console.log('Successfully inserted feedback');
    return res.redirect("/");
  });

  //NAVNEETH: add feedback to database HERE AND TO _DATA
});

//passing in title, url
app.post('/addVideo', function(req, res) {

    var currentDate = new Date()
    var url = req.body.url
    var x = url.indexOf("=") + 1
    var videoId = url.substring(x , url.length)

    // Get title
    request.get({
      headers: {'content-type' : 'application/x-www-form-urlencoded'},
      url:     `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YT3_API_KEY}`,
    }, function(error, response, body){
      data = JSON.parse(body)
      var title = data.items[0].snippet.title

      var vid = new Video({
        title: title,
        id: videoId,
        date: currentDate,
        comments: []
      });

    Video.find({title: req.query.title, id: videoId}, function(err, video) {
      if (video.length != 0) return res.send("Page already exists!");
      vid.save(function(err) {
        if (err) throw err;

        _DATA.push(vid)
        console.log("Successfully inserted video");
        return res.redirect("/");
      });
    });

    // NAVNEETH: ADD VIDEO TO DATABASE AND TO _DATA
    // _DATA.unshift(video)
    // dataUtil.saveData(_DATA)
    });
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
// app.post('/v/:videoId/comment', function(req, res) {
app.post('/addComment', function(req, res) {

  var currentDate = new Date()
  console.log(req.body)

  Video.findOne({id: req.body.videoId}, function(err, video) {
    if (err) throw err;
    if (!video) return res.send('No video found with that ID.');
    video.comments.push({
      name: req.body.name,
      text: req.body.text,
      date: currentDate
    });
    video.save(function(err) {
      if (err) throw err;
      return;
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

//delete endpoints for video and comments

app.delete('/api/deleteVideo', function(req, res){

  console.log(req.query.id);
  Video.findOneAndDelete(req.query.id, function(err, video) {
    console.log(video);
    if (err) throw err;
    if (!video) return res.send('No video found with ID');
    res.send('Video deleted!');
  })
});

app.delete('/api/deleteComment', function(req, res) {
  Video.findOne({id: req.body.id}, function(err, video) {
    if (err) throw err;
    console.log(video);
    video.comments.splice(req.body.index,1);
    video.save(function(err) {
      if (err) throw err;
      res.send('Comment deleted!');
    });
  });
});

app.get('/recent', function(req, res) {
  sortedData = JSON.parse(JSON.stringify(_DATA))
  sortedData.sort(function(a, b) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
  })
  res.render('home',{
    data: sortedData,
  });
});

app.get('/oldest', function(req, res) {
  sortedData = JSON.parse(JSON.stringify(_DATA))
  sortedData.sort(function(a, b) {
      return a.rating - b.rating;
  })
  res.render('home',{
    data: sortedData,
  });
});

app.get('/A-Z', function(req, res) {
  sortedData = JSON.parse(JSON.stringify(_DATA))
  sortedData.sort(function(a, b) {
    return (b.title > a.title)?-1 : 1 ;
});
  res.render('home',{
    data: sortedData,
  });
});

app.get('/Z-A', function(req, res) {
  sortedData = JSON.parse(JSON.stringify(_DATA))
  sortedData.sort(function(a, b) {
    return (a.title > b.title)? -1 : 1 ;
});
  res.render('home',{
    data: sortedData,
  });
});

app.get('/random', function(req, res) {


  var random = Math.floor(Math.random() * _DATA.length)
  video = _DATA[random]

  res.redirect("/v/"+video.id);
});

app.get('/about', function(req, res) {
  res.render("about");
});



server.listen(process.env.PORT || 3000, function() {
    console.log('Listening on port 3000!');
});

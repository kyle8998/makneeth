var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

var commentSchema = new mongoose.Schema({
    body: {
        type: String,
        required: true
    }
})

var videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    id: {
        type: String,
        required: true
    }
    comments: [commentSchema]
});


var feedbackSchema = new mongoose.Schema({
    rating: {
        type: Number,
        min: 0.0,
        max: 5.0,
        required: 
    }
    body: {
        type: String,
        required: true
    }
})

var Video = mongoose.model('Schema', videoSchema);
var Feedback = mongoose.model('Schema', feedbackSchema)
module.exports = {
    Video,
    Feedback
};
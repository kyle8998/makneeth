var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

var commentSchema = new mongoose.Schema({});

var commentSchema = new mongoose.Schema({
    name: {
        type: String
    },
    text: {
        type: String
    },
    date: {
        type: Date
    }
});

var videoSchema = new mongoose.Schema({
    title: {
        type: String
    },
    id: {
        type: String
    },
    date: {
        type: Date
    },
    comments: [commentSchema]
});

var feedbackSchema = new mongoose.Schema({
    rating: {
        type: Number
    },
    comment: {
        type: String
    }
});

var Video = mongoose.model('video', videoSchema);
var Feedback = mongoose.model('feedback', feedbackSchema)
module.exports = {
    Video,
    Feedback
};
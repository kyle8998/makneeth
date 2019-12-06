
const request = require('request');    

    
module.exports = {
    getTitle: function (videoId, callback) {
        request.get({
            headers: {'content-type' : 'application/x-www-form-urlencoded'},
            url:     `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YT3_API_KEY}`,
          }, function(error, response, body){
            data = JSON.parse(body)
            title = data.items[0].snippet.title
            callback(title);
          });
    }

}

# Makneeth

---

Name: Kyle Lim, Maxwell Newman, Navneeth Babra

Date: December 5th, 2019

Project Topic: Realtime video sharing and viewing platform

URL: https://makneeth.herokuapp.com/

Github: https://github.com/kyle8998/makneeth/

---


### 1. Data Format and Storage

Video Schema:
```javascript
{
  title: String,
  id: String,
  date: Date,
  comments: [commentSchema]
}
```

Comment Schema:
```javascript
{
  name: String,
  text: String,
  date: Date,
}
```

Feedback Schema:
```javascript
{
  rating: Number,
  comment: String,
}
```

**Note**

- User only provides video URL for video schema (title/thumbnail generated from YT3 data api)
- Comment Schema is a subschema for Video schema
- Rating is restricted to a number 0-10

### 2. Websockets

Socket.IO is used as a realtime synchronization tool in our video rooms. There is one global room per video with a designated host. The server listens for host's events from the youtube api (play/pause/seek) and broadcasts it to everyone else in the room. We maintain a object in `io.sockets.adapter` to keep track of the video metadata, host, room members, etc. On host leave, it autorotates host status to the next available socket. When empty, the room is destroyed. Notification of the host switch can be seen in the console.

### 3. Navigation Pages

Top Navigation Bar
1. Home -> `/`
2. Add a new video! -> `/create`
3. Add Feedback -> `/feedback`

Navigation Filters
1. Most Recent -> `/recent`
2. Least Recent -> `/oldest`
3. Alphabetical -> `/A-Z`
4. Reverse Alphabetical -> `/Z-A`
5. Random Video -> `/random`
6. About -> `/about`

1. 404 -> `/v/x` where {x} is not an active videoID

### 4. API

NAVNEETH PLEASE MAKE SURE U HAVE ALL ENDPOINTS HERE

*...In addition to the 10 endpoints above...*

HTML form route: `/create`

GET `/api/getFeedback`

POST endpoint route: `/addVideo`

Example Node.js POST request to endpoint:
```javascript
var request = require("request");

var options = {
    method: 'POST',
    url: 'https://makneeth.herokuapp.com/addVideo',
    headers: {
        'content-type': 'application/x-www-form-urlencoded'
    },
    form: {
      url: 'https://www.youtube.com/watch?v=4OrCA1OInoo',
    }
};

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);
});
```

POST endpoint route: `/api/addcomment`

```javascript
    var comment = {
      name: req.query.name,
      text: req.query.text,
      date: currentDate
    };
```

POST endpoint route: `/addFeedback`

```javascript
  var feedback = new Feedback({
    rating: req.query.rating,
    comment: req.query.comment
  });
```

DELETE endpoint route: `/deleteVideo`

```javascript
  { id: req.body.id }
```

DELETE endpoint route: `/deleteComment`

```javascript
  {
    id: req.body.id,
    index: req.body.index
  }
```

### 5. Modules

syncserver.js - Socket.io functionality for syncing video

titlegrab.js - Pulls the title of the video from youtube v3 data api

### 6. NPM Packages

request

is-object

### 7. UI

Looks good to me

### 8. Deployment

https://makneeth.herokuapp.com/

### 9. ReadMe

In README.md

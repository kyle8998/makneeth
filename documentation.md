
# Makneeth

---

Name: Kyle Lim, Maxwell Newman, Navneeth Babra

Date: December 5th, 2019

Project Topic: Realtime video sharing and viewing platform

URL: https://makneeth.herokuapp.com/

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

### 2. Add New Data

HTML form route: `/create`

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

### 3. Navigation Pages

Top Navigation Bar
1. Home -> `/`
2. Add a new video! -> `/create`
2. Add Feedback -> `/feedback`

Navigation Filters
1. Most Recent -> `/recent`
2. Least Recent -> `/oldest`
3. Alphabetical -> `/A-Z`
4. Reverse Alphabetical -> `/Z-A`
5. Random Video -> `/random`

### 4. Websockets

Socket.IO is used as a realtime synchronization tool in our video rooms. There is one global room per video with a designated host. The server listens for host's events from the youtube api (play/pause/seek) and broadcasts it to everyone else in the room. We maintain a object in `io.sockets.adapter` to keep track of the video metadata, host, room members, etc. On host leave, it autorotates host status to the next available socket. When empty, the room is destroyed.

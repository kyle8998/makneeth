var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var mongoose = require('mongoose');
var dotenv = require('dotenv');

var app = express();

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

users = [];
connections = [];
rooms = [];
userrooms = {}

dotenv.load();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static('public'));
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

// mongoose.connect(process.env.MONGODB);
// mongoose.connection.on('error', function() {
//     console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
//     process.exit(1);
// });

// cant IMPORT SHIT
// var scripts = [{ script: '/events.js' }];

app.get('/',function(req,res){
  video = {
    title: "I",
    videoId: "4OrCA1OInoo",
    thumbnail: "http://i3.ytimg.com/vi/4OrCA1OInoo/maxresdefault.jpg"
  }
  res.render('video',{
    // HARDCODED FOR NOW
    video: video,
    // scripts: scripts
  });
})

//-------------------------------------------------------------------
// SOCKETS
//-------------------------------------------------------------------

// SOCKET STUFF here
io.sockets.on('connection', function(socket) {
    // Connect Socket
    connections.push(socket);
    console.log('Connected: %s sockets connected', connections.length);

    // Set default room, if provided in url
    // socket.emit('set id', {
    //     id: given_room
    // })

    // io.sockets.emit('broadcast',{ description: connections.length + ' clients connected!'});

    // For now have it be the same room for everyone!
    //socket.join("room-"+roomno);

    //Send this event to everyone in the room.
    //io.sockets.in("room-"+roomno).emit('connectToRoom', "You are in room no. "+roomno);

    // Disconnect
    socket.on('disconnect', function(data) {

        // If socket username is found
        // if (users.indexOf(socket.username) != -1) {
        //     users.splice((users.indexOf(socket.username)), 1);
        //     updateUsernames();
        // }

        connections.splice(connections.indexOf(socket), 1);
        console.log(socket.id + ' Disconnected: %s sockets connected', connections.length);
        // console.log(io.sockets.adapter.rooms['room-' + socket.roomnum])
        // console.log(socket.roomnum)


        // HOST DISCONNECT
        // Need to check if current socket is the host of the roomnum
        // If it is the host, needs to auto assign to another socket in the room

        // Grabs room from userrooms data structure
        var id = socket.id
        var roomnum = userrooms[id]
        var room = io.sockets.adapter.rooms['room-' + roomnum]

        // If you are not the last socket to leave
        if (room !== undefined) {
            // If you are the host
            if (socket.id == room.host) {
                // Reassign
                console.log("hello i am the host " + socket.id + " and i am leaving my responsibilities to " + Object.keys(room.sockets)[0])
                io.to(Object.keys(room.sockets)[0]).emit('autoHost', {
                    roomnum: roomnum
                })
            }

            // Remove from users list
            // If socket username is found
            if (room.users.indexOf(socket.username) != -1) {
                room.users.splice((room.users.indexOf(socket.username)), 1);
                updateRoomUsers(roomnum);
            }
        }

        // Delete socket from userrooms
        delete userrooms[id]

    });

    //-------------------------------------------------------------------
  	// INIT
  	//-------------------------------------------------------------------
    socket.on('new room', function(data, callback) {
        //callback(true);
        // Roomnum passed through
        // TODO ROOMNUM WILL BE VIDEO ID
        socket.roomnum = data;

        // This stores the room data for all sockets
        userrooms[socket.id] = data

        var host = null
        var init = false

        // Adds the room to a global array
        if (!rooms.includes(socket.roomnum)) {
            rooms.push(socket.roomnum);
        }

        // Checks if the room exists or not
        // console.log(io.sockets.adapter.rooms['room-' + socket.roomnum] !== undefined)
        if (io.sockets.adapter.rooms['room-' + socket.roomnum] === undefined) {
            socket.send(socket.id)
            // Sets the first socket to join as the host
            host = socket.id
            init = true

            // Set the host on the client side
            socket.emit('setHost');
            //console.log(socket.id)
        } else {
            console.log(socket.roomnum)
            host = io.sockets.adapter.rooms['room-' + socket.roomnum].host
        }

        // Actually join the room
        console.log(socket.username + " connected to room-" + socket.roomnum)
        socket.join("room-" + socket.roomnum);

        // Sets the default values when first initializing
        if (init) {
            // Sets the host
            io.sockets.adapter.rooms['room-' + socket.roomnum].host = host
            // Default Player
            // io.sockets.adapter.rooms['room-' + socket.roomnum].currPlayer = 0
            // Default video
            // io.sockets.adapter.rooms['room-' + socket.roomnum].currVideo = {
            //     yt: 'M7lc1UVf-VE',
            //     dm: 'x26m1j4',
            //     vimeo: '76979871',
            //     html5: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
            // }
            // Previous Video
            // io.sockets.adapter.rooms['room-' + socket.roomnum].prevVideo = {
            //     yt: {
            //         id: 'M7lc1UVf-VE',
            //         time: 0
            //     },
            //     dm: {
            //         id: 'x26m1j4',
            //         time: 0
            //     },
            //     vimeo: {
            //         id: '76979871',
            //         time: 0
            //     },
            //     html5: {
            //         id: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            //         time: 0
            //     }
            // }
            // Host username
            io.sockets.adapter.rooms['room-' + socket.roomnum].hostName = socket.username
            // Keep list of online users
            io.sockets.adapter.rooms['room-' + socket.roomnum].users = [socket.username]
            // Set an empty queue
            // io.sockets.adapter.rooms['room-' + socket.roomnum].queue = {
            //     yt: [],
            //     dm: [],
            //     vimeo: [],
            //     html5: []
            // }
        }

        // Set Host label
        // io.sockets.in("room-" + socket.roomnum).emit('changeHostLabel', {
        //     username: io.sockets.adapter.rooms['room-' + socket.roomnum].hostName
        // })

        // Set Queue
        // updateQueueVideos()

        // Gets current video from room variable
        // switch (io.sockets.adapter.rooms['room-' + socket.roomnum].currPlayer) {
        //     case 0:
        //         var currVideo = io.sockets.adapter.rooms['room-' + socket.roomnum].currVideo.yt
        //         break;
        //     case 1:
        //         var currVideo = io.sockets.adapter.rooms['room-' + socket.roomnum].currVideo.dm
        //         break;
        //     case 2:
        //         var currVideo = io.sockets.adapter.rooms['room-' + socket.roomnum].currVideo.vimeo
        //         break;
        //     case 3:
        //         var currVideo = io.sockets.adapter.rooms['room-' + socket.roomnum].currVideo.html5
        //         break;
        //     default:
        //         console.log("Error invalid player id")
        // }
        // var currYT = io.sockets.adapter.rooms['room-' + socket.roomnum].currVideo.yt

        // Change the video player to current One
        // switch (io.sockets.adapter.rooms['room-' + socket.roomnum].currPlayer) {
        //     case 0:
        //         // YouTube is default so do nothing
        //         break;
        //     case 1:
        //         io.sockets.in("room-" + socket.roomnum).emit('createDaily', {});
        //         break;
        //     case 2:
        //         io.sockets.in("room-" + socket.roomnum).emit('createVimeo', {});
        //         break;
        //     case 3:
        //         io.sockets.in("room-" + socket.roomnum).emit('createHTML5', {});
        //         break;
        //     default:
        //         console.log("Error invalid player id")
        // }

        // Change the video to the current one
        // socket.emit('changeVideoClient', {
        //     videoId: currVideo
        // });

        // Get time from host which calls change time for that socket
        if (socket.id != host) {
            //socket.broadcast.to(host).emit('getTime', { id: socket.id });
            console.log("call the damn host " + host)

            // Set a timeout so the video can load before it syncs
            setTimeout(function() {
                socket.broadcast.to(host).emit('getData');
            }, 1000);
            //socket.broadcast.to(host).emit('getData');

            // Push to users in the room
            io.sockets.adapter.rooms['room-' + socket.roomnum].users.push(socket.username)

            // socket.emit('changeVideoClient', {
            //     videoId: currVideo
            // });

            // This calls back the function on the host client
            //callback(true)

            // DISABLE CONTROLS - DEPRECATED
            // socket.emit('hostControls');
        } else {
            console.log("I am the host")
            //socket.emit('auto sync');

            // Auto syncing is not working atm
            // socket.broadcast.to(host).emit('auto sync');
        }

        // Update online users
        // updateRoomUsers(socket.roomnum)

        // This is all of the rooms
        // io.sockets.adapter.rooms['room-1'].currVideo = "this is the video"
        // console.log(io.sockets.adapter.rooms['room-1']);
        callback(true)
    });

    //-------------------------------------------------------------------
  	// SOME SYNC STUFF
  	//-------------------------------------------------------------------

    // Sync video
    socket.on('sync video', function(data) {
        if (io.sockets.adapter.rooms['room-' + socket.roomnum] !== undefined) {
            var roomnum = data.room
            var currTime = data.time
            var state = data.state
            var videoId = data.videoId
            var playerId = io.sockets.adapter.rooms['room-' + roomnum].currPlayer
            // var videoId = io.sockets.adapter.rooms['room-'+roomnum].currVideo
            io.sockets.in("room-" + roomnum).emit('syncVideoClient', {
                time: currTime,
                state: state,
                videoId: videoId,
                playerId: playerId
            })
        }
    });

    // This just calls the syncHost function
    socket.on('sync host', function(data) {
        if (io.sockets.adapter.rooms['room-' + socket.roomnum] !== undefined) {
            //socket.broadcast.to(host).emit('syncVideoClient', { time: time, state: state, videoId: videoId });
            var host = io.sockets.adapter.rooms['room-' + socket.roomnum].host
            // If not host, recall it on host
            if (socket.id != host) {
                socket.broadcast.to(host).emit('getData')
            } else {
                socket.emit('syncHost')
            }
        }
    })


    //-------------------------------------------------------------------
  	// EVENT HANDLING
  	//-------------------------------------------------------------------
    // Broadcast so host doesn't continuously call it on itself!
    socket.on('play other', function(data) {
        var roomnum = data.room
        socket.broadcast.to("room-" + roomnum).emit('justPlay');
    });

    socket.on('pause other', function(data) {
        var roomnum = data.room
        socket.broadcast.to("room-" + roomnum).emit('justPause');
    });

    socket.on('seek other', function(data) {
        var roomnum = data.room
        var currTime = data.time
        socket.broadcast.to("room-" + roomnum).emit('justSeek', {
            time: currTime
        });

        // Sync up
        // host = io.sockets.adapter.rooms['room-' + roomnum].host
        // console.log("let me sync "+host)
        // socket.broadcast.to(host).emit('getData');
    });

    //-------------------------------------------------------------------
    // HOST
    //-------------------------------------------------------------------

    // Change host
    socket.on('change host', function(data) {
        if (io.sockets.adapter.rooms['room-' + socket.roomnum] !== undefined) {
            console.log(io.sockets.adapter.rooms['room-' + socket.roomnum])
            var roomnum = data.room
            var newHost = socket.id
            var currHost = io.sockets.adapter.rooms['room-' + socket.roomnum].host

            // If socket is already the host!
            if (newHost != currHost) {
                console.log("I want to be the host and my socket id is: " + newHost);
                //console.log(io.sockets.adapter.rooms['room-' + socket.roomnum])

                // Broadcast to current host and set false
                // socket.broadcast.to(currHost).emit('unSetHost')
                // Reset host
                io.sockets.adapter.rooms['room-' + socket.roomnum].host = newHost
                // Broadcast to new host and set true
                socket.emit('setHost')

                io.sockets.adapter.rooms['room-' + socket.roomnum].hostName = socket.username
                // Update host label in all sockets
                io.sockets.in("room-" + roomnum).emit('changeHostLabel', {
                    username: socket.username
                })
            }
        }
    })

    //-------------------------------------------------------------------
  	// ETC ETC
  	//-------------------------------------------------------------------

    // Update the room usernames
    function updateRoomUsers(roomnum) {
        if (io.sockets.adapter.rooms['room-' + socket.roomnum] !== undefined) {
            var roomUsers = io.sockets.adapter.rooms['room-' + socket.roomnum].users
            io.sockets.in("room-" + roomnum).emit('get users', roomUsers)
        }
    }
  })



server.listen(3000, function() {
    console.log('Listening on port 3000!');
});

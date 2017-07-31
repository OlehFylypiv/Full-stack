const express = require('express');
const app = express();

let server = require('http').createServer(app);
let io = require('socket.io')(server);

let users = {};
let connections = [];


app.get('/', (req, res, next) => {
    res.sendFile(__dirname + '/index.html');
});


io.sockets.on('connection', (socket) => {
    
    // Connection
    connections.push(socket);
    console.log('Connection: ' + connections.length + ' users');

    // Disconnection
    socket.on('disconnect', (data) => {
        
        delete users[socket.username];
        
        updateUserNames();

        connections.splice(connections.indexOf(socket), 1);
        console.log('Disconnection: remains ' + connections.length + ' users');
    });

    // Send Message
	socket.on('send message', (data, callback) => {
        
        let msg = data.trim();
        
        if (msg.substr(0, 5) === '#for ') {
            
            msg = msg.substr(5);
            
            let indexEmptySpace = msg.indexOf(' ');
            
            if (indexEmptySpace !== -1) {
                
                let name = msg.substring(0, indexEmptySpace);
                
                msg = msg.substring(indexEmptySpace + 1);
                
                if (name in users) {
                    users[name].emit('private message', {msg: msg, user: socket.username});
                }
                else {
                    callback('Error! Enter a valid username');
                }
            }
            else {
                callback('Error! Enter a privat message');
            } 
        }
        else {
            io.sockets.emit('new message', {msg: msg, user: socket.username});
        }
    });
   
    // Add new user
    socket.on('new user', (data, callback) => {
        
    	callback(true);
        
    	socket.username = data;
    	users[socket.username] = socket;
        
    	updateUserNames();
    });

    function updateUserNames() {
    	io.sockets.emit('get users', Object.keys(users));
    }
    
    socket.on('typing', (data) => {
    	socket.broadcast.emit('typing', {user: socket.username});
    });
});


server.listen(3000, () => {
	console.log('listening on *:3000');
});
const express = require('express');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use('/', (req, res) => {
    res.render('index.html');
});

server.listen(3000);

let users = {};
let messages = [];


io.sockets.on('connection', (socket) => {

    socket.on('newUser', (data, callback) => {
        if(data in users) {
            callback(false, data);
        }
        else {
            callback(true, data);
            socket.user = data;
            users[socket.user] = socket;
            updateUsers();
        }
    });

    socket.on('previousMessages', (callback) => {
        callback(messages);
    });

    socket.on('sendMessage', (data, callback) => {
        let message = data.trim();
        messages.push({message: message, user: socket.user});

        if(data.substr(0, 3) === '/w ') {
            let msg = message.substr(3);
            let idx = msg.indexOf(' ');
            if(idx !== -1) {
                let receiver = msg.substr(0, idx);
                msg = msg.substr(idx + 1);
                if(receiver in users) {
                    users[receiver].emit('privateMessage', {message: msg, user: socket.user});
                }
                else {
                    callback(`Please, enter a valid user to start a private message!`);
                }
            }
            else {
                callback(`Please, enter a valid message to start a private message!`);
            }
        }
        else {
            io.sockets.emit('newMessage', {message: data, user: socket.user});
        }
    });

    socket.on('disconnect', (data) => {
        if(!socket.user) return;
        delete users[socket.user];
        updateUsers();
    });

    function updateUsers() {
        io.sockets.emit('users', Object.keys(users));
    }
});


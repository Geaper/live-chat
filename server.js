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

let messages = [];
let users = [];

io.on('connection', socket => {
    console.log(`Socket Connected: ${socket.id}`);

    socket.emit('previousMessages', messages);

    socket.on('sendMessage', data => {
        messages.push(data);
        socket.broadcast.emit('receivedMessage', data);
    });

    socket.on('sendUser', user => {
        users.push(user);
    });

    setInterval(function() {
        socket.broadcast.emit('getUsers', users);
    }, 500);

    socket.emit('getUsers', users);
});

server.listen(3000);
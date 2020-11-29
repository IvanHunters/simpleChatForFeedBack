var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/layouts/index.html');
});
app.get('/manager', (req, res) => {
    res.sendFile(__dirname + '/layouts/manager.html');
});
var users = [];
io.on('connection', (socket) => {
    socket.on('connect-user', function(room) {
        socket.join(room);
        var usersObj = io.sockets.adapter.rooms.get('users');
        if(usersObj)
        {
            var clients = Array.from(usersObj);
            socket.to('manager').emit('manager-update', clients);
        }else{
            socket.to('manager').emit('manager-update', []);
        }
    });
    socket.on('sendUserMessage', function (messageData) {
        socket.emit('messageFromUser',
            {
                "userId": messageData.user,
                "name": "Модератор",
                "message": messageData.message
            });
        socket.to(messageData.user).emit('chat message',
            {
                "name": "Модератор",
                "message": messageData.message
            });
    });
    socket.on('chat message', function (messageData){
        socket.emit('chat message',
            {
                "name": messageData.name,
                "message": messageData.message
            });
        socket.to('manager').emit('messageFromUser',
            {
                "userId": socket.id,
                "name": socket.id,
                "message": messageData.message
            });
    })
    socket.on('disconnect', () => {
        var userId = socket.id;
        var usersObj = io.sockets.adapter.rooms.get('users');
        if(usersObj)
        {
            var clients = Array.from(usersObj);
            socket.to('manager').emit('manager-update', clients);
        }else{
            socket.to('manager').emit('manager-update', []);
        }
    });
});


http.listen(3000, () => {
    console.log('listening on *:3000');
});
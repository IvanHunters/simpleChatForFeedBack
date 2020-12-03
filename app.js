var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var dateFormat = require('dateformat');
var mysql      = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'chat',
  password : '123123',
  database : 'support_chat'
});
connection.connect();

process.env.TZ = 'Europe/Volgograd';

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/layouts/index.html');
});
app.get('/manager', (req, res) => {
    res.sendFile(__dirname + '/layouts/manager.html');
});
var users = [];
io.on('connection', (socket) => {
    socket.on('connect-user', function(room, params) {
        socket.join(room);
        if(room=="manager"){
        } else{
              connection.query('SELECT * FROM users WHERE id = \''+socket.id+'\'', function (error, results, fields) {
                if (!results[0]){
                  connection.query("INSERT INTO users SET online=1," +
                                    " id='"+socket.id+
                                    "', fio='"+params.fio+
                                    "', email='"+params.email+
                                    "', school='"+params.school+
                                    "', city='"+params.city+"'");
                }
                socket.to('manager').emit('manager-update', [socket.id], params);
              });
        }
    });
    socket.on('sendUserMessage', function (messageData) {
        connection.query("INSERT INTO messages SET recipient='"+
            messageData.user+
            "', sender='manager', message='"+
            messageData.message+"', date='"+
            dateFormat(new Date(), 'h:MM:ss    |    d.m.yyyy')+
            "'");
        socket.emit('messageFromUser',
            {
                "userId": messageData.user,
                "name": "Модератор",
                "message": messageData.message,
                "date": dateFormat(new Date(), 'h:MM:ss    |    d.m.yyyy')
            });
        socket.to(messageData.user).emit('chat message',
            {
                "name": "Модератор",
                "message": messageData.message,
                "date": dateFormat(new Date(), 'h:MM:ss    |    d.m.yyyy')
            });
    });
    socket.on('chat message', function (messageData){
        connection.query("INSERT INTO messages SET sender='"+socket.id+
            "', recipient='manager', message='"+
            messageData.message+"', date='"+
            dateFormat(new Date(), 'h:MM:ss    |    d.m.yyyy')+
            "'");
        socket.emit('chat message',
            {
                "name": messageData.name,
                "message": messageData.message,
                "date": dateFormat(new Date(), 'h:MM:ss    |    d.m.yyyy')
            });
        socket.to('manager').emit('messageFromUser',
            {
                "userId": socket.id,
                "name": socket.id,
                "message": messageData.message,
                "date": dateFormat(new Date(), 'h:MM:ss    |    d.m.yyyy')
            });
    })
    socket.on('disconnect', () => {
        var userId = socket.id;
        connection.query("UPDATE users SET online=0 " +
                          "WHERE id = '"+userId+"'");
    });
});


http.listen(3000, () => {
    console.log('listening on *:3000');
});

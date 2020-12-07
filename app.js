var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var dateFormat = require('dateformat');
const Sequelize = require('sequelize');
var sequelize = new Sequelize('support_chat', 'chat', '123123', {
    dialect: 'mariadb'
});

const start = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

start();



process.env.TZ = 'Europe/Volgograd';
app.set('view engine', 'ejs');
let usersData = [];

async function handleMessage(data){
    let messages = await sequelize.query('SELECT * FROM messages WHERE sender = \'' +
        data.id + '\' or recipient = \'' + data.id +
        "'", { type: sequelize.QueryTypes.SELECT});
    usersData.push({ info: { id: data.id, fio: data.fio, school: data.school, city: data.city, email: data.email}, messages: messages});
}

app.get('/', (req, res) => {
    res.render('index');
});
app.get('/manager', async (req, res) => {
    usersData = [];
    let users = await sequelize.query('SELECT * FROM users ORDER BY created DESC LIMIT 50', { type: sequelize.QueryTypes.SELECT});
    for (const item of users) {
        await handleMessage(item);
    }
    res.render('manager', {data: usersData});
});

var users = [];
io.on('connection', (socket) => {
    socket.on('connect-user', async function(room, params) {
        socket.join(room);
        if(room=="manager"){
        } else{
            let userData = await sequelize.query('SELECT * FROM users WHERE id = \''+socket.id+'\'', { type: sequelize.QueryTypes.SELECT});
                if (!userData[0]){
                    sequelize.query("INSERT INTO users SET online=1," +
                                    " id='"+socket.id+
                                    "', fio='"+params.fio+
                                    "', email='"+params.email+
                                    "', school='"+params.school+
                                    "', city='"+params.city+"'");
                }
                socket.to('manager').emit('manager-update', [socket.id], params);
        }
    });
    socket.on('sendUserMessage', function (messageData) {
        sequelize.query("INSERT INTO messages SET recipient='"+
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
        sequelize.query("INSERT INTO messages SET sender='"+socket.id+
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
        sequelize.query("UPDATE users SET online=0 " +
                          "WHERE id = '"+userId+"'");
    });
});


http.listen(3000, () => {
    console.log('listening on *:3000');
});

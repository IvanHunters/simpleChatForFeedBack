var app = require('express')();
var http = require('http').createServer(app);
const fileUpload = require('express-fileupload');
const serve   = require('express-static');
var session = require('express-session');

var io = require('socket.io')(http);

var dateFormat = require('dateformat');
const Sequelize = require('sequelize');
var sequelize = new Sequelize('support_chat', 'chat', '123123', {
    dialect: 'mariadb'
});
var bodyParser = require('body-parser');
var md5 = require('md5');
const fs = require('fs')

const start = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

start();

app.use(fileUpload({
    createParentPath: true
}));



process.env.TZ = 'Europe/Volgograd';
app.set('view engine', 'ejs');

var sess = {
    secret: 'keyboard cat',
    cookie: {}
}

if (app.get('env') === 'production') {
    app.set('trust proxy', 1) // trust first proxy
    sess.cookie.secure = true // serve secure cookies
}

app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())

app.use(session(sess));
app.use('/static', serve(__dirname + '/static'));
app.use('/uploads', serve(__dirname + '/uploads'));

let usersData = [];

async function handleMessage(data){
    let messages = await sequelize.query('SELECT * FROM messages WHERE sender = \'' +
        data.id + '\' or recipient = \'' + data.id +
        "'", { type: sequelize.QueryTypes.SELECT});
    usersData.push({ info: { id: data.id, name: data.name, school: data.school, phone: data.phone, email: data.email}, messages: messages});
}

app.get('/', async (req, res) => {
    res.render('index', {data: usersData});
});

app.post('/upload', async (req, res) => {
    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            let file = req.files.file;
            let accessExt = ['image/svg+xml'];
            if (accessExt.indexOf(file.mimetype) != -1) {
                let filename = md5(
                    Math.floor(Math.random() * Math.floor(150))
                    + Math.floor(Math.random() * Math.floor(150))
                    )
                    + "/"
                    + file.name.replace(" ", "");

                file.mv('./uploads/' + filename);

                res.send({
                    status: true,
                    message: 'Файл успешно загружен',
                    data: {
                        url: "/uploads/" + filename
                    }
                });
            }else{
                res.send({
                    status: false,
                    message: "Такое расширение файла не разрешено " + file.mimetype
                });
            }
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/', async (req, res) => {
    let request = req.body;

    if (request.name)
    {
        var access_token = md5( Math.floor(Math.random() * Math.floor(100000)) + dateFormat(new Date(), 'h:MM:ss    |    d.m.yyyy') + Math.floor(Math.random() * Math.floor(100000)));
        console.log(access_token);
        if(!request.name) {
            res.end('Name not found');
        }
        if(!request.email){
            request.email = "";
        }
        if(!request.school){
            request.school = "";
        }
        if(!request.phone){
            request.phone = "";
        }
        let newUser = await sequelize.query("INSERT INTO users_token SET " +
            "username='"+request.name+
            "', email='"+request.email+
            "', school='"+request.school.toString()+
            "', phone='"+request.phone.toString()+
            "', access_token='"+access_token+"'");
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({access_token: access_token}));
    } else {
        //res.render('auth-user', {error: "Неверный логин или пароль"});
    }
});

app.get('/manager', async (req, res) => {
    if (req.session.moderator) {
        usersData = [];
        let users = await sequelize.query('SELECT * FROM users ORDER BY created DESC LIMIT 50', { type: sequelize.QueryTypes.SELECT});
        for (const item of users) {
            await handleMessage(item);
        }
        res.render('manager', {data: usersData});
    } else {
        res.render('auth', {error: false});
    }
});

app.post('/manager', async (req, res) => {
    let request = req.body;
    if (request.username == 'moderator' && request.password == 'FyJ5h463')
    {
        req.session.moderator = 1;
        usersData = [];
        let users = await sequelize.query('SELECT * FROM users ORDER BY created DESC LIMIT 50', { type: sequelize.QueryTypes.SELECT});
        for (const item of users) {
            await handleMessage(item);
        }
        res.render('manager', {data: usersData});
    } else {
        res.render('auth', {error: "Неверный логин или пароль"});
    }
});

var users = [];
var basket = {};
io.on('connection', (socket) => {
    socket.on('connect-user', async function(room, params) {
        if(room == 'users' || (room == "manager" && params.password == 'FyJ5h463'))
            socket.join(room);
        if(room=="manager"){
        } else {
            let userToken = await sequelize.query('SELECT * FROM users_token WHERE access_token = \''+params.access_token+'\'', { type: sequelize.QueryTypes.SELECT});
            if (userToken[0]) {
                    if (!userToken[0].socket_id) {
                        socket.userId = socket.id;
                        sequelize.query("INSERT INTO users SET online=1," +
                            " id='" + socket.id +
                            "', name='" + userToken[0].username +
                            "', email='" + userToken[0].email +
                            "', school='" + userToken[0].school +
                            "', phone='" + userToken[0].phone + "'");
                        sequelize.query("UPDATE users_token SET socket_id='"+socket.id+"' WHERE id = '"+userToken[0]['id']+"'");
                        userToken[0].name = userToken[0].username;
                        basket[socket.id] = socket.id;
                        socket.to('manager').emit('manager-update', [socket.id], userToken[0]);
                    }else{
                        let oldUserId = await sequelize.query('SELECT * FROM users WHERE email = \''+userToken[0].email+'\'', { type: sequelize.QueryTypes.SELECT});
                        basket[oldUserId[0]['id']] = socket.id;
                        socket.userId = oldUserId[0]['id'];
                    }
            }
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
        socket.to(basket[messageData.user]).emit('chat message',
            {
                "name": "Модератор",
                "message": messageData.message,
                "date": dateFormat(new Date(), 'h:MM:ss    |    d.m.yyyy')
            });
    });
    socket.on('chat message', function (messageData){
        sequelize.query("INSERT INTO messages SET sender='"+socket.userId+
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
                "userId": socket.userId,
                "name": socket.id,
                "message": messageData.message,
                "date": dateFormat(new Date(), 'h:MM:ss    |    d.m.yyyy')
            });
    })
    socket.on('disconnect', () => {
        var userId = socket.userId;
        sequelize.query("UPDATE users SET online=0 " +
                          "WHERE id = '"+userId+"'");
    });
});


http.listen(3000, () => {
    console.log('listening on *:3000');
});

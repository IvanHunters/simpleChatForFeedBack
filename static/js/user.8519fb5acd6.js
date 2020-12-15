function validateEmail($email) {
    var emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
    return emailReg.test( $email );
}

$(function () {
    var socket = io();
    if (localStorage.token) {
        socket.emit('connect-user', 'users', {
            "access_token": localStorage.token
        });
        $('.m-0').fadeOut();
        $('.container-fluid').fadeIn();
        $('.answer-add').keypress(function(event){
            var keycode = (event.keyCode ? event.keyCode : event.which);
            if(keycode == '13'){
                socket.emit('chat message', {
                    "name": "Вы",
                    "message": $('.answer-add > input').val()
                });
                $('.answer-add > input').val('');
            }
        });
        socket.on('chat message', function(msg){

            if (msg.message.search('&42file&42:') !== -1) {
                msg.message = '<a target="_blank" class="msg-link" href="'+msg.message.replace('&42file&42:', '')+'"><b>Файл</b></a>';
            }
            if(msg.name == 'Модератор'){
                $('#chat-messages').append(
                    '<div class="answer left"><div class="avatar"><img src="https://ptetutorials.com/images/user-profile.png" alt="User name"></div> <div class="name">Модератор</div> <div class="text">'
                    +msg.message
                    +'</div><div class="time">'+msg.date+'</div></div>'
                );
            } else {
                $('#chat-messages').append(
                    '<div class="answer right"> <div class="avatar"> </div> <div class="name">Вы</div> <div class="text">'
                    +msg.message
                    +'</div> <div class="time">'+msg.date+'</div> </div>'
                );
            }
            $(".chat-body").animate({ scrollTop: $('.chat-body').prop("scrollHeight")}, 1000);
        });
        $('#file').on("change", function(e) {
            var file_data = $(this).prop('files')[0];
            var file_link = $(this);
            var form_data = new FormData();
            form_data.append('file', file_data);

            $.ajax({
                type: "POST",
                url: "/upload",
                enctype: 'multipart/form-data',
                contentType: false,
                processData: false,
                data: form_data,
                success: function (res) {
                    let status = res.status;
                    if(status) {
                        let upload_url = res.data.url;
                        file_link.val(null);
                        socket.emit('chat message', {
                            "name": "Вы",
                            "message": "&42file&42:"+upload_url
                        });
                    } else {
                        alert('Ошибка загрузки файла');
                    }
                }
            });
        });
    }
    $('#form-auth').submit(function (ev) {
        var name = $("#name").val();
        var phone = $("#phone").val();
        var school = $("#school").val();
        var email = $("#email").val();
        var pd = $('#pd').is(":checked");
        if(name != '' && pd) {
            $('.modal').modal('hide');
            var datastring = {
                "name": name,
                "phone": phone,
                "school": school,
                "email": email
            };
            $.post( "/", datastring).done(function( data ) {
                let token = data.access_token;
                localStorage.token = token;

                socket.emit('connect-user', 'users', {
                    "access_token": token
                });
                $('.m-0').fadeOut();
                $('.container-fluid').fadeIn();
                $('.answer-add').keypress(function(event){
                    var keycode = (event.keyCode ? event.keyCode : event.which);
                    if(keycode == '13'){
                        socket.emit('chat message', {
                            "name": "Вы",
                            "message": $('.answer-add > input').val()
                        });
                        $('.answer-add > input').val('');
                    }
                });
                socket.on('chat message', function(msg){
                    if(msg.name == 'Модератор'){
                        $('#chat-messages').append(
                            '<div class="answer left"><div class="avatar"><img src="https://ptetutorials.com/images/user-profile.png" alt="User name"></div> <div class="name">Модератор</div> <div class="text">'+msg.message+'</div><div class="time">'+msg.date+'</div></div>'
                        );
                    } else {
                        $('#chat-messages').append(
                            '<div class="answer right"> <div class="avatar"> </div> <div class="name">Вы</div> <div class="text">'+msg.message+'</div> <div class="time">'+msg.date+'</div> </div>'
                        );
                    }
                    $(".chat-body").animate({ scrollTop: $('.chat-body').prop("scrollHeight")}, 1000);
                });
            });
        }
        ev.preventDefault();
    });
});
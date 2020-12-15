 function in_array(needle, haystack, strict) {

    var found = false, key, strict = !!strict;

    for (key in haystack) {
    if ((strict && haystack[key] === needle) || (!strict && haystack[key] == needle)) {
    found = true;
    break;
}
}
    return found;
}

    var socket = io();
    socket.emit('connect-user', 'manager', {password: 'FyJ5h463'});
        socket.on('messageFromUser', function (userData){
            var date = userData.date;
            var textToPreview = userData.message;
            if (userData.message.search('&42file&42:') !== -1) {
    textToPreview = "Файл";
    userData.message = '<a class="msg-link" target="_blank" href="'+userData.message.replace('&42file&42:', '')+'"><b>Файл</b></a>';
}
if (userData.name == 'Модератор') {
    $('[date-last-message-user="'+userData.userId+'"]').text('Вы: ' + textToPreview);
    $('[data-history="' + userData.userId + '"] > .msg_history').append('<div class="outgoing_msg"><div class="sent_msg"><p>'+userData.message+'</p><span class="time_date">'+date+'</span> </div></div>');
}else {
    $('[date-last-message-user="'+userData.userId+'"]').text(textToPreview);
    $('[data-history="' + userData.userId + '"] > .msg_history').append('<div class="incoming_msg"> <div class="incoming_msg_img"> <img src="https://ptetutorials.com/images/user-profile.png" alt="sunil"> </div> <div class="received_msg"> <div class="received_withd_msg"> <p>'+userData.message+'</p> <span class="time_date">'+date+'</span></div> </div> </div>');
}
if(!$('#' + userData.userId).hasClass('active_chat')){
    $('[data-non-read-user="'+userData.userId+'"]').addClass("new_message");
}
$('[date-time-user="'+userData.userId+'"]').text(date);
$('[data-history="'+userData.userId+'"] > .msg_history').animate({ scrollTop: $('[data-history="'+userData.userId+'"] > .msg_history').prop("scrollHeight")}, 1000);
});
socket.on('manager-update', function(users, props){
    users.forEach(function (user) {
        if(!in_array(user, window.users_dynamic)){
            $('#users').prepend(
                '<div class="chat_list" id='+user+'>' +
                '<div class="chat_people">' +
                '<div class="chat_img"> <img src="https://ptetutorials.com/images/user-profile.png" alt="sunil"> </div>' +
                '<div class="chat_ib">' +
                '<h5  data-non-read-user="'+user+'">'+props.name+'<span class="chat_date" date-time-user="'+user+'">date</span></h5>' +
                '<p date-last-message-user="'+user+'"></p>' +
                '</div>' +
                '</div>' +
                '</div>');

            $('.inbox_msg').append(
                '<div class="mesgs d-none" data-history="'+user+'"><div class="nav-info">Телефон: '+props.phone+', Школа: '+props.school+' Email: '+props.email+'</div><div class="msg_history"></div><div class="type_msg"><div class="input_msg_write"><input type="text" class="write_msg" data-message-user="'+user+'" placeholder="Type a message" /><button class="msg_send_btn" data-send-user="'+user+'" type="button"><i class="fa fa-paper-plane-o" aria-hidden="true"></i></button></div></div></div>'
            );
            window.users_dynamic.push(user);
            $('[data-send-user="'+user+'"]').on("click", function (){
                var userId = $(this).attr('data-send-user');
                var textMessage = $('[data-message-user="' + userId + '"]').val();
                $('[data-message-user="' + userId + '"]').val('');
                socket.emit('sendUserMessage', {"user": userId, "message": textMessage});
            });
            $('[data-message-user="'+user+'"]').keypress(function(event){
                var keycode = (event.keyCode ? event.keyCode : event.which);
                if(keycode == '13'){
                    var userId = $(this).attr('data-message-user');
                    var textMessage = $(this).val();
                    $(this).val('');
                    socket.emit('sendUserMessage', {"user": userId, "message": textMessage});
                }
            });

            $('#' + user).on("click", function (){
                var userId = $(this).attr('id');
                $('.mesgs').addClass('d-none');
                $('.chat_list').removeClass('active_chat');
                $('[data-non-read-user="' + userId + '"]').removeClass("new_message");
                $('#' + userId).addClass('active_chat');
                $('[data-history="'+userId+'"]').removeClass('d-none');
            });
        }
    });
});
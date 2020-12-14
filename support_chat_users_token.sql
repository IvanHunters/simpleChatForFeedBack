create table users_token
(
    id           int auto_increment
        primary key,
    username     varchar(255) null,
    school       varchar(255) null,
    phone        varchar(15)  null,
    access_token varchar(255) null,
    email        varchar(255) null,
    socket_id    varchar(255) null
);

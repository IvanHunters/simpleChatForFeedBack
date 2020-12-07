create table messages
(
    id        int auto_increment
        primary key,
    sender    char(250) null,
    recipient char(255) null,
    message   char(255) null,
    date      char(255) null
);
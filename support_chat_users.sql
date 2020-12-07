create table users
(
    id      char(25)                            null,
    fio     char(255)                           null,
    school  text                                null,
    city    char(255)                           null,
    email   char(255)                           null,
    online  int       default 0                 null,
    created timestamp default CURRENT_TIMESTAMP not null,
    constraint users_id_uindex
        unique (id)
);
create table users
(
    id      char(25)                            null,
    name    char(255)                           null,
    school  text                                null,
    phone   char(255)                           null,
    email   char(255)                           null,
    online  int       default 0                 null,
    created timestamp default CURRENT_TIMESTAMP not null,
    constraint users_id_uindex
        unique (id)
);
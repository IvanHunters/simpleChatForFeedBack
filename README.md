# socketio-docker

Docker image for socket.io

## Usage
```
ssh
> docker build -f Dockerfile -t socket .
```

```
ssh
> docker run -it -v /path/to/simpleChatForFeedBack/:/app -p 3000:3000 socket sh
```

## Web-Show

localhost:3000/ - user
localhost:3000/manager - manager

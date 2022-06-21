const io = require('socket.io')(3001, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    }
});

io.on("connection", socket => {
    socket.on('get-document', documentId => {
        const data = ""
        socket.join(documentId) //loading from specified document by joining
        socket.emit('load-document', data) //emits data to be received by client
        socket.on('send-changes', delta => {
            socket.broadcast.to(documentId).emit("receive-changes", delta); //To specified Document only
            console.log(delta)
        }) //Emits changes
    }) // Loading document
    console.log("connected")
}) 
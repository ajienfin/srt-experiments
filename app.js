const child_process = require('child_process'); // To be used later for running FFmpeg
const express = require('express');
const http = require('http');
const WebSocketServer = require('ws').Server;
const fs = require('fs')
const path = require('path')

const app = express();

var options = {
    key: fs.readFileSync(path.join('certs', 'key.pem')),
    cert: fs.readFileSync(path.join('certs', 'crt.pem'))
}
const server = http.createServer(options, app).listen(3000, () => {
    console.log('Listening...3000');
});

app.use(express.static(__dirname + '/public'));
const io = require('socket.io')(server)
const ffmpeg = child_process.spawn('ffmpeg', [
    '-i', '-',
    '-vcodec', 'copy',
    '-strict', '-2', '-f', 'mpegts',
    "udp://127.0.0.1:1234?pkt_size=1316"
]);

ffmpeg.on('close', (code, signal) => {
    console.log('ffmpeg closed')
})
ffmpeg.stdin.on('error', (e) => {
    console.log('FFmpeg STDIN Error', e);
});
ffmpeg.stderr.on('data', (data) => {
    console.log('FFmpeg data:', data.toString());
});

io.on('connection', (socket) => {
    console.log('A user Connected')
    socket.emit('user-connected', {});
    socket.on('disconnect', () => {
        console.log('user-disconnect');
    });
    socket.on('canvas-data', (msg) => {
        ffmpeg.stdin.write(msg.d);
    })
    socket.on('canvas-data-stoped', (msg) => {
        console.log('canvas-data-stoped', msg)
        ffmpeg.kill('SIGINT');
    })
})
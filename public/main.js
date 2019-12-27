let socket
let mediaRecorder
let online = false
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('[data-action="stopStreaming"]').addEventListener('click', stopStreaming)
    document.querySelector('[data-action="start-capture"]').addEventListener('click', getDisplay)
    document.querySelector('[data-action="goLive"]').addEventListener('click', (e) => {
        console.log('listening')
        online = !online
        if(online) startStreaming()
        else stopStreaming()

    });
    socket = io.connect({ transports: ['websocket'] })
    socket.on('user-connected', () => {
        console.log('+ve ACKED')
    })
});

let displayStream
let displayTracks
const getDisplay = async () => {
    try {
        displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        const videoEl = document.getElementById('media')
        videoEl.srcObject = displayStream
        displayTracks = displayStream.getVideoTracks()[0]
        displayTracks.onended = () => {
            stopStreaming()
            videoEl.srcObject = null
            videoEl.poster = 'https://ak9.picdn.net/shutterstock/videos/1012154399/thumb/11.jpg'
        }
    }
    catch (e) {
        alert('Something went wrong!.')
        console.log(e.message)
        console.error(e);
    }
}

const startStreaming = ()=>{
    if (displayStream == undefined) return
    mediaStream = displayStream; // 30 FPS
    mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=h264',
        videoBitsPerSecond: 3 * 1024 * 1024
    });

    mediaRecorder.addEventListener('dataavailable', (e) => {
        socket.emit('canvas-data', {d:e.data});
    });

    mediaRecorder.addEventListener('stop', ()=>{
        socket.emit('canvas-data-stoped');
        mediaRecorder = undefined
    });

    mediaRecorder.start(1000); 
}

const stopStreaming = (event) =>{
    console.log('startStreaming')
    if (mediaRecorder == undefined) return
    mediaRecorder.stop(); 
    let ev = new Event('stop')
    mediaRecorder.dispatchEvent(ev)
}
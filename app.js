const {spawn} = require('child_process');
const express = require('express');
const bodyParser = require('body-parser');
const {WebSocketServer} = require('ws');
const tty = require('tty');
const fs = require('fs');
const app = express();
const process = require('process');
const port = 3000;
// const host = '172.25.195.185';
const host = '127.0.0.1';

app.use(bodyParser.json());

let commandQueue = new Map();
let currentChildProcess = null;
let clients = new Map();

function startNextProcess(user) {
    if (commandQueue.get(user)?.length > 0 && !currentChildProcess) {
        // console.log('process');
        const command = commandQueue.get(user).shift();
        // console.log(command);
        const baseCommand = "cd '/mnt/c/Users/Shubhranshu Sanjeev/My Documents/NodePlayground'";
        const fullCommand = `${baseCommand} && ${command}`;

        currentChildProcess = spawn(fullCommand, {shell: true});
        
        let stdoutData = '';
        let stderrData = '';

        currentChildProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
            // console.log('stdout: ',data)
            clients.get(user).send(stdoutData);
        });

        currentChildProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
            clients.get(user).send(stderrData);
        });
        
        currentChildProcess.on('close', (code) => {
           console.log(`child process exited with code ${code}`);
           console.log(`stdout: ${stdoutData}`);
           console.log(`stderr: ${stderrData}`);
            currentChildProcess = null;
            startNextProcess();
        });
    }
}


const server = app.listen({port:port,host:host}, () => {
    console.log(`Server started at http://${host}:${port}`);
});
const wss = new WebSocketServer(
    {
        server:server,
        clientTracking: true,
        maxReceivedFrameSize: 2048000,  
        maxReceivedMessageSize: 2048000
    }
);
app.get('/video', (req, res) => {
    const videoPath = './video.mp4';
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    console.log('video required');
    const range = req.headers.range;
    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };

        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
    }
})
function messageHandler(message) {
    // console.log(`Received message => ${message}`);
    const json = JSON.parse(message.toString()); 
    const command = json.command;
    if(json.type==='start'){
        clients.set(json.user, this);
        // console.log(clients.get(json.user));
        commandQueue.set(json.user,[command]);
        startNextProcess(json.user);
    }else{
        // currentPty.write(command+'\n');
       // console.log(command);
       // process.stdin.write(command+"\n");
       // process.stdin.end();
        currentChildProcess.stdin.write(command);
        currentChildProcess.stdin.write('\n');
    }

    this.send('Command received');
}

wss.on('connection', (ws) => {
    ws.on('message', messageHandler);
    ws.send('Hello! Message From Server!!');
});

const {spawn} = require('child_process');
const express = require('express');
const bodyParser = require('body-parser');
const {WebSocketServer} = require('ws');
const tty = require('tty');
const pty = require('node-pty');
const app = express();
const process = require('process');
const port = 3000;
const host = '127.0.0.1';

app.use(bodyParser.json());

let commandQueue = [];
let currentChildProcess = null;
let clients = [];
let currentPty = null;

function startNextProcess() {
    if (commandQueue.length > 0 && !currentChildProcess) {
        //currentPty = tty.open();
        //currentPty.on('data', (data) => {
          //  clients.forEach((client) => {
            //    client.send(data);
           // });
        //});
        //

        const command = commandQueue.shift();
        const baseCommand = "cd '/mnt/c/Users/Shubhranshu Sanjeev/My Documents/NodePlayground'";
        const fullCommand = `${baseCommand} && ${command}`;

        currentChildProcess = spawn(fullCommand, {shell: true,stdio:"overlapped"});
        
        let stdoutData = '';
        let stderrData = '';

        currentChildProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
            clients.forEach((client) => {
                client.send(stdoutData);
            });
        });

        currentChildProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
            clients.forEach((client) => {
                client.send(stderrData);
            });
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

app.post('/command', (req,res)=>{
    const command = req.body.command;
    commandQueue.push(command);
    
    if(!currentChildProcess){
        startNextProcess();
    }
    res.status(200).send('Command received');
});

const server = app.listen({port:port,host:host}, () => {
    console.log(`Server started at http://localhost:${port}`);
});
const wss = new WebSocketServer({server:server,clientTracking: true});

function messageHandler(message) {
    //console.log(`Received message => ${message}`);
    const json = JSON.parse(message.toString()); 
    const command = json.command;
    if(json.type==='start'){
        commandQueue.push(command);
        startNextProcess();
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
    clients.push(ws);
    ws.on('message', messageHandler);
    ws.send('Hello! Message From Server!!');
});

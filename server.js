const {exec} = require('child_process');
const express = require('express'); 
const bodyParser = require('body-parser');
const { Worker } = require('worker_threads');

const app = express();  
const port = 3000;
const host = '127.0.0.1'; //localhost
app.get('/', (req, res) => {
//write code to execute the terminal command
    //command will be given in the request body
    //i want to use workder threads for multi threading
    
    
    let command = req.query.command;
    console.log(req.query);
    //rewrite the code below with worker threads
        //access workerData from here

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            res.send(stdout);
        });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

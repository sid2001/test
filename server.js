const {exec} = require('child_process');
const express = require('express'); 
const bodyParser = require('body-parser');
const { Worker } = require('worker_threads');
const {stdin:input, stdout:output} = require('process');
const readline = require('readline');
const app = express();  
const port = 3000;
const host = '127.0.0.1'; //localhost
const fs   = require('fs');

const file = fs.readFileSync('app.js', 'utf8');
console.log(file);

app.get('/', (req, res) => {
    
    
    let command = req.query.command;
    console.log(req.query);
    //rewrite the code below with worker threads
        //access workerData from here
    const baseCommand = "cd '/mnt/c/Users/Shubhranshu Sanjeev/My Documents/NodePlayground'";
        exec(baseCommand+" && "+ command , (error, stdout, stderr) => {
            const rl = readline.createInterface({ input, output });
            if (error) {
                console.error(`exec error: ${error}`);
                //send all possible errors in form of json including stderr and system errors
                //
                res.json({input:input,output:output,error: error, stderr: stderr,stdout: stdout});
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            res.json({stdout: stdout, stderr: stderr,input:input,output:output});
        });
});

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

// const {createSecureServer} = require('http2');
// const {readFileSync} = require('fs');
// const {resolve} = require('path');
// const express = require('express');
// const mongo = require('mongodb');

// let app = express();

// const client = new mongo.MongoClient('mongodb://localhost:27017');
// const db = client.db();
// const collection = db.collection('users');
// collection.createIndexes()

// app.use((request, response, next) => {
//     response.header('Access-Control-Allow-Origin', '*');
//     response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, X-Custom-Header, Accept, Authorization');
//     response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//     response.header('Access-Control-Allow-Credentials', true);
//     response.header('Access-Control-Max-Age', '86400');
//     next();
// })
// app.use('/page', express.static(resolve(__dirname, './public')));

// app.all('/', (req, res) => {
    
// })


// app.listen(4000, () => {
//     console.log('server started');
// })


// http2
// let server = createSecureServer({key: readFileSync(resolve('temp/localhost.key')), cert: readFileSync(resolve('temp/localhost.crt'))});
// server.on('stream', (s, h, f) => {
//     if(h[':path']='/') {
//         // s.pushStream({':path': 'abc.txt'}, (e,st) => {
//         //     if(e) throw e;
//         //     st.respondWithFile(resolve(__dirname,'./abc.txt'),{'content-type': 'text/txt; charset=utf-8'}, {statCheck: (st, sh,so)=>{console.log(st, sh,so)}, onError:(e)=>console.log})
//         //     st.end();
//         // });
//         // s.pushStream({':path': 'bcd.txt'}, (e,st) => {
//         //     if(e) throw e;
//         //     st.respondWithFile(resolve(__dirname,'./bcd.txt'),{'content-type': 'text/txt; charset=utf-8'}, {statCheck: (st, sh,so)=>{console.log(st, sh,so)}, onError:(e)=>console.log})
//         //     st.end();
//         // });
//         s.respond({
//             'content-type': 'text/html; charset=utf-8',
//             ':status': 200,
//         });
//         s.end('<h1>Hello World</h1>');
//     } else {
//         s.respond({
//             ':status': 404,
//         });
//         s.end();
//     }
// });

// server.listen(4000, 'localhost', ()=> {
//     console.log('server started on port 4000');
// })

const { machineIdSync } = require('node-machine-id');
const { threadId } = require('worker_threads');

function getMachineId() {
    const mi = machineIdSync({original: true}).toLocaleLowerCase();
    const mib36 = BigInt(`0x${mi.replaceAll(/[^a-f0-9]/g, '')}`).toString(36);
    let mib36len = mib36.length;
    if(mib36len % 2 !== 0) mib36.padEnd(mib36len + 1, '0');
    else mib36len--;

    let machineIdHash = '';
    while(mib36len >= 0) {
        let num = `${parseInt(mib36.substring(mib36len-1, mib36len+1), 36)}`;
        let ds = 0, numLen = num.length - 1;
        while(numLen >= 0) {
            ds += parseInt(num[numLen--], 10);
        }
        machineIdHash += ds.toString(36);
        mib36len -= 2;
    }
    return machineIdHash;
}

const generateRandomId = (() => {
    const machineId = getMachineId();
    let cyclicCharCounter = 0;
    return (prefix = '') => {
        const timeStampHash = Date.now().toString(36);
        const randomHash = Math.random().toString(36).substring(2);
        let id = (`${machineId}-${timeStampHash}-${cyclicCharCounter.toString(36)}-${randomHash}`).slice(0, 32);
        cyclicCharCounter = cyclicCharCounter < 46655 ? cyclicCharCounter + 1 : 0; // Reset after 'zzz'
        let il = 32 - id.length;
        
        while(il>0) {
            id += Math.random().toString(36).substring(2);
            id = id.slice(0, 32);
            il = 32 - id.length;
        }

        return `${prefix}${id}`;
    };
})();

console.log(generateRandomId());
console.log(generateRandomId('user-'));
console.time('generateRandomId');
for(let i = 0; i < 600; i++) {
    generateRandomId();
}
console.timeEnd('generateRandomId');

console.log('thread id', threadId);
console.log('process id', process.pid);

const {createSecureServer} = require('http2');
const {readFileSync} = require('fs');
const {resolve} = require('path');
// let app = require('express')();
// app.use((req,response, next) => {
//     response.header('Access-Control-Allow-Origin', '*');
//     response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, X-Custom-Header, Accept, Authorization');
//     response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//     response.header('Access-Control-Allow-Credentials', true);
//     response.header('Access-Control-Max-Age', '86400');
//     next();
// })
// app.get('/', (req, res) => {
//     res.json({a:'a'})
// })
// app.listen(4000, () => {
//     console.log('server started');
// })

let server = createSecureServer({key: readFileSync(resolve('temp/localhost.key')),cert: readFileSync(resolve('temp/localhost.crt'))});
server.on('stream', (s, h, f) => {
    if(h[':path']='/') {
        // s.pushStream({':path': 'abc.txt'}, (e,st) => {
        //     if(e) throw e;
        //     st.respondWithFile(resolve(__dirname,'./abc.txt'),{'content-type': 'text/txt; charset=utf-8'}, {statCheck: (st, sh,so)=>{console.log(st, sh,so)}, onError:(e)=>console.log})
        //     st.end();
        // });
        // s.pushStream({':path': 'bcd.txt'}, (e,st) => {
        //     if(e) throw e;
        //     st.respondWithFile(resolve(__dirname,'./bcd.txt'),{'content-type': 'text/txt; charset=utf-8'}, {statCheck: (st, sh,so)=>{console.log(st, sh,so)}, onError:(e)=>console.log})
        //     st.end();
        // });
        s.respond({
            'content-type': 'text/html; charset=utf-8',
            ':status': 200,
        });
        s.end('<h1>Hello World</h1>');
    } else {
        s.respond({
            ':status': 404,
        });
        s.end();
    }
});
server.listen(4000, 'localhost', ()=> {
    console.log('server started on port 4000');
})

// let xhr = new XMLHttpRequest()

// xhr.addEventListener('readystatechange', (ev) => {
//     console.log(ev);
//     if(xhr.readyState == 4) {
//         fetch('http://localhost:4000/').then(v=>{
//             console.log(v);
//         }).catch(e=>{
//             console.log(e);
//         })
//     }
// });

// console.log('UNSENT', xhr.readyState); // readyState will be 0

// xhr.open('GET', 'http://localhost:4000/', true);

// console.log('OPENED', xhr.readyState); // readyState will be 1

// xhr.addEventListener('progress',(ev) => {
//     console.log(ev);
//     console.log('LOADING', xhr.readyState); // readyState will be 3
// });

// xhr.addEventListener('load',(ev) => {
//     console.log(ev);
//     console.log('DONE', xhr.readyState); // readyState will be 4
//     console.log(xhr);
// });

fetch('https://localhost:4000/', {
    method: 'GET',
    headers: {
        ':method': 'GET',
        ':scheme': 'https',
        ':authority': 'localhost:4000',
        ':path': '/'
    }
}).then(response=>{
    response.body.getReader().read().then(result=>{
        console.log(result.value);
    });
})

fetch('https://localhost:4000/abc.txt', {
    method: 'GET',
    headers: {
        ':method': 'GET',
        ':scheme': 'https',
        ':authority': 'localhost:4000',
        ':path': '/abc.txt'
    }
}).then(response=>{
    response.body.getReader().read().then(result=>{
        console.log(result.value);
    });
})

fetch('https://localhost:4000/bcd.txt', {
    method: 'GET',
    headers: {
        ':method': 'GET',
        ':scheme': 'https',
        ':authority': 'localhost:4000',
        ':path': '/bcd.txt'
    }
}).then(response=>{
    response.body.getReader().read().then(result=>{
        console.log(result.value);
    });
})

// xhr.send(null);

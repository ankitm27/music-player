var Peer = require('simple-peer');
var p = new Peer({ initiator: location.hash === '#1', trickle: false });

p.on('error', function (err) { console.log('error', err) })


p.on('signal', function (data) {
    console.log('SIGNAL', data);
    document.querySelector('#outgoing').textContent = data
});

document.querySelector('form').addEventListener('submit', function (ev) {
    console.log("check");
    ev.preventDefault();
    p.signal(document.querySelector('#incoming').value)
});

p.on('connect', function () {
    console.log('CONNECT');
    p.send('whatever' + Math.random())
});

p.on('data', function (data) {
    console.log('data: ' + data)
});
//our username
var name;
var connectedUser;
var userId;
var roomId;
var ip = "https://ankitmalhotra.xyz";
//var ip = "https://127.0.0.1:3006";

var conn = new WebSocket('wss://ankitmalhotra.xyz');
//var conn = new WebSocket('wss://127.0.0.1:3006');

conn.onopen = function () {
    userId = makeId();
    roomId = window.location.href.split("/");
    roomId = roomId[roomId.length - 1];
    document.getElementById("roomId").value = window.location.href;
    send({
        type: "login",
        name: userId
    });
};

conn.onmessage = function (msg) {
    var data = JSON.parse(msg.data);
    switch (data.type) {
        case "login":
            handleLogin(data.success, data.name);
            break;
        case "offer":
            handleOffer(data.offer, data.name);
            break;
        case "answer":
            handleAnswer(data.answer);
            break;
        case "candidate":
            handleCandidate(data.candidate);
            break;
        case "leave":
            handleLeave(data.name);
            break;
        case "error":
            handleError(data.msg);
            break;
        case "checkUserIsAvailable":
            handleUserAvailable(data.status, data.msg);
            break;
        default:
            break;
    }
};

conn.onerror = function (err) {
    alert(err)
};

function send(message) {
    if (connectedUser) {
        message.name = connectedUser;
    }
    conn.send(JSON.stringify(message));
};

var callPage = document.querySelector('#callPage');
var localAudio = document.querySelector('#localAudio');
var remoteAudio = document.querySelector('#remoteAudio');
var yourConn;
var stream;

var configuration = {
    "iceServers": [{"url": "stun:stun2.1.google.com:19302"}]
};

callPage.style.display = "none";

function handleLogin(success, name) {
    if (success === false) {
        alert("Ooops...try a different username");
    } else {
        localStorage.setItem("name", name);
        callPage.style.display = "block";
        navigator.webkitGetUserMedia({video: false, audio: true}, function (myStream) {
            stream = myStream;
            localAudio.srcObject = stream;
            localAudio.muted = true;
            var xhttp = new XMLHttpRequest();
            const url = ip + "/isConnectionAvailable?url=" + roomId + "&userId=" + userId;
            xhttp.open("GET", url, true);
            xhttp.send();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    var response = JSON.parse(this.response);
                    if (response.status) {
                        connectedUser = response.userId;
                        send({
                            type: "checkUserIsAvailable"
                        })
                    } else {
                        alert(response.msg);
                    }
                }
            };
        }, function (error) {
            console.log(error);
        });
    }
};

function handleOffer(offer, name) {
    alert("Some one join your room");
    connectedUser = name;
    yourConn = new webkitRTCPeerConnection(configuration);
    yourConn.addStream(stream);
    yourConn.setRemoteDescription(new RTCSessionDescription(offer));
    yourConn.createAnswer(function (answer) {
        yourConn.setLocalDescription(answer);
        send({
            type: "answer",
            answer: answer
        });
        yourConn.onaddstream = function (e) {
            remoteAudio.srcObject = e.stream;
        };
        yourConn.onicecandidate = function (event) {
            if (event.candidate) {
                send({
                    type: "candidate",
                    candidate: event.candidate
                });
            }
        };
    }, function (error) {
        alert("Error when creating an answer");
    });

};

function handleAnswer(answer) {
    yourConn.setRemoteDescription(new RTCSessionDescription(answer));
    yourConn.onaddstream = function (e) {
        remoteAudio.srcObject = e.stream;
    };
    yourConn.onicecandidate = function (event) {
        if (event.candidate) {
            send({
                type: "candidate",
                candidate: event.candidate
            });
        }
    };
};

function handleCandidate(candidate) {
    yourConn.addIceCandidate(new RTCIceCandidate(candidate));
};


function handleError(msg) {
    alert(msg);
}


function handleLeave(name) {
    alert('Some one left your room');
    connectedUser = null;
    remoteAudio.src = null;
    yourConn.close();
    yourConn.onicecandidate = null;
    yourConn.onaddstream = null;
};


function handleUserAvailable(success, msg) {
    if (success === false) {
        alert(msg);
    } else {
        yourConn = new webkitRTCPeerConnection(configuration);
        yourConn.addStream(stream);
        yourConn.createOffer(function (offer) {
            send({
                type: "offer",
                offer: offer
            });

            yourConn.setLocalDescription(offer);
        }, function (error) {
            alert("Error when creating an offer");
        });
    }
}

function makeId() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

window.addEventListener("beforeunload", function (e) {
    conn.close();
});

newRoom.addEventListener("click",function(e){
    window.location.href = ip + "/rtc"
});

copyBtn.addEventListener("click",function(e){
    var copyText = document.getElementById('roomId');
    copyText.select();
    document.execCommand("Copy");
    alert('You have copied your command please send it to your friend to enjoy Music player');
});






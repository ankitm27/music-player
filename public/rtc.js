var name;
var connectedUser;

var ip = "https://ankitmalhotra.xyz";
//var ip = "https://127.0.0.1:3006";

var loginPage = document.querySelector('#loginPage');
var callPage = document.querySelector('#callPage');
callPage.style.display = "none";

loginBtn.addEventListener("click", function (event) {
    var xhttp = new XMLHttpRequest();
    const url = ip + "/generateRoom";
    xhttp.open("GET", url, true);
    xhttp.send();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var response = confirm("Want to enter a room");
            loginPage.style.display = "none";
            if(response === true){
                  window.location.href = "https://"  + JSON.parse(this.response).url;
            }else{
                callPage.style.display = "block";
                document.getElementById("roomId").value = "https://" + JSON.parse(this.response).url;
            }
        }
    };
});


copyBtn.addEventListener("click",function(event){
    var copyText = document.getElementById("roomId");
    copyText.select();
    document.execCommand("Copy");
    alert("You have copied your link, send it to your friend to start conversation");
});

joinBtn.addEventListener("click",function(event){
    var copyText = document.getElementById("roomId").value;
    window.location.href = copyText;
});


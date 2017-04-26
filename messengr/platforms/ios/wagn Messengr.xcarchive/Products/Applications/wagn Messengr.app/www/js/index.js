//////////////////////////////////////
//Authors: Mitch Eric and Jake
//V1.0
//April 25/2017
//////////////////////////////////////


"use strict"
let imgContainer = document.getElementById("imageContainer");
imgContainer.style.display = "none";
let baseURL = "https://griffis.edumedia.ca/mad9022/steg/";
let loginURL = baseURL.concat("login.php");
let registerURL = baseURL.concat("register.php");
let listUsersURL = baseURL.concat("user-list.php");
let messageListURL = baseURL.concat("msg-list.php");
let messageSendURL = baseURL.concat("msg-send.php");
let messageGetURL = baseURL.concat("msg-get.php");
let messageDeleteURL = baseURL.concat("msg-delete.php");
let req = "";
let formData = "";
let guid = "";
let userID = "";
let currentMsg = 0;
var app = {
    onDeviceReady: function () {
        let login = document.getElementById("loginBtn");
        let register = document.getElementById("registerBtn");
        login.addEventListener("touchend", app.submitLogin);
        register.addEventListener("touchend", app.submitRegister);
        let sendBtn = document.getElementById("sendBtn");
        sendBtn.addEventListener("touchend", app.sendMessage);
        console.log("event listeners bound on login page");
    }
    , submitLogin: function () {
        req = new Request(loginURL);
        formData = new FormData();
        formData.append("user_name", document.getElementById("username").value);
        formData.append("email", document.getElementById("email").value);
        let opts = {
            method: 'POST'
            , mode: 'cors'
            , body: formData
        };
        fetch(req, opts).then(function (response) {
            console.log(response);
            return response.json();
        }).then(function (data) {
            console.log(data);
            if (data.code == 0) {
                guid = data.user_guid;
                userID = data.user_id;
                let messageModal = document.getElementById("messagesModal");
                messageModal.classList.toggle("active");
                app.messageList();
            }
        });
        formData = "";
        app.messageList();
    }
    , submitRegister: function () {
        req = new Request(registerURL);
        formData = new FormData();
        formData.append("user_name", document.getElementById("username").value);
        formData.append("email", document.getElementById("email").value);
        let opts = {
            method: 'POST'
            , mode: 'cors'
            , body: formData
        };
        fetch(req, opts).then(function (response) {
            console.log(response);
            return response.json();
        }).then(function (data) {
            console.log(data);
            if (data.code == 0) {
                guid = data.user_guid;
                userID = data.user_id;
                let messageModal = document.getElementById("messagesModal");
                messageModal.classList.toggle("active");
                app.messageList();
            }
        });
        formData = "";
        app.messageList();
    }
    , messageList() {
        document.getElementById("msgList").innerHTML = "";
        let newMsgBtn = document.getElementById("newMessage");
        newMsgBtn.addEventListener("touchend", app.newMessage);
        req = new Request(messageListURL);
        let fd = new FormData();
        fd.append("user_id", userID);
        fd.append("user_guid", guid);
        let opts = {
            method: 'POST'
            , mode: 'cors'
            , body: fd
        };
        fetch(req, opts).then(function (response) {
            console.log(response);
            return response.json();
        }).then(function (data) {
            console.log(data);
            for (var i = 0; i < data.messages.length; i++) {
                let ul = document.getElementById("msgList");
                let li = document.createElement("li");
                let a = document.createElement("a");
                li.className = "table-view-cell";
                li.setAttribute("data-msgId", data.messages[i].msg_id);
                li.setAttribute("data-name", data.messages[i].user_name);
                a.innerHTML = "From: " + data.messages[i].user_name + "";
                a.className = "navigate-right";
                a.addEventListener("touchend", app.detailView);
                li.appendChild(a);
                ul.appendChild(li);
            }
        });
        document.getElementById("newMessageDetail").addEventListener("touchend", function () {
            document.querySelector("#messageDetailModal").classList.remove("active");
        })
    }
    , newMessage() {
        let newMsgContent = document.getElementById("newMessageContent");
        let canvas = document.getElementById("canvas");
        canvas.style.display = "none";
        let takePhoto = document.getElementById("picBtn");
        let newMsgDropDown = document.getElementById("newMsgDropDown");
        let textBox = document.getElementById("newMsgTextBox");
        takePhoto.addEventListener("touchend", app.takePicture);
        document.getElementById("modalCloseNew").addEventListener("touchend", app.cancel);
        document.getElementById("sendBtn").addEventListener("touchend", app.sendMessage);
        //populate selection dropdown
        req = new Request(listUsersURL);
        formData = new FormData();
        formData.append("user_id", userID);
        formData.append("user_guid", guid);
        let opts = {
            method: 'POST'
            , mode: 'cors'
            , body: formData
        };
        fetch(req, opts).then(function (response) {
            console.log(response);
            return response.json();
        }).then(function (data) {
            console.log(data);
            let users = data.users;
            let dropDown = document.getElementById("newMsgDropDown");
            for (let i = 0; i < users.length; i++) {
                let choice = users[i].user_name;
                let choices = document.createElement("option");
                choices.value = users[i].user_id;
                choices.innerHTML = choice;
                dropDown.appendChild(choices);
            }
        });
    }
    , sendMessage() {
        //call BITS
        let toUser = document.getElementById("newMsgDropDown").value;
        let text = document.getElementById("newMsgTextBox").value.trim();
        let canvas = document.getElementById("canvas");
        canvas = BITS.setUserId(BITS.numberToBitArray(toUser), canvas);
        canvas = BITS.setMsgLength(BITS.numberToBitArray(text.length * 16), canvas);
        canvas = BITS.setMessage(BITS.stringToBitArray(text), canvas);
        let dataURL = canvas.toDataURL();
        let fd = new FormData();
        app.dataURLToBlob(dataURL).then(function (blob) {
            fd.append("image", blob);
            fd.append("user_id", userID);
            fd.append("user_guid", guid);
            fd.append("recipient_id", toUser);
            req = new Request(messageSendURL);
            let opts = {
                method: 'POST'
                , mode: 'cors'
                , body: fd
            };
            fetch(req, opts).then(function (response) {
                console.log(response);
                return response.json();
            }).then(function (data) {
                console.log(data);
                app.messageList();
            });
        })
        document.getElementById("newMessageModal").classList.toggle("active");
        app.cancel();
        app.messageList();
    }
    , dataURLToBlob: function (dataURL) {
        return Promise.resolve().then(function () {
            var type = dataURL.match(/data:([^;]+)/)[1];
            var base64 = dataURL.replace(/^[^,]+,/, '');
            var buff = app.binaryStringToArrayBuffer(atob(base64));
            return new Blob([buff], {
                type: type
            });
        });
    }
    , binaryStringToArrayBuffer: function (binary) {
        var length = binary.length;
        var buf = new ArrayBuffer(length);
        var arr = new Uint8Array(buf);
        var i = -1;
        while (++i < length) {
            arr[i] = binary.charCodeAt(i);
        }
        return buf;
    }
    , cancel() {
        //hide and canvas
        let canvas = document.getElementById("canvas");
        let context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.display = "none";
        //make sure pic button is active
        document.getElementById("picBtn").style.display = "block";
        //clear select and text area
        document.getElementById("newMsgDropDown").innerHTML = "";
        document.getElementById("newMsgTextBox").value = "";
    }
    , takePicture: function () {
        let options = {
            quality: 80
            , destinationType: Camera.DestinationType.FILE_URI
            , encodingType: Camera.EncodingType.PNG
            , mediaType: Camera.MediaType.PICTURE
            , pictureSourceType: Camera.PictureSourceType.CAMERA
            , allowEdit: true
            , targetWidth: 300
            , targetHeight: 300
        }
        navigator.camera.getPicture(app.onSuccess, app.onFail, options);
    }
    , onSuccess: function (imageURI) {
        //toggle picture button and canvas visibilty and put image in canvas
        imgContainer.src = imageURI;
        let cnvs = document.getElementById("canvas");
        cnvs.style.display = "block";
        document.getElementById("picBtn").style.display = "none";
        let ctx = cnvs.getContext("2d");
        imgContainer.onload = function () {
            ctx.drawImage(imgContainer, 0, 0); //draw image into canvas;
        }
    }
    , onFail: function () {
        alert('Failed because: ' + message);
    }
    , detailView: function (ev) {
        
        let newMsg = document.getElementById("newMessageDetail");
        newMsg.addEventListener("touchend",app.sendMessage);
        let x = ev.currentTarget.parentElement;
        currentMsg = x.getAttribute("data-msgId");
        let name = x.getAttribute("data-name");
        document.getElementById("messageDetailModal").classList.toggle("active");
        console.log(currentMsg);
        req = new Request(messageGetURL);
        let fd = new FormData();
        fd.append("user_id", userID);
        fd.append("user_guid", guid);
        fd.append("message_id", currentMsg);
        let opts = {
            method: 'POST'
            , mode: 'cors'
            , body: fd
        };
        fetch(req, opts).then(function (response) {
            console.log(response);
            return response.json();
        }).then(function (data) {
            console.log(data);
            let from = document.getElementById("msgFrom")
            from.textContent = name;
            let canvas = document.getElementById("incomingCanvas");
            let btn = document.getElementById("btnDel");
            let p = document.getElementById("incomingMsg");
            btn.addEventListener("touchend", app.delMsg);
            let imageContainer = document.createElement("img");
            imageContainer.src = "https://griffis.edumedia.ca/mad9022/steg/" + data.image;
            let ctx = canvas.getContext("2d");
            imageContainer.onload = function () {
                ctx.drawImage(imageContainer, 0, 0); //draw image into canvas;
            console.log(BITS.getMessage(userID,canvas));
            p.textContent=BITS.getMessage(userID,canvas);
            };
            
            
        
            
            
            
            
            
            
            
            
        })
    }
    , delMsg: function () {
        req = new Request(messageDeleteURL);
        let fd = new FormData();
        fd.append("user_id", userID);
        fd.append("user_guid", guid);
        fd.append("message_id", currentMsg);
        let opts = {
            method: 'POST'
            , mode: 'cors'
            , body: fd
        };
        fetch(req, opts).then(function (response) {
            console.log(response);
            return response.json();
        }).then(function (data) {
            console.log(data);
            app.messageList();
            document.getElementById("messageDetailModal").classList.toggle("active");
        })
    }
};
if (document.deviceReady) {
    document.addEventlistener('deviceready', app.onDeviceReady);
}
else {
    document.addEventListener('DOMContentLoaded', app.onDeviceReady)
}
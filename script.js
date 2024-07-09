$('.chat-button').on('click', function() {
    $('.chat-button').css({
        "display": "none"
    });
    $('.chat-box').css({
        "visibility": "visible"
    });
});
$('.chat-box .chat-box-header p').on('click', function() {
    $('.chat-button').css({
        "display": "block"
    });
    $('.chat-box').css({
        "visibility": "hidden"
    });
});
$('#fileSelector').on('change', function(event) {
    const fileInput = event.target;
    const file = fileInput.files[0];
    if (file) {
        $('#chat-preview').css({
            "display": "block"
        });

        //set up image preview on screen
        const reader = new FileReader();
        reader.onload = function(e) {
            // Set the src of the img element to the file data URL
            const previewImg = document.getElementById('imgPreview');
            previewImg.src = e.target.result;
            //previewImg.style.display = 'block';
        }
        // Read the file as a data URL
        reader.readAsDataURL(file);

        //upload image to server
        const formData = new FormData();
        formData.append('file', file);
        fetch('http://localhost:8010/proxy/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log('Upload successful:', data);
            selectedImage = data.url;
        })
        .catch(error => {
            console.error('Upload error:', error);
        });
    } else {
        console.log('No file selected');
    }
});

function clearImgPreview(){
    $('#chat-preview').css({
        "display": "none"
    });
    const previewImg = document.getElementById('imgPreview');
    previewImg.src = "";
    selectedImage = "";
}

$("#sendMsg").on("click",function(){
    let input = document.getElementById("msgInput");
    if(input.value.trim().length!=0){
        const uniqueId = generateId();
        addMessageToList(input.value,true);
        makeMJcall(input.value, uniqueId);
        var intervalId = setInterval(function(){
            getResultFromMidjourney(uniqueId, intervalId);
        }, 5000);
    }
    input.value = "";
});
$(".modal-close-button").on("click", function() {
    $(".modal").toggleClass("show-modal");
})

function addMessageToList(msg, isUser){
    const date = new Date();
    const hour = date.getHours();
    const min = date.getMinutes();
    let time = hour+":"+min;
    if(isUser){
        let imgDOM = "";
        if(selectedImage!=""){
            imgDOM = "<img width='260' src='http://"+selectedImage+"' />"
        }
        $(".chat-box-body").append("<div class='chat-box-body-send'>"+imgDOM+"<p>"+msg+"</p><span>"+time+"</span></div>");
    }else{
        $(".chat-box-body").append("<div class='chat-box-body-receive'><img width='260' src='"+msg+"' /><span>"+time+"</span></div>");
    }
    
}
let selectedImage = "";
const MJToken = "ODgwNTQ3Mzc0Mzk5OTA1ODYz.GDufzv.3ohYGiWpavPQ_TY14UL3CTBNgIMTIBucqzlapY";
const channelId="1258102858998612090";
function makeMJcall(prompt, uniqueId){
    $("#chat-loading").css({
        "visibility": "visible"
    });
    const appId="936929561302675456";
    const guildId="1258102561249034280";
    const sessionId="9d408a9c88501444546389d0bad3c72c";
    const version="1237876415471554623";
    const commandId="938956540159881230";

    const postPayload = {
        type: 2,
        application_id: appId,
        guild_id: guildId,
        channel_id: channelId,
        session_id: sessionId,
        data: {
          version: version,
          id: commandId,
          name: "imagine",
          type: 1,
          options: [
            {
              type: 3,
              name: "prompt",
              value: `${selectedImage} ${prompt} --no ${uniqueId}`
            }
          ],
          application_command: {
            id: commandId,
            application_id: appId,
            version: version,
            default_member_permissions: null,
            type: 1,
            nsfw: false,
            name: "imagine",
            description: "Create images with Midjourney",
            dm_permission: true,
            contexts: [0, 1, 2],
            options: [
              {
                type: 3,
                name: "prompt",
                description: "The prompt to imagine",
                required: true
              }
            ]
          },
          attachments: []
        }
      };

    const options = {
        method: 'POST',
        headers: {
            'authorization': MJToken,
            'Content-Type': 'application/json'
          // Add any other headers as needed
        },
        body: JSON.stringify(postPayload)
    };
    fetch('https://discord.com/api/v9/interactions', options)
        .then(response => {
            clearImgPreview();
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

function generateId(){
    return Math.floor(Math.random() * 1000);
    
}

function getResultFromMidjourney(id, interval) {
    const channelUrl = `https://discord.com/api/v9/channels/${channelId}/messages?limit=50`;
    const options = {
        method: 'GET',
        headers: {
            'Authorization': MJToken,
            'Content-Type': 'application/json'
          // Add any other headers as needed
        }
    };
    try {
        fetch(channelUrl, options)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data=>{
            const matchingMessage = data.filter(message =>
                message.content.includes(id) &&
                message
                  .components
                  .some(component => component.components.some(c => c.label === "U1") ) // means that we can upscale results
              ) || [];
            if (!matchingMessage.length) {
                return null;
            }
            console.log("getting image for id: "+id);
            if (matchingMessage[0].attachments && matchingMessage[0].attachments.length > 0) {
                for (const attachment of matchingMessage[0].attachments) {
                    clearInterval(interval);
                    $("#chat-loading").css({
                        "display": "block"
                    });
                    addMessageToList(attachment.url,false);
                }
            }
        })

    } catch (error) {
     // do something 
     console.log(error);
    }
     
}
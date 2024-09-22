const apiKey = "YOUR_OPEN_AI_KEYS";
const url = 'https://api.openai.com/v1/chat/completions';

const languageSelect = document.getElementById('languageSelect');
//get userInput Message
const userInput = document.getElementById("userMessage");
//get userId
const userID = document.getElementById("userID");
//get userID from local Storage (index.html (login page))
userID.value = localStorage.getItem("userID");
userID.disabled = true;
const profileNum = localStorage.getItem("profileNum");

//addEventListner to "userMessage"
userInput.addEventListener("keydown", messageEnter);

const socket = io();

function messageEnter(event) {
  if (event.key == "Enter") {
    console.log("Enter button pressed.");
    sendMessage();
  }
}

//1. input : inputMessage - "안녕하세요"
//2. output : translatedMessage - "HELLO" -> return output
async function gptTranslate(inputMessage){
  try {
    //인증 - header에
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    
    //질문 -input Message로 만들어짐
    let text1 = inputMessage;
    console.log("[MESSAGE] "+ text1);
    let text2 = inputMessage + ":" +"translate it in "+languageSelect.value + " give me only translated result. No pronunciation";
    console.log("[QUESTION] "+ text2);

    //gpt 질문 형식 만드는 부분
    const payload = {
      model: "gpt-3.5-turbo",//"gpt-4o" //"gpt-4o-mini"
      messages: [{ role: "user", content: text2 }],
      temperature: 0.7
    };

    //gpt에게 request 하는 부분 -> response
    const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    // response output으로 만드는 부분
    const responseData = await response.json();
    const responseMessage = responseData.choices[0].message.content;
    console.log(responseMessage);
    return responseMessage; //return translated Message
  } 
  catch (error) {
    console.error("Error:", error);
  }
}


//message send function
function sendMessage() {
  console.log("send button clicked");
  console.log(userInput.value);
  console.log(userID.value);
  console.log(profileNum);

  if (userInput.value != "") {
    //socket.io -> websocket -> send message!! (=emit)
    //Make Json format : {"name":"Jhon", "age":20}
    const userData = {
      ID: userID.value,
      Message: userInput.value, 
      ProfileNum: profileNum
    };
    socket.emit("chatMessage", userData);

    //reset userMessage Text
    userInput.value = "";
  } else {
    console.log("Message cannot be blank");
  }
}

//message receive function
socket.on("chatMessage", async function (data) {
  console.log("Received from Server : " + data);
  //data -> {"ID":**** , "Message":####}
  //data -> ID / Message 
  console.log(data.ID); //console.log(data["ID"]);
  console.log(data.Message); //console.log(data.["Message"]);

  //Translate Message
  let translatedMessage="";
  try {
    translatedMessage = await gptTranslate(data.Message);
  }
  catch (error) {
    console.error("Translation error: ", error);
    translatedMessage="Translation failed...:"+data.Message;
  }
  
  //create li
  const li = document.createElement("li");
  li.style.display = "flex";
  li.style.flexDirection = "row"; // left to right 정렬
  li.style.alignItems = "center"; // center

  //create profile div
  const profileDiv = document.createElement("div");
  profileDiv.style.display = "flex";
  profileDiv.style.flexDirection = "column"; // top to bottom 정렬
  profileDiv.style.alignItems = "center"; // center

  //create user profile img
  const profileImg = document.createElement("img");
  profileImg.width = 50;
  profileImg.height = 50;

  //create user ID
  const spanID = document.createElement("span");
  spanID.textContent = data.ID;
  spanID.style.fontWeight = "bold";
  spanID.style.color = "blue";

  //create user Messaage
  const spanMessage = document.createElement("span");
  spanMessage.textContent = translatedMessage;
  spanMessage.style.borderRadius = "15px";
  spanMessage.style.padding = "10px";
  spanMessage.style.margin = "10px";
  spanMessage.style.wordSpacing =
    "normal"; /* 글자가 너무 길어지면 단어를 분리하여 다음 줄로 이동 */
  spanMessage.style.wordBreak = "break-all"; //긴 단어도 next line 으로

  //profileNum =>  my Image from localStorage
  //data.ProfileNum => profile image Num from data
  profileImg.src = "user_" + data.ProfileNum + ".png";

  //Right : MyMessage
  //Left : Other message
  //received ID = data.ID
  //my ID = userID.value
  if (data.ID == userID.value) {
    //set Profile Image from local Strorage
    console.log("My message received.");
    spanMessage.style.color = "white";
    spanMessage.style.backgroundColor = "blue";
    li.style.textAlign = "right";
    li.style.justifyContent = "flex-end";
    profileDiv.appendChild(profileImg);
    profileDiv.appendChild(spanID);

    li.appendChild(spanMessage);
    li.appendChild(profileDiv);
  } 
  else {
    console.log("Other message received.");
    spanMessage.style.backgroundColor = "lightgray";
    li.style.textAlign = "left";
    li.style.justifyContent = "flex-start";
    profileDiv.appendChild(profileImg);
    profileDiv.appendChild(spanID);

    li.appendChild(profileDiv);
    li.appendChild(spanMessage);
  }

  const messageContainer = document.getElementById("messageContainer");
  messageContainer.appendChild(li);

  //message scroll always top
  messageContainer.scrollTop = messageContainer.scrollHeight;
});

// ==================================================
// Veylo App.js
// ==================================================

console.log(
  "Veylo app.js loaded successfully."
);


// ==================================================
// Socket.IO
// ==================================================

const socket = io();


// ==================================================
// DOM
// ==================================================

const messages =
  document.getElementById("messages");

const messageForm =
  document.getElementById("messageForm");

const messageInput =
  document.getElementById("messageInput");

const usernameInput =
  document.getElementById("usernameInput");

const roomName =
  document.getElementById("roomName");

const inviteArea =
  document.getElementById("inviteArea");

const inviteCode =
  document.getElementById("inviteCode");


// ==================================================
// 部屋作成
// ==================================================

const createRoomButton =
  document.getElementById(
    "createRoomButton"
  );

const createModal =
  document.getElementById(
    "createModal"
  );

const roomNameInput =
  document.getElementById(
    "roomNameInput"
  );

const confirmCreateButton =
  document.getElementById(
    "confirmCreateButton"
  );

const cancelCreateButton =
  document.getElementById(
    "cancelCreateButton"
  );


// ==================================================
// 部屋参加
// ==================================================

const joinRoomButton =
  document.getElementById(
    "joinRoomButton"
  );

const joinModal =
  document.getElementById(
    "joinModal"
  );

const inviteCodeInput =
  document.getElementById(
    "inviteCodeInput"
  );

const confirmJoinButton =
  document.getElementById(
    "confirmJoinButton"
  );

const cancelJoinButton =
  document.getElementById(
    "cancelJoinButton"
  );

const joinError =
  document.getElementById(
    "joinError"
  );


// ==================================================
// 現在の部屋
// ==================================================

let currentRoom = "casual";


// ==================================================
// Socket.IO 接続
// ==================================================

socket.on("connect", () => {

  console.log(
    "Veylo Socket.IO connected:",
    socket.id
  );

});


// ==================================================
// ユーザー名を保存
// ==================================================

const savedUsername =
  localStorage.getItem(
    "veylo_username"
  );

if (savedUsername) {

  usernameInput.value =
    savedUsername;

}


// ==================================================
// 保存済みコメントを読み込む
// ==================================================

loadLocalMessages();


// ==================================================
// チャット送信
// ==================================================

messageForm.addEventListener(
  "submit",
  (event) => {

    event.preventDefault();

    const text =
      messageInput.value.trim();

    const username =
      usernameInput.value.trim() ||
      "ゲスト";


    if (!text) {
      return;
    }


    // ユーザー名を保存

    localStorage.setItem(
      "veylo_username",
      username
    );


    // サーバーへ送信

    socket.emit(
      "chat message",
      {

        room:
          currentRoom,

        text:
          text,

        username:
          username

      }
    );


    messageInput.value = "";

    messageInput.focus();

  }
);


// ==================================================
// チャット受信
// ==================================================

socket.on(
  "chat message",
  (data) => {

    if (!data) {
      return;
    }

    if (data.room !== currentRoom) {
      return;
    }


    addMessage(data);

    saveLocalMessage(data);

  }
);


// ==================================================
// メッセージ表示
// ==================================================

function addMessage(data) {

  const message =
    document.createElement("div");

  message.className =
    "message";


  // ユーザー名

  const user =
    document.createElement("div");

  user.className =
    "message-user";

  user.textContent =
    data.username || "ゲスト";


  // 本文

  const text =
    document.createElement("span");

  text.className =
    "message-text";

  text.textContent =
    data.text;


  // 時刻

  const time =
    document.createElement("span");

  time.className =
    "message-time";

  time.textContent =
    formatTime(
      data.createdAt
    );


  message.appendChild(user);

  message.appendChild(text);

  message.appendChild(time);


  messages.appendChild(message);


  // 一番下へ

  messages.scrollTop =
    messages.scrollHeight;

}


// ==================================================
// 時刻
// ==================================================

function formatTime(value) {

  if (!value) {
    return "";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  return date.toLocaleTimeString(
    "ja-JP",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}


// ==================================================
// LocalStorage保存
// ==================================================

function saveLocalMessage(data) {

  if (
    !data ||
    data.room !== "casual"
  ) {

    return;

  }


  let stored = [];


  try {

    stored =
      JSON.parse(
        localStorage.getItem(
          "veylo_casual_messages"
        )
      ) || [];

  } catch {

    stored = [];

  }


  // 同じメッセージの重複防止

  const exists =
    stored.some((item) => {

      if (
        data.id &&
        item.id
      ) {

        return (
          item.id === data.id
        );

      }

      return (
        item.text === data.text &&
        item.username ===
          data.username
      );

    });


  if (exists) {
    return;
  }


  stored.push(data);


  // 最大1000件

  if (stored.length > 1000) {

    stored =
      stored.slice(
        stored.length - 1000
      );

  }


  localStorage.setItem(
    "veylo_casual_messages",
    JSON.stringify(stored)
  );

}


// ==================================================
// LocalStorage読み込み
// ==================================================

function loadLocalMessages() {

  let stored = [];


  try {

    stored =
      JSON.parse(
        localStorage.getItem(
          "veylo_casual_messages"
        )
      ) || [];

  } catch {

    stored = [];

  }


  console.log(
    "保存済み雑談コメント:",
    stored
  );


  stored.forEach((data) => {

    addMessage(data);

  });

}


// ==================================================
// 部屋作成ボタン
// ==================================================

createRoomButton.addEventListener(
  "click",
  () => {

    roomNameInput.value = "";

    createModal.classList.remove(
      "hidden"
    );

    roomNameInput.focus();

  }
);


// ==================================================
// 部屋作成キャンセル
// ==================================================

cancelCreateButton.addEventListener(
  "click",
  () => {

    createModal.classList.add(
      "hidden"
    );

  }
);


// ==================================================
// 部屋作成
// ==================================================

confirmCreateButton.addEventListener(
  "click",
  () => {

    const name =
      roomNameInput.value.trim();


    if (!name) {

      alert(
        "部屋の名前を入力してください。"
      );

      return;

    }


    socket.emit(
      "create room",
      {
        name: name
      }
    );

  }
);


// ==================================================
// 部屋作成完了
// ==================================================

socket.on(
  "room created",
  (room) => {

    console.log(
      "部屋作成:",
      room
    );


    currentRoom =
      room.id;


    roomName.textContent =
      room.name;


    inviteCode.textContent =
      room.inviteCode;


    inviteArea.classList.remove(
      "hidden"
    );


    createModal.classList.add(
      "hidden"
    );


    messages.innerHTML = "";


    alert(
      `部屋を作成しました。\n\n招待コード: ${room.inviteCode}`
    );

  }
);


// ==================================================
// 部屋参加ボタン
// ==================================================

joinRoomButton.addEventListener(
  "click",
  () => {

    inviteCodeInput.value = "";

    joinError.textContent = "";

    joinModal.classList.remove(
      "hidden"
    );

    inviteCodeInput.focus();

  }
);


// ==================================================
// 部屋参加キャンセル
// ==================================================

cancelJoinButton.addEventListener(
  "click",
  () => {

    joinModal.classList.add(
      "hidden"
    );

  }
);


// ==================================================
// 部屋参加
// ==================================================

confirmJoinButton.addEventListener(
  "click",
  () => {

    const code =
      inviteCodeInput.value
        .trim()
        .toUpperCase();


    if (!code) {

      joinError.textContent =
        "招待コードを入力してください。";

      return;

    }


    socket.emit(
      "join room",
      {
        code: code
      }
    );

  }
);


// ==================================================
// 部屋参加完了
// ==================================================

socket.on(
  "room joined",
  (room) => {

    console.log(
      "部屋参加:",
      room
    );


    currentRoom =
      room.id;


    roomName.textContent =
      room.name;


    inviteCode.textContent =
      room.inviteCode;


    inviteArea.classList.remove(
      "hidden"
    );


    joinModal.classList.add(
      "hidden"
    );


    messages.innerHTML = "";

  }
);


// ==================================================
// 部屋参加エラー
// ==================================================

socket.on(
  "join room error",
  (data) => {

    joinError.textContent =
      data?.message ||
      "部屋に参加できませんでした。";

  }
);


// ==================================================
// Enterキーで部屋作成
// ==================================================

roomNameInput.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter"
    ) {

      event.preventDefault();

      confirmCreateButton.click();

    }

  }
);


// ==================================================
// Enterキーで部屋参加
// ==================================================

inviteCodeInput.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter"
    ) {

      event.preventDefault();

      confirmJoinButton.click();

    }

  }
);

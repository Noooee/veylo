// ==================================================
// Veylo App.js
// ==================================================

console.log("Veylo app.js loaded successfully.");


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
  document.getElementById("createRoomButton");

const createModal =
  document.getElementById("createModal");

const roomNameInput =
  document.getElementById("roomNameInput");

const confirmCreateButton =
  document.getElementById("confirmCreateButton");

const cancelCreateButton =
  document.getElementById("cancelCreateButton");


// ==================================================
// 部屋参加
// ==================================================

const joinRoomButton =
  document.getElementById("joinRoomButton");

const joinModal =
  document.getElementById("joinModal");

const inviteCodeInput =
  document.getElementById("inviteCodeInput");

const confirmJoinButton =
  document.getElementById("confirmJoinButton");

const cancelJoinButton =
  document.getElementById("cancelJoinButton");

const joinError =
  document.getElementById("joinError");


// ==================================================
// 雑談へ戻る
// ==================================================

const backToCasualButton =
  document.getElementById("backToCasualButton");


// ==================================================
// 設定
// ==================================================

const settingsButton =
  document.getElementById("settingsButton");

const settingsModal =
  document.getElementById("settingsModal");

const settingsUsernameInput =
  document.getElementById("settingsUsernameInput");

const closeSettingsButton =
  document.getElementById("closeSettingsButton");

const saveSettingsButton =
  document.getElementById("saveSettingsButton");

const themeToggleButton =
  document.getElementById("themeToggleButton");

const grayToggleButton =
  document.getElementById("grayToggleButton");

const languageSelect =
  document.getElementById("languageSelect");


// ==================================================
// 現在の部屋
// ==================================================

let currentRoom = "casual";


// ==================================================
// 設定
// ==================================================

let darkMode =
  localStorage.getItem("veylo_dark_mode") === "true";

let grayMode =
  localStorage.getItem("veylo_gray_mode") === "true";

let language =
  localStorage.getItem("veylo_language") || "ja";


// ==================================================
// 24時間
// ==================================================

const MESSAGE_LIFETIME =
  24 * 60 * 60 * 1000;


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
// ユーザー名読み込み
// ==================================================

const savedUsername =
  localStorage.getItem("veylo_username");

if (savedUsername && usernameInput) {

  usernameInput.value =
    savedUsername;

}


// ==================================================
// メッセージが24時間以内か確認
// ==================================================

function isMessageValid(data) {

  if (!data) {
    return false;
  }

  if (!data.createdAt) {
    return true;
  }

  const created =
    new Date(data.createdAt).getTime();

  if (Number.isNaN(created)) {
    return true;
  }

  return (
    Date.now() - created <
    MESSAGE_LIFETIME
  );

}


// ==================================================
// LocalStorageの古いコメントを削除
// ==================================================

function cleanupLocalMessages() {

  try {

    const stored =
      JSON.parse(
        localStorage.getItem(
          "veylo_casual_messages"
        )
      ) || [];

    const valid =
      stored.filter(
        (data) =>
          isMessageValid(data)
      );

    localStorage.setItem(
      "veylo_casual_messages",
      JSON.stringify(valid)
    );

  } catch {

    localStorage.removeItem(
      "veylo_casual_messages"
    );

  }

}


// ==================================================
// 保存済みコメント読み込み
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


    localStorage.setItem(
      "veylo_username",
      username
    );


    socket.emit(
      "chat message",
      {
        room: currentRoom,
        text: text,
        username: username
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


    if (!isMessageValid(data)) {
      return;
    }


    addMessage(data);

    saveLocalMessage(data);

  }
);


// ==================================================
// サーバーから過去コメント受信
// ==================================================

socket.on(
  "previous messages",
  (data) => {

    if (!Array.isArray(data)) {
      return;
    }


    messages.innerHTML = "";


    data
      .filter(
        (message) =>
          isMessageValid(message)
      )
      .forEach(
        (message) => {

          addMessage(message);

        }
      );


    if (currentRoom === "casual") {

      saveAllLocalMessages(data);

    }

  }
);


// ==================================================
// メッセージ表示
// ==================================================

function addMessage(data) {

  if (!isMessageValid(data)) {
    return;
  }


  const message =
    document.createElement("div");

  message.className =
    "message";


  // ==================================================
  // ユーザー名
  // ==================================================

  const user =
    document.createElement("div");

  user.className =
    "message-user";

  user.textContent =
    data.username || "ゲスト";


  // ==================================================
  // 本文
  // ==================================================

  const text =
    document.createElement("span");

  text.className =
    "message-text";

  text.textContent =
    data.text;


  // ==================================================
  // 時刻
  // ==================================================

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


  // ==================================================
  // 一番下へ
  // ==================================================

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


  cleanupLocalMessages();


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


  if (!isMessageValid(data)) {
    return;
  }


  const exists =
    stored.some(
      (item) => {

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
            data.username &&
          item.createdAt ===
            data.createdAt
        );

      }
    );


  if (exists) {
    return;
  }


  stored.push(data);


  stored =
    stored.filter(
      (item) =>
        isMessageValid(item)
    );


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
// 過去コメントをまとめて保存
// ==================================================

function saveAllLocalMessages(data) {

  if (!Array.isArray(data)) {
    return;
  }


  const valid =
    data.filter(
      (item) =>
        isMessageValid(item)
    );


  localStorage.setItem(
    "veylo_casual_messages",
    JSON.stringify(
      valid.slice(-1000)
    )
  );

}


// ==================================================
// LocalStorage読み込み
// ==================================================

function loadLocalMessages() {

  cleanupLocalMessages();


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


  stored
    .filter(
      (data) =>
        isMessageValid(data)
    )
    .forEach(
      (data) => {

        addMessage(data);

      }
    );

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


    updateBackToCasualButton();


    alert(
      `部屋を作成しました。\n\n招待コード: ${room.inviteCode}`
    );

  }
);


// ==================================================
// 雑談へ戻る
// ==================================================

backToCasualButton.addEventListener(
  "click",
  () => {

    if (currentRoom === "casual") {
      return;
    }


    currentRoom =
      "casual";


    roomName.textContent =
      "雑談";


    inviteArea.classList.add(
      "hidden"
    );


    messages.innerHTML = "";


    updateBackToCasualButton();


    socket.emit(
      "join casual"
    );

  }
);


// ==================================================
// 雑談へ戻ったとき
// ==================================================

socket.on(
  "casual joined",
  () => {

    messages.innerHTML = "";

    loadLocalMessages();

  }
);


// ==================================================
// 雑談ボタン表示更新
// ==================================================

function updateBackToCasualButton() {

  if (!backToCasualButton) {
    return;
  }


  if (currentRoom === "casual") {

    backToCasualButton.classList.add(
      "hidden"
    );

  } else {

    backToCasualButton.classList.remove(
      "hidden"
    );

  }

}


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


    updateBackToCasualButton();

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
// 設定を開く
// ==================================================

settingsButton.addEventListener(
  "click",
  () => {

    settingsUsernameInput.value =
      localStorage.getItem(
        "veylo_username"
      ) || "";


    languageSelect.value =
      language;


    settingsModal.classList.remove(
      "hidden"
    );


    settingsUsernameInput.focus();

  }
);


// ==================================================
// 設定を閉じる
// ==================================================

closeSettingsButton.addEventListener(
  "click",
  () => {

    settingsModal.classList.add(
      "hidden"
    );

  }
);


// ==================================================
// ダークモード
// ==================================================

themeToggleButton.addEventListener(
  "click",
  () => {

    darkMode =
      !darkMode;

    updateTheme();

  }
);


// ==================================================
// グレーモード
// ==================================================

grayToggleButton.addEventListener(
  "click",
  () => {

    grayMode =
      !grayMode;

    updateTheme();

  }
);


// ==================================================
// テーマ更新
// ==================================================

function updateTheme() {

  document.body.classList.toggle(
    "dark-mode",
    darkMode
  );


  document.body.classList.toggle(
    "gray-mode",
    grayMode
  );


  themeToggleButton.textContent =
    darkMode ? "ON" : "OFF";


  grayToggleButton.textContent =
    grayMode ? "ON" : "OFF";


  themeToggleButton.classList.toggle(
    "active",
    darkMode
  );


  grayToggleButton.classList.toggle(
    "active",
    grayMode
  );


  localStorage.setItem(
    "veylo_dark_mode",
    darkMode
  );


  localStorage.setItem(
    "veylo_gray_mode",
    grayMode
  );

}


// ==================================================
// 設定保存
// ==================================================

saveSettingsButton.addEventListener(
  "click",
  () => {

    const username =
      settingsUsernameInput.value.trim();


    if (username) {

      localStorage.setItem(
        "veylo_username",
        username
      );


      usernameInput.value =
        username;

    }


    language =
      languageSelect.value;


    localStorage.setItem(
      "veylo_language",
      language
    );


    localStorage.setItem(
      "veylo_dark_mode",
      darkMode
    );


    localStorage.setItem(
      "veylo_gray_mode",
      grayMode
    );


    updateTheme();


    settingsModal.classList.add(
      "hidden"
    );

  }
);


// ==================================================
// Enterキー：部屋作成
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
// Enterキー：部屋参加
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


// ==================================================
// モーダル外クリック
// ==================================================

createModal.addEventListener(
  "click",
  (event) => {

    if (
      event.target === createModal
    ) {

      createModal.classList.add(
        "hidden"
      );

    }

  }
);


joinModal.addEventListener(
  "click",
  (event) => {

    if (
      event.target === joinModal
    ) {

      joinModal.classList.add(
        "hidden"
      );

    }

  }
);


settingsModal.addEventListener(
  "click",
  (event) => {

    if (
      event.target === settingsModal
    ) {

      settingsModal.classList.add(
        "hidden"
      );

    }

  }
);


// ==================================================
// 初期設定
// ==================================================

updateTheme();

updateBackToCasualButton();

cleanupLocalMessages();


// ==================================================
// 24時間ごとにブラウザ側も掃除
// ==================================================

setInterval(
  () => {

    cleanupLocalMessages();

  },
  10 * 60 * 1000
);

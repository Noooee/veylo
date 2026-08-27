const socket = io();


// ==================================================
// DOM
// ==================================================

const input = document.getElementById("input");
const form = document.getElementById("form");
const messages = document.getElementById("messages");

const roomList = document.getElementById("room-list");

const createRoomButton =
  document.getElementById("create-room-button");

const joinRoomButton =
  document.getElementById("join-room-button");

const chatHeaderTitle =
  document.querySelector(".chat-header strong");


// ==================================================
// 現在の部屋
// ==================================================

let currentRoom =
  localStorage.getItem("currentRoom") || "casual";


// ==================================================
// ユーザー名
// ==================================================

let username =
  localStorage.getItem("username") || "ゲスト";

const usernameInput =
  document.getElementById("username-input");

const saveUsernameButton =
  document.getElementById("save-username");

const usernameStatus =
  document.getElementById("username-status");


if (usernameInput) {
  usernameInput.value = username;
}


// ==================================================
// 入力欄
// ==================================================

function resizeInput() {

  if (!input) return;

  input.style.height = "auto";

  const newHeight =
    Math.min(input.scrollHeight, 180);

  input.style.height =
    newHeight + "px";
}


if (input) {

  input.addEventListener(
    "input",
    resizeInput
  );

}


// ==================================================
// メッセージ表示
// ==================================================

function clearMessages() {

  if (!messages) return;

  messages.innerHTML = "";
}


function formatMessageTime(timestamp) {

  if (!timestamp) {
    return "";
  }

  const date =
    new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString(
    "ja-JP",
    {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}


function displayMessage(data) {

  if (!messages || !data) {
    return;
  }


  const wrapper =
    document.createElement("div");


  // 自分か他人か

  const isMine =
    data.username === username;


  wrapper.className =
    "message-wrapper " +
    (isMine ? "mine" : "other");


  // ==================================================
  // 時刻
  // ==================================================

  const time =
    document.createElement("div");

  time.className =
    "message-time";

  time.textContent =
    formatMessageTime(
      data.created_at ||
      data.createdAt ||
      data.timestamp
    );


  // ==================================================
  // ユーザー名
  // ==================================================

  const name =
    document.createElement("div");

  name.className =
    "message-username";

  name.textContent =
    data.username || "ゲスト";


  // ==================================================
  // 吹き出し
  // ==================================================

  const bubble =
    document.createElement("div");

  bubble.className =
    "message-bubble";


  // XSS対策
  // textContentなのでHTMLは実行されません

  const text =
    document.createElement("div");

  text.className =
    "message-text";

  text.textContent =
    data.text || "";


  bubble.appendChild(text);


  wrapper.appendChild(time);

  wrapper.appendChild(name);

  wrapper.appendChild(bubble);


  messages.appendChild(wrapper);


  messages.scrollTop =
    messages.scrollHeight;
}


// ==================================================
// メッセージ一覧を表示
// ==================================================

function displayMessages(list) {

  clearMessages();


  if (!Array.isArray(list)) {
    return;
  }


  list.forEach(
    (message) => {

      if (
        message.room &&
        message.room !== currentRoom
      ) {
        return;
      }

      displayMessage(message);

    }
  );
}


// ==================================================
// メッセージ送信
// ==================================================

if (form) {

  form.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();

      if (!input) return;


      const message =
        input.value.trim();


      if (!message) {
        return;
      }


      socket.emit(
        "chat message",
        {
          room: currentRoom,
          text: message,
          username: username
        }
      );


      input.value = "";

      input.style.height = "50px";

      input.focus();

    }
  );

}


// ==================================================
// Enter送信
// ==================================================

if (input) {

  input.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();


        if (form) {
          form.requestSubmit();
        }

      }

    }
  );

}


// ==================================================
// メッセージ受信
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


    displayMessage(data);

  }
);


// ==================================================
// 部屋のメッセージ取得
// ==================================================

function loadRoomMessages(roomId) {

  if (!roomId) {
    return;
  }


  clearMessages();


  socket.emit(
    "get messages",
    {
      room: roomId
    }
  );

}


// ==================================================
// 部屋メッセージ受信
// ==================================================

socket.on(
  "room messages",
  (data) => {

    if (!data) {
      return;
    }


    if (
      data.room &&
      data.room !== currentRoom
    ) {
      return;
    }


    const list =
      data.messages ||
      data;


    displayMessages(list);

  }
);


// ==================================================
// 部屋一覧を取得
// ==================================================

function loadRooms() {

  socket.emit(
    "get rooms"
  );

}


// ==================================================
// 部屋一覧受信
// ==================================================

socket.on(
  "rooms list",
  (rooms) => {

    if (!roomList) {
      return;
    }


    if (!Array.isArray(rooms)) {
      return;
    }


    // 雑談以外を一旦削除

    roomList
      .querySelectorAll(
        ".channel[data-room]"
      )
      .forEach(
        (button) => {

          if (
            button.dataset.room !==
            "casual"
          ) {

            button.remove();

          }

        }
      );


    // DBから取得した部屋を追加

    rooms.forEach(
      (room) => {

        addRoomButton(
          room,
          false
        );

      }
    );


    // 保存していた部屋が存在するか確認

    const savedButton =
      document.querySelector(
        `[data-room="${currentRoom}"]`
      );


    if (savedButton) {

      savedButton.click();

    } else {

      const casual =
        document.querySelector(
          '[data-room="casual"]'
        );

      if (casual) {
        casual.click();
      }

    }

  }
);


// ==================================================
// 部屋ボタン作成
// ==================================================

function addRoomButton(
  room,
  owner = false
) {

  if (!room || !room.id || !roomList) {
    return null;
  }


  // すでにあるか確認

  let button =
    document.querySelector(
      `[data-room="${room.id}"]`
    );


  if (button) {

    button.dataset.name =
      room.name || "部屋";

    button.dataset.owner =
      owner ? "true" : button.dataset.owner;

    button.dataset.code =
      room.inviteCode ||
      room.invite_code ||
      room.code ||
      button.dataset.code ||
      "";

    button.textContent =
      "# " + (room.name || "部屋");

    return button;
  }


  button =
    document.createElement("button");


  button.type =
    "button";

  button.className =
    "channel";


  button.dataset.room =
    room.id;


  button.dataset.name =
    room.name || "部屋";


  button.dataset.owner =
    owner ? "true" : "false";


  button.dataset.code =
    room.inviteCode ||
    room.invite_code ||
    room.code ||
    "";


  button.textContent =
    "# " +
    (room.name || "部屋");


  roomList.appendChild(
    button
  );


  setupRoomButton(
    button
  );


  return button;
}


// ==================================================
// 部屋選択
// ==================================================

function selectRoom(button) {

  if (!button) {
    return;
  }


  // active解除

  document
    .querySelectorAll(
      ".channel"
    )
    .forEach(
      (roomButton) => {

        roomButton.classList.remove(
          "active"
        );

      }
    );


  // active

  button.classList.add(
    "active"
  );


  // 現在の部屋

  currentRoom =
    button.dataset.room;


  localStorage.setItem(
    "currentRoom",
    currentRoom
  );


  // ヘッダー

  if (chatHeaderTitle) {

    chatHeaderTitle.textContent =
      button.dataset.name ||
      "雑談";

  }


  // メッセージを読み込む

  loadRoomMessages(
    currentRoom
  );


  // 自分が作った部屋なら設定

  if (
    button.dataset.owner ===
    "true"
  ) {

    showRoomSettings(
      button
    );

  } else {

    hideRoomSettings();

  }

}


// ==================================================
// 部屋ボタンセットアップ
// ==================================================

function setupRoomButton(button) {

  if (!button) {
    return;
  }


  // 二重登録防止

  if (
    button.dataset.listenerAttached ===
    "true"
  ) {
    return;
  }


  button.dataset.listenerAttached =
    "true";


  button.addEventListener(
    "click",
    () => {

      selectRoom(
        button
      );

    }
  );

}


// ==================================================
// 雑談ルーム
// ==================================================

const casualRoom =
  document.querySelector(
    '[data-room="casual"]'
  );


if (casualRoom) {

  casualRoom.dataset.name =
    casualRoom.dataset.name ||
    "雑談";


  casualRoom.dataset.owner =
    "false";


  setupRoomButton(
    casualRoom
  );

}


// ==================================================
// 部屋作成モーダル
// ==================================================

const roomCreateModal =
  document.getElementById(
    "room-create-modal"
  );

const roomNameInput =
  document.getElementById(
    "room-name-input"
  );

const confirmRoomCreate =
  document.getElementById(
    "confirm-room-create"
  );

const cancelRoomCreate =
  document.getElementById(
    "cancel-room-create"
  );

const closeRoomCreate =
  document.getElementById(
    "close-room-create"
  );


// ==================================================
// 部屋作成モーダルを開く
// ==================================================

if (createRoomButton) {

  createRoomButton.addEventListener(
    "click",
    () => {

      if (!roomCreateModal) {
        return;
      }


      roomCreateModal.classList.add(
        "open"
      );


      if (roomNameInput) {

        roomNameInput.value = "";


        setTimeout(
          () => {

            roomNameInput.focus();

          },
          100
        );

      }

    }
  );

}


// ==================================================
// 部屋作成モーダルを閉じる
// ==================================================

function hideRoomCreateModal() {

  if (!roomCreateModal) {
    return;
  }


  roomCreateModal.classList.remove(
    "open"
  );

}


if (cancelRoomCreate) {

  cancelRoomCreate.addEventListener(
    "click",
    hideRoomCreateModal
  );

}


if (closeRoomCreate) {

  closeRoomCreate.addEventListener(
    "click",
    hideRoomCreateModal
  );

}


if (roomCreateModal) {

  roomCreateModal.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        roomCreateModal
      ) {

        hideRoomCreateModal();

      }

    }
  );

}


// ==================================================
// 部屋作成
// ==================================================

if (confirmRoomCreate) {

  confirmRoomCreate.addEventListener(
    "click",
    createRoom
  );

}


if (roomNameInput) {

  roomNameInput.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        createRoom();

      }

    }
  );

}


function createRoom() {

  if (!roomNameInput) {
    return;
  }


  const name =
    roomNameInput.value.trim();


  if (!name) {

    roomNameInput.focus();

    return;

  }


  socket.emit(
    "create room",
    {
      name: name
    }
  );

}


// ==================================================
// 部屋作成成功
// ==================================================

socket.on(
  "room created",
  (room) => {

    console.log(
      "部屋が作成されました:",
      room
    );


    if (!room) {
      return;
    }


    const button =
      addRoomButton(
        room,
        true
      );


    hideRoomCreateModal();


    if (button) {

      button.dataset.owner =
        "true";


      button.click();

    }

  }
);


// ==================================================
// 部屋作成エラー
// ==================================================

socket.on(
  "create room error",
  (data) => {

    console.error(
      "部屋作成エラー:",
      data
    );


    alert(
      data?.message ||
      data ||
      "部屋を作成できませんでした。"
    );

  }
);


// ==================================================
// 部屋参加モーダル
// ==================================================

const roomJoinModal =
  document.getElementById(
    "room-join-modal"
  );

const roomInviteInput =
  document.getElementById(
    "room-invite-input"
  );

const roomJoinError =
  document.getElementById(
    "room-join-error"
  );

const closeRoomJoin =
  document.getElementById(
    "close-room-join"
  );

const cancelRoomJoin =
  document.getElementById(
    "cancel-room-join"
  );

const confirmRoomJoin =
  document.getElementById(
    "confirm-room-join"
  );


// ==================================================
// 参加モーダルを開く
// ==================================================

if (joinRoomButton) {

  joinRoomButton.addEventListener(
    "click",
    openJoinModal
  );

}


function openJoinModal() {

  if (!roomJoinModal) {
    return;
  }


  roomJoinModal.classList.add(
    "open"
  );


  if (roomInviteInput) {

    roomInviteInput.value = "";


    setTimeout(
      () => {

        roomInviteInput.focus();

      },
      100
    );

  }


  if (roomJoinError) {

    roomJoinError.textContent =
      "";

  }

}


// ==================================================
// 参加モーダルを閉じる
// ==================================================

function closeJoinModal() {

  if (!roomJoinModal) {
    return;
  }


  roomJoinModal.classList.remove(
    "open"
  );

}


if (closeRoomJoin) {

  closeRoomJoin.addEventListener(
    "click",
    closeJoinModal
  );

}


if (cancelRoomJoin) {

  cancelRoomJoin.addEventListener(
    "click",
    closeJoinModal
  );

}


if (roomJoinModal) {

  roomJoinModal.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        roomJoinModal
      ) {

        closeJoinModal();

      }

    }
  );

}


// ==================================================
// 部屋参加
// ==================================================

if (confirmRoomJoin) {

  confirmRoomJoin.addEventListener(
    "click",
    joinRoom
  );

}


if (roomInviteInput) {

  roomInviteInput.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        joinRoom();

      }

    }
  );

}


function joinRoom() {

  if (!roomInviteInput) {
    return;
  }


  const code =
    roomInviteInput.value.trim();


  if (!code) {

    if (roomJoinError) {

      roomJoinError.textContent =
        "招待コードを入力してください。";

    }

    return;

  }


  if (roomJoinError) {

    roomJoinError.textContent =
      "";

  }


  socket.emit(
    "join room",
    {
      code: code
    }
  );

}


// ==================================================
// 部屋参加成功
// ==================================================

socket.on(
  "room joined",
  (room) => {

    console.log(
      "部屋に参加しました:",
      room
    );


    if (!room) {
      return;
    }


    const button =
      addRoomButton(
        room,
        false
      );


    if (button) {

      button.click();

    }


    closeJoinModal();

  }
);


// ==================================================
// 部屋参加エラー
// ==================================================

socket.on(
  "join room error",
  (data) => {

    console.error(
      "部屋参加エラー:",
      data
    );


    const message =
      typeof data === "string"
        ? data
        : data?.message ||
          "部屋に参加できませんでした。";


    if (roomJoinError) {

      roomJoinError.textContent =
        message;

    } else {

      alert(
        message
      );

    }

  }
);


// ==================================================
// 部屋設定
// ==================================================

const roomSettingsModal =
  document.getElementById(
    "room-settings-modal"
  );

const roomSettingsTitle =
  document.getElementById(
    "room-settings-title"
  );

const inviteCodeInput =
  document.getElementById(
    "invite-code"
  );

const closeRoomSettings =
  document.getElementById(
    "close-room-settings"
  );

const closeRoomSettingsBottom =
  document.getElementById(
    "close-room-settings-bottom"
  );

const copyInviteCode =
  document.getElementById(
    "copy-invite-code"
  );


// ==================================================
// 部屋設定表示
// ==================================================

function showRoomSettings(button) {

  if (!roomSettingsModal) {
    return;
  }


  const name =
    button.dataset.name ||
    "部屋";


  const code =
    button.dataset.code ||
    "";


  if (roomSettingsTitle) {

    roomSettingsTitle.textContent =
      name + " の設定";

  }


  if (inviteCodeInput) {

    inviteCodeInput.value =
      code;

  }


  roomSettingsModal.classList.add(
    "open"
  );

}


// ==================================================
// 部屋設定を閉じる
// ==================================================

function hideRoomSettings() {

  if (!roomSettingsModal) {
    return;
  }


  roomSettingsModal.classList.remove(
    "open"
  );

}


if (closeRoomSettings) {

  closeRoomSettings.addEventListener(
    "click",
    hideRoomSettings
  );

}


if (closeRoomSettingsBottom) {

  closeRoomSettingsBottom.addEventListener(
    "click",
    hideRoomSettings
  );

}


if (roomSettingsModal) {

  roomSettingsModal.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        roomSettingsModal
      ) {

        hideRoomSettings();

      }

    }
  );

}


// ==================================================
// 招待コードコピー
// ==================================================

if (copyInviteCode) {

  copyInviteCode.addEventListener(
    "click",
    async () => {

      const code =
        inviteCodeInput?.value ||
        "";


      if (!code) {
        return;
      }


      try {

        await navigator.clipboard.writeText(
          code
        );


        copyInviteCode.textContent =
          "✅ コピーしました";


        setTimeout(
          () => {

            copyInviteCode.textContent =
              "📋 コピー";

          },
          1500
        );


      } catch (error) {

        console.error(
          "コピー失敗:",
          error
        );


        alert(
          "コピーできませんでした。"
        );

      }

    }
  );

}


// ==================================================
// 設定パネル
// ==================================================

const settingsButton =
  document.getElementById(
    "settings-button"
  );

const settingsPanel =
  document.getElementById(
    "settings-panel"
  );

const closeSettings =
  document.getElementById(
    "close-settings"
  );


// ==================================================
// 設定を開く
// ==================================================

if (settingsButton) {

  settingsButton.addEventListener(
    "click",
    () => {

      if (!settingsPanel) {
        return;
      }


      settingsPanel.classList.add(
        "open"
      );

    }
  );

}


// ==================================================
// 設定を閉じる
// ==================================================

if (closeSettings) {

  closeSettings.addEventListener(
    "click",
    () => {

      if (!settingsPanel) {
        return;
      }


      settingsPanel.classList.remove(
        "open"
      );

    }
  );

}


if (settingsPanel) {

  settingsPanel.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        settingsPanel
      ) {

        settingsPanel.classList.remove(
          "open"
        );

      }

    }
  );

}


// ==================================================
// ユーザー名保存
// ==================================================

if (saveUsernameButton) {

  saveUsernameButton.addEventListener(
    "click",
    saveUsername
  );

}


if (usernameInput) {

  usernameInput.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        saveUsername();

      }

    }
  );

}


function saveUsername() {

  if (!usernameInput) {
    return;
  }


  const newUsername =
    usernameInput.value.trim();


  if (!newUsername) {

    if (usernameStatus) {

      usernameStatus.textContent =
        "ユーザー名を入力してください。";

    }

    return;

  }


  username =
    newUsername;


  localStorage.setItem(
    "username",
    username
  );


  if (usernameStatus) {

    usernameStatus.textContent =
      "✅ ユーザー名を保存しました";


    setTimeout(
      () => {

        usernameStatus.textContent =
          "";

      },
      1500
    );

  }

}


// ==================================================
// テーマ
// ==================================================

const themeButtons =
  document.querySelectorAll(
    ".theme-button"
  );


themeButtons.forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        const theme =
          button.dataset.theme;


        if (!theme) {
          return;
        }


        document.body.dataset.theme =
          theme;


        localStorage.setItem(
          "theme",
          theme
        );

      }
    );

  }
);


// ==================================================
// 保存したテーマ
// ==================================================

const savedTheme =
  localStorage.getItem(
    "theme"
  ) || "dark";


document.body.dataset.theme =
  savedTheme;


// ==================================================
// 言語
// ==================================================

const translations = {

  ja: {

    rooms: "ROOMS",

    settings: "設定",

    theme: "テーマ",

    language: "言語",

    send: "送信",

    placeholder:
      "メッセージを入力..."

  },


  en: {

    rooms: "ROOMS",

    settings: "Settings",

    theme: "Theme",

    language: "Language",

    send: "Send",

    placeholder:
      "Type a message..."

  }

};


// ==================================================
// 部屋名変更
// ==================================================

function updateRoomNames(
  language
) {

  const rooms =
    document.querySelectorAll(
      ".channel"
    );


  rooms.forEach(
    (room) => {

      if (
        room.dataset.room ===
        "casual"
      ) {

        const name =
          language === "en"
            ? "General"
            : "雑談";


        room.dataset.name =
          name;


        room.textContent =
          "# " + name;

      }

    }
  );


  const current =
    document.querySelector(
      ".channel.active"
    );


  if (
    current &&
    chatHeaderTitle
  ) {

    chatHeaderTitle.textContent =
      current.dataset.name;

  }

}


// ==================================================
// 言語変更
// ==================================================

function changeLanguage(
  language
) {

  const t =
    translations[language];


  if (!t) {
    return;
  }


  // ROOMS

  const channelTitle =
    document.querySelector(
      ".channel-title"
    );


  if (channelTitle) {

    channelTitle.textContent =
      t.rooms;

  }


  // 設定ボタン

  if (settingsButton) {

    settingsButton.textContent =
      "⚙ " + t.settings;

  }


  // 設定タイトル

  const settingsTitle =
    document.querySelector(
      ".settings-header h2"
    );


  if (settingsTitle) {

    settingsTitle.textContent =
      t.settings;

  }


  // 設定セクション

  const sections =
    document.querySelectorAll(
      ".settings-section h3"
    );


  if (sections[1]) {

    sections[1].textContent =
      "🎨 " + t.theme;

  }


  if (sections[2]) {

    sections[2].textContent =
      "🌐 " + t.language;

  }


  // 入力欄

  if (input) {

    input.placeholder =
      t.placeholder;

  }


  // 送信ボタン

  const sendButton =
    document.querySelector(
      "#form button"
    );


  if (sendButton) {

    sendButton.textContent =
      t.send;

  }


  // 部屋名

  updateRoomNames(
    language
  );

}


// ==================================================
// 言語ボタン
// ==================================================

const languageButtons =
  document.querySelectorAll(
    ".language-button"
  );


languageButtons.forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        const language =
          button.dataset.language;


        if (!language) {
          return;
        }


        localStorage.setItem(
          "language",
          language
        );


        changeLanguage(
          language
        );

      }
    );

  }
);


// ==================================================
// 保存した言語
// ==================================================

const savedLanguage =
  localStorage.getItem(
    "language"
  ) || "ja";


changeLanguage(
  savedLanguage
);


// ==================================================
// Socket.IO 接続
// ==================================================

socket.on(
  "connect",
  () => {

    console.log(
      "Veylo Socket.IO connected:",
      socket.id
    );


    // 部屋一覧を取得

    loadRooms();


    // 現在の部屋へ再参加

    if (
      currentRoom &&
      currentRoom !== "casual"
    ) {

      socket.emit(
        "restore room",
        {
          room: currentRoom
        }
      );

    } else {

      // 雑談

      const casual =
        document.querySelector(
          '[data-room="casual"]'
        );


      if (casual) {

        casual.click();

      }

    }

  }
);


// ==================================================
// Socket.IO 切断
// ==================================================

socket.on(
  "disconnect",
  () => {

    console.log(
      "Veylo Socket.IO disconnected"
    );

  }
);


// ==================================================
// ページ読み込み完了
// ==================================================

window.addEventListener(
  "load",
  () => {

    console.log(
      "Veylo app.js loaded"
    );

  }
);

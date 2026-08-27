// ==================================================
// Veylo - app.js
// 現在のHTML専用・完成版
// ==================================================

"use strict";


// ==================================================
// Socket.IO
// ==================================================

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

let currentRoom = "casual";


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
// 入力欄の高さ調整
// ==================================================

function resizeInput() {

  if (!input) {
    return;
  }

  input.style.height = "auto";

  const height =
    Math.min(input.scrollHeight, 180);

  input.style.height =
    height + "px";
}


if (input) {

  input.addEventListener(
    "input",
    resizeInput
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

      if (!input) {
        console.error("Veylo: #input が見つかりません。");
        return;
      }

      const text =
        input.value.trim();

      if (!text) {
        return;
      }

      if (!currentRoom) {
        console.error("Veylo: 現在の部屋がありません。");
        return;
      }

      console.log(
        "メッセージ送信:",
        {
          room: currentRoom,
          text: text,
          username: username
        }
      );

      socket.emit(
        "chat message",
        {
          room: currentRoom,
          text: text,
          username: username
        }
      );

      // 入力欄を空にする
      input.value = "";

      // 高さを初期化
      input.style.height = "50px";

      // フォーカス
      input.focus();

    }
  );

}


// ==================================================
// Enterキー送信
// Shift + Enter = 改行
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
// 時刻
// ==================================================

function formatMessageTime(dateValue) {

  if (!dateValue) {
    return "";
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const hours =
    String(
      date.getHours()
    ).padStart(2, "0");

  const minutes =
    String(
      date.getMinutes()
    ).padStart(2, "0");

  return `${hours}:${minutes}`;
}


// ==================================================
// メッセージ表示
// ==================================================

function displayMessage(data) {

  if (!messages || !data) {
    return;
  }

  // ------------------------------------------
  // 別の部屋のコメントは表示しない
  // ------------------------------------------

  if (
    data.room &&
    data.room !== currentRoom
  ) {
    return;
  }

  // ------------------------------------------
  // 重複防止
  // ------------------------------------------

  if (data.id) {

    const existing =
      messages.querySelector(
        `[data-message-id="${data.id}"]`
      );

    if (existing) {
      return;
    }

  }

  // ------------------------------------------
  // 自分のコメントか
  // ------------------------------------------

  const isMine =
    String(
      data.username || "ゲスト"
    ) === String(username);

  // ------------------------------------------
  // 外側
  // ------------------------------------------

  const wrapper =
    document.createElement("div");

  wrapper.className =
    isMine
      ? "message-wrapper mine"
      : "message-wrapper other";

  if (data.id) {

    wrapper.dataset.messageId =
      String(data.id);

  }

  // ------------------------------------------
  // 時刻
  // ------------------------------------------

  const time =
    document.createElement("div");

  time.className =
    "message-time";

  time.textContent =
    formatMessageTime(
      data.createdAt
    );

  // ------------------------------------------
  // ユーザー名
  // ------------------------------------------

  const name =
    document.createElement("div");

  name.className =
    "message-username";

  name.textContent =
    data.username || "ゲスト";

  // ------------------------------------------
  // 吹き出し
  // ------------------------------------------

  const bubble =
    document.createElement("div");

  bubble.className =
    "message-bubble";

  // ------------------------------------------
  // 本文
  // ------------------------------------------

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

  // ------------------------------------------
  // 一番下へ
  // ------------------------------------------

  messages.scrollTop =
    messages.scrollHeight;
}


// ==================================================
// 部屋のコメント表示
// ==================================================

function displayRoomMessages(roomMessages) {

  if (!messages) {
    return;
  }

  messages.innerHTML = "";

  if (
    !Array.isArray(roomMessages)
  ) {
    return;
  }

  roomMessages.forEach(
    (message) => {

      displayMessage(message);

    }
  );

  messages.scrollTop =
    messages.scrollHeight;
}


// ==================================================
// Socket.IO
// コメント受信
// ==================================================

socket.on(
  "chat message",
  (data) => {

    console.log(
      "コメント受信:",
      data
    );

    if (!data) {
      return;
    }

    if (
      data.room &&
      data.room !== currentRoom
    ) {
      return;
    }

    displayMessage(data);

  }
);


// ==================================================
// 過去コメント受信
// ==================================================

socket.on(
  "room messages",
  (data) => {

    console.log(
      "過去コメントを取得:",
      data
    );

    displayRoomMessages(data);

  }
);


// ==================================================
// 部屋コメント読み込み
// ==================================================

function loadRoomMessages(roomId) {

  if (!roomId) {
    return;
  }

  if (messages) {
    messages.innerHTML = "";
  }

  socket.emit(
    "load room messages",
    roomId
  );

}


// ==================================================
// 部屋ボタン設定
// ==================================================

function setupRoomButton(button) {

  if (!button) {
    return;
  }

  // 二重登録防止
  if (
    button.dataset.listenerAttached === "true"
  ) {
    return;
  }

  button.dataset.listenerAttached =
    "true";

  button.addEventListener(
    "click",
    () => {

      // ----------------------------------------
      // active解除
      // ----------------------------------------

      document
        .querySelectorAll(".channel")
        .forEach(
          (roomButton) => {

            roomButton.classList.remove(
              "active"
            );

          }
        );

      // ----------------------------------------
      // active
      // ----------------------------------------

      button.classList.add(
        "active"
      );

      // ----------------------------------------
      // 現在の部屋
      // ----------------------------------------

      currentRoom =
        button.dataset.room || "casual";

      console.log(
        "部屋を移動:",
        currentRoom
      );

      // ----------------------------------------
      // ヘッダー
      // ----------------------------------------

      if (chatHeaderTitle) {

        chatHeaderTitle.textContent =
          button.dataset.name || "雑談";

      }

      // ----------------------------------------
      // 部屋設定
      // ----------------------------------------

      if (
        button.dataset.owner === "true"
      ) {

        showRoomSettings(button);

      } else {

        hideRoomSettings();

      }

      // ----------------------------------------
      // コメント読み込み
      // ----------------------------------------

      loadRoomMessages(
        currentRoom
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
    casualRoom.dataset.name || "雑談";

  casualRoom.dataset.owner =
    casualRoom.dataset.owner || "false";

  setupRoomButton(
    casualRoom
  );

  casualRoom.classList.add(
    "active"
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
        event.target === roomCreateModal
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

      if (event.key === "Enter") {

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

    if (!room || !roomList) {
      return;
    }

    let button =
      document.querySelector(
        `[data-room="${CSS.escape(room.id)}"]`
      );

    // ----------------------------------------
    // 既に存在
    // ----------------------------------------

    if (button) {

      button.click();

      hideRoomCreateModal();

      return;

    }

    // ----------------------------------------
    // 部屋ボタン作成
    // ----------------------------------------

    button =
      document.createElement("button");

    button.type =
      "button";

    button.className =
      "channel";

    button.dataset.room =
      room.id;

    button.dataset.name =
      room.name;

    button.dataset.owner =
      "true";

    button.dataset.code =
      room.inviteCode ||
      room.code ||
      "";

    button.textContent =
      "# " + room.name;

    roomList.appendChild(
      button
    );

    setupRoomButton(
      button
    );

    hideRoomCreateModal();

    // 作成した部屋へ移動
    button.click();

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

    roomJoinError.textContent = "";

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
        event.target === roomJoinModal
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

      if (event.key === "Enter") {

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
    roomInviteInput.value
      .trim()
      .toUpperCase();

  if (!code) {

    if (roomJoinError) {

      roomJoinError.textContent =
        "招待コードを入力してください。";

    }

    return;

  }

  if (roomJoinError) {

    roomJoinError.textContent = "";

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

    if (!room || !roomList) {
      return;
    }

    let button =
      document.querySelector(
        `[data-room="${CSS.escape(room.id)}"]`
      );

    // ----------------------------------------
    // 部屋ボタンがない場合
    // ----------------------------------------

    if (!button) {

      button =
        document.createElement("button");

      button.type =
        "button";

      button.className =
        "channel";

      button.dataset.room =
        room.id;

      button.dataset.name =
        room.name;

      button.dataset.owner =
        String(
          room.owner === socket.id
        );

      button.dataset.code =
        room.inviteCode ||
        room.code ||
        "";

      button.textContent =
        "# " + room.name;

      roomList.appendChild(
        button
      );

      setupRoomButton(
        button
      );

    } else {

      // ----------------------------------------
      // 既存ボタンの情報を更新
      // ----------------------------------------

      button.dataset.name =
        room.name;

      button.dataset.owner =
        String(
          room.owner === socket.id
        );

      button.dataset.code =
        room.inviteCode ||
        room.code ||
        "";

      button.textContent =
        "# " + room.name;

    }

    // ----------------------------------------
    // 部屋選択
    // ----------------------------------------

    button.click();

    // ----------------------------------------
    // モーダル閉じる
    // ----------------------------------------

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

      alert(message);

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

  if (!roomSettingsModal || !button) {
    return;
  }

  const name =
    button.dataset.name || "部屋";

  const code =
    button.dataset.code || "";

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
// 部屋設定非表示
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
        event.target === roomSettingsModal
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
        inviteCodeInput?.value || "";

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
        event.target === settingsPanel
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

      if (event.key === "Enter") {

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
// 保存テーマ
// ==================================================

const savedTheme =
  localStorage.getItem("theme") || "dark";

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

function updateRoomNames(language) {

  const rooms =
    document.querySelectorAll(
      ".channel"
    );

  rooms.forEach(
    (room) => {

      if (
        room.dataset.room === "casual"
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
      current.dataset.name ||
      "雑談";

  }

}


// ==================================================
// 言語変更
// ==================================================

function changeLanguage(language) {

  const t =
    translations[language];

  if (!t) {
    return;
  }

  // ----------------------------------------
  // ROOMS
  // ----------------------------------------

  const channelTitle =
    document.querySelector(
      ".channel-title"
    );

  if (channelTitle) {

    channelTitle.textContent =
      t.rooms;

  }

  // ----------------------------------------
  // 設定ボタン
  // ----------------------------------------

  if (settingsButton) {

    settingsButton.textContent =
      "⚙ " + t.settings;

  }

  // ----------------------------------------
  // 設定タイトル
  // ----------------------------------------

  const settingsTitle =
    document.querySelector(
      ".settings-header h2"
    );

  if (settingsTitle) {

    settingsTitle.textContent =
      t.settings;

  }

  // ----------------------------------------
  // 設定セクション
  // ----------------------------------------

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

  // ----------------------------------------
  // 入力欄
  // ----------------------------------------

  if (input) {

    input.placeholder =
      t.placeholder;

  }

  // ----------------------------------------
  // 送信ボタン
  // ----------------------------------------

  const sendButton =
    document.querySelector(
      "#form button[type='submit']"
    );

  if (sendButton) {

    sendButton.textContent =
      t.send;

  }

  // ----------------------------------------
  // 部屋名
  // ----------------------------------------

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
// 保存言語
// ==================================================

const savedLanguage =
  localStorage.getItem("language") || "ja";

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

    // ----------------------------------------
    // 接続時は雑談へ
    // ----------------------------------------

    currentRoom =
      "casual";

    const casual =
      document.querySelector(
        '[data-room="casual"]'
      );

    if (casual) {

      document
        .querySelectorAll(".channel")
        .forEach(
          (button) => {

            button.classList.remove(
              "active"
            );

          }
        );

      casual.classList.add(
        "active"
      );

      if (chatHeaderTitle) {

        chatHeaderTitle.textContent =
          casual.dataset.name ||
          "雑談";

      }

    }

    // ----------------------------------------
    // 雑談コメント読み込み
    // ----------------------------------------

    loadRoomMessages(
      "casual"
    );

  }
);


// ==================================================
// Socket.IO 切断
// ==================================================

socket.on(
  "disconnect",
  (reason) => {

    console.log(
      "Veylo Socket.IO disconnected:",
      reason
    );

  }
);


// ==================================================
// Socket.IO 接続エラー
// ==================================================

socket.on(
  "connect_error",
  (error) => {

    console.error(
      "Veylo Socket.IO connection error:",
      error
    );

  }
);


// ==================================================
// 初期化完了
// ==================================================

console.log(
  "Veylo app.js loaded successfully."
);

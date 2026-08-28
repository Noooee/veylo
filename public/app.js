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

const casualRoomButton =
  document.getElementById("casualRoomButton");

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
  document.getElementById(
    "settingsUsernameInput"
  );

const closeSettingsButton =
  document.getElementById(
    "closeSettingsButton"
  );

const saveSettingsButton =
  document.getElementById(
    "saveSettingsButton"
  );

const themeToggleButton =
  document.getElementById(
    "themeToggleButton"
  );

const grayToggleButton =
  document.getElementById(
    "grayToggleButton"
  );

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
  localStorage.getItem(
    "veylo_dark_mode"
  ) === "true";

let grayMode =
  localStorage.getItem(
    "veylo_gray_mode"
  ) === "true";

let language =
  localStorage.getItem(
    "veylo_language"
  ) || "ja";


// ==================================================
// 24時間
// ==================================================

const MESSAGE_LIFETIME =
  24 * 60 * 60 * 1000;


// ==================================================
// 編集中メッセージ
// ==================================================

let editingMessageId = null;


// ==================================================
// ユーザー名
// ==================================================

function getCurrentUsername() {

  return (
    usernameInput?.value.trim() ||
    localStorage.getItem(
      "veylo_username"
    ) ||
    "ゲスト"
  );

}


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
// 保存済みユーザー名
// ==================================================

const savedUsername =
  localStorage.getItem(
    "veylo_username"
  );

if (
  savedUsername &&
  usernameInput
) {

  usernameInput.value =
    savedUsername;

}


// ==================================================
// メッセージ有効期限
// ==================================================

function isMessageValid(data) {

  if (!data) {
    return false;
  }


  if (!data.createdAt) {
    return true;
  }


  const created =
    new Date(
      data.createdAt
    ).getTime();


  if (
    Number.isNaN(created)
  ) {

    return true;

  }


  return (
    Date.now() - created <
    MESSAGE_LIFETIME
  );

}


// ==================================================
// LocalStorage古いコメント削除
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
// チャット送信
// ==================================================

messageForm.addEventListener(
  "submit",
  (event) => {

    event.preventDefault();


    const text =
      messageInput.value.trim();


    const username =
      getCurrentUsername();


    if (!text) {
      return;
    }


    // ==================================================
    // 編集中なら編集として送信
    // ==================================================

    if (
      editingMessageId !== null
    ) {

      socket.emit(
        "edit message",
        {

          id:
            editingMessageId,

          text:
            text,

          username:
            username

        }
      );


      cancelEditing();

      return;

    }


    // ==================================================
    // ユーザー名保存
    // ==================================================

    localStorage.setItem(
      "veylo_username",
      username
    );


    // ==================================================
    // 新規コメント送信
    // ==================================================

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


    if (
      data.room !==
      currentRoom
    ) {

      return;

    }


    if (
      !isMessageValid(data)
    ) {

      return;

    }


    addMessage(data);

    saveLocalMessage(data);

  }
);


// ==================================================
// 過去コメント受信
// ==================================================

socket.on(
  "previous messages",
  (data) => {

    if (
      !Array.isArray(data)
    ) {

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

          addMessage(
            message,
            false
          );

        }
      );


    if (
      currentRoom ===
      "casual"
    ) {

      saveAllLocalMessages(
        data
      );

    }


    scrollToBottom();

  }
);


// ==================================================
// メッセージ表示
// ==================================================

function addMessage(
  data,
  scroll = true
) {

  if (
    !isMessageValid(data)
  ) {

    return;

  }


  const message =
    document.createElement("div");


  message.className =
    "message";


  message.dataset.messageId =
    data.id;


  // ==================================================
  // ユーザー名
  // ==================================================

  const user =
    document.createElement("div");


  user.className =
    "message-user";


  user.textContent =
    data.username ||
    "ゲスト";


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


  // ==================================================
  // 編集済み表示
  // ==================================================

  if (data.edited) {

    const edited =
      document.createElement("span");


    edited.className =
      "message-edited";


    edited.textContent =
      "編集済み";


    message.appendChild(
      edited
    );

  }


  // ==================================================
  // メッセージ内容
  // ==================================================

  message.appendChild(
    user
  );

  message.appendChild(
    text
  );

  message.appendChild(
    time
  );


  // ==================================================
  // 操作ボタン
  // ==================================================

  const actions =
    createMessageActions(
      data
    );


  if (actions) {

    message.appendChild(
      actions
    );

  }


  // ==================================================
  // 画面へ追加
  // ==================================================

  messages.appendChild(
    message
  );


  if (scroll) {

    scrollToBottom();

  }

}


// ==================================================
// 編集・削除ボタン作成
// ==================================================

function createMessageActions(
  data
) {

  const username =
    getCurrentUsername();


  // ==================================================
  // 自分のコメントか確認
  // ==================================================

  if (
    !data.username ||
    data.username !==
    username
  ) {

    return null;

  }


  const actions =
    document.createElement("div");


  actions.className =
    "message-actions";


  // ==================================================
  // 編集ボタン
  // ==================================================

  const editButton =
    document.createElement("button");


  editButton.type =
    "button";


  editButton.className =
    "message-action edit";


  editButton.textContent =
    "✏️ 編集";


  editButton.addEventListener(
    "click",
    () => {

      startEditing(
        data
      );

    }
  );


  // ==================================================
  // 削除ボタン
  // ==================================================

  const deleteButton =
    document.createElement("button");


  deleteButton.type =
    "button";


  deleteButton.className =
    "message-action delete";


  deleteButton.textContent =
    "🗑️ 削除";


  deleteButton.addEventListener(
    "click",
    () => {

      deleteMessage(
        data
      );

    }
  );


  actions.appendChild(
    editButton
  );

  actions.appendChild(
    deleteButton
  );


  return actions;

}


// ==================================================
// メッセージ編集開始
// ==================================================

function startEditing(
  data
) {

  if (!data) {
    return;
  }


  editingMessageId =
    data.id;


  messageInput.value =
    data.text || "";


  messageInput.focus();


  messageInput.select();


  // ==================================================
  // 編集中表示
  // ==================================================

  messageForm.classList.add(
    "editing"
  );


  console.log(
    "コメント編集開始:",
    data.id
  );

}


// ==================================================
// 編集キャンセル
// ==================================================

function cancelEditing() {

  editingMessageId =
    null;


  messageInput.value =
    "";


  messageForm.classList.remove(
    "editing"
  );


  messageInput.focus();

}


// ==================================================
// コメント削除
// ==================================================

function deleteMessage(
  data
) {

  if (!data) {
    return;
  }


  const username =
    getCurrentUsername();


  if (
    data.username !==
    username
  ) {

    alert(
      "自分のコメントだけ削除できます。"
    );

    return;

  }


  const confirmed =
    window.confirm(
      "このコメントを削除しますか？"
    );


  if (!confirmed) {
    return;
  }


  socket.emit(
    "delete message",
    {

      id:
        data.id,

      username:
        username

    }
  );

}


// ==================================================
// 編集成功
// ==================================================

socket.on(
  "message edited",
  (data) => {

    if (!data) {
      return;
    }


    updateMessageElement(
      data
    );


    if (
      currentRoom ===
      "casual"
    ) {

      updateLocalMessage(
        data
      );

    }


    // 自分が編集した場合
    // 入力欄をクリア

    if (
      editingMessageId ===
      data.id
    ) {

      cancelEditing();

    }

  }
);


// ==================================================
// 編集エラー
// ==================================================

socket.on(
  "message edit error",
  (data) => {

    alert(
      data?.message ||
      "コメントを編集できませんでした。"
    );

  }
);


// ==================================================
// 削除成功
// ==================================================

socket.on(
  "message deleted",
  (data) => {

    if (!data) {
      return;
    }


    removeMessageElement(
      data.id
    );


    if (
      currentRoom ===
      "casual"
    ) {

      removeLocalMessage(
        data.id
      );

    }


    if (
      editingMessageId ===
      data.id
    ) {

      cancelEditing();

    }

  }
);


// ==================================================
// 削除エラー
// ==================================================

socket.on(
  "message delete error",
  (data) => {

    alert(
      data?.message ||
      "コメントを削除できませんでした。"
    );

  }
);


// ==================================================
// メッセージ表示更新
// ==================================================

function updateMessageElement(
  data
) {

  const element =
    messages.querySelector(
      `.message[data-message-id="${data.id}"]`
    );


  if (!element) {

    // 現在画面にない場合は
    // 追加

    if (
      data.room ===
      currentRoom
    ) {

      addMessage(
        data
      );

    }

    return;

  }


  element.innerHTML = "";


  // ==================================================
  // ユーザー名
  // ==================================================

  const user =
    document.createElement("div");


  user.className =
    "message-user";


  user.textContent =
    data.username ||
    "ゲスト";


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


  // ==================================================
  // 編集済み
  // ==================================================

  const edited =
    document.createElement("span");


  edited.className =
    "message-edited";


  edited.textContent =
    "編集済み";


  // ==================================================
  // 再構築
  // ==================================================

  element.appendChild(
    user
  );

  element.appendChild(
    text
  );

  element.appendChild(
    time
  );

  element.appendChild(
    edited
  );


  const actions =
    createMessageActions(
      data
    );


  if (actions) {

    element.appendChild(
      actions
    );

  }

}


// ==================================================
// メッセージ画面から削除
// ==================================================

function removeMessageElement(
  id
) {

  const element =
    messages.querySelector(
      `.message[data-message-id="${id}"]`
    );


  if (element) {

    element.remove();

  }

}


// ==================================================
// 時刻
// ==================================================

function formatTime(
  value
) {

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

      hour:
        "2-digit",

      minute:
        "2-digit"

    }
  );

}


// ==================================================
// LocalStorage保存
// ==================================================

function saveLocalMessage(
  data
) {

  if (
    !data ||
    data.room !==
    "casual"
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


  if (
    !isMessageValid(data)
  ) {

    return;

  }


  const exists =
    stored.some(
      (item) => {

        return (
          String(item.id) ===
          String(data.id)
        );

      }
    );


  if (exists) {

    // 編集などで更新された場合

    stored =
      stored.map(
        (item) => {

          if (
            String(item.id) ===
            String(data.id)
          ) {

            return data;

          }

          return item;

        }
      );

  } else {

    stored.push(data);

  }


  stored =
    stored.filter(
      (item) =>
        isMessageValid(item)
    );


  if (
    stored.length > 1000
  ) {

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
// LocalStorage一括保存
// ==================================================

function saveAllLocalMessages(
  data
) {

  if (
    !Array.isArray(data)
  ) {

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
// LocalStorageコメント更新
// ==================================================

function updateLocalMessage(
  data
) {

  if (
    !data ||
    data.room !==
    "casual"
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


  stored =
    stored.map(
      (item) => {

        if (
          String(item.id) ===
          String(data.id)
        ) {

          return data;

        }

        return item;

      }
    );


  localStorage.setItem(
    "veylo_casual_messages",
    JSON.stringify(stored)
  );

}


// ==================================================
// LocalStorageコメント削除
// ==================================================

function removeLocalMessage(
  id
) {

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


  stored =
    stored.filter(
      (item) =>
        String(item.id) !==
        String(id)
    );


  localStorage.setItem(
    "veylo_casual_messages",
    JSON.stringify(stored)
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

        addMessage(
          data,
          false
        );

      }
    );


  scrollToBottom();

}


// ==================================================
// 一番上へ
// ==================================================

function scrollToTop() {

  messages.scrollTo({

    top: 0,

    behavior: "smooth"

  });

}


// ==================================================
// 一番下へ
// ==================================================

function scrollToBottom() {

  messages.scrollTo({

    top:
      messages.scrollHeight,

    behavior: "smooth"

  });

}


// ==================================================
// 部屋作成
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
        name:
          name
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


    socket.emit(
      "join room",
      {
        code:
          room.inviteCode
      }
    );

  }
);


// ==================================================
// 雑談ボタン
// ==================================================

if (casualRoomButton) {

  casualRoomButton.addEventListener(
    "click",
    () => {

      goToCasual();

    }
  );

}


// ==================================================
// 雑談へ戻る
// ==================================================

if (backToCasualButton) {

  backToCasualButton.addEventListener(
    "click",
    () => {

      goToCasual();

    }
  );

}


// ==================================================
// 雑談へ移動
// ==================================================

function goToCasual() {

  if (
    currentRoom ===
    "casual"
  ) {

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


// ==================================================
// 雑談参加完了
// ==================================================

socket.on(
  "casual joined",
  () => {

    messages.innerHTML = "";

    loadLocalMessages();

  }
);


// ==================================================
// 雑談ボタン表示
// ==================================================

function updateBackToCasualButton() {

  if (
    !backToCasualButton
  ) {

    return;

  }


  if (
    currentRoom ===
    "casual"
  ) {

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
// 部屋参加
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
        code:
          code
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

if (settingsButton) {

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

}


// ==================================================
// 設定を閉じる
// ==================================================

if (closeSettingsButton) {

  closeSettingsButton.addEventListener(
    "click",
    () => {

      settingsModal.classList.add(
        "hidden"
      );

    }
  );

}


// ==================================================
// ダークモード
// ==================================================

if (themeToggleButton) {

  themeToggleButton.addEventListener(
    "click",
    () => {

      darkMode =
        !darkMode;

      updateTheme();

    }
  );

}


// ==================================================
// グレーモード
// ==================================================

if (grayToggleButton) {

  grayToggleButton.addEventListener(
    "click",
    () => {

      grayMode =
        !grayMode;

      updateTheme();

    }
  );

}


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


  if (
    themeToggleButton
  ) {

    themeToggleButton.textContent =
      darkMode ?
      "ON" :
      "OFF";


    themeToggleButton.classList.toggle(
      "active",
      darkMode
    );

  }


  if (
    grayToggleButton
  ) {

    grayToggleButton.textContent =
      grayMode ?
      "ON" :
      "OFF";


    grayToggleButton.classList.toggle(
      "active",
      grayMode
    );

  }


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

if (saveSettingsButton) {

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


      updateTheme();


      settingsModal.classList.add(
        "hidden"
      );

    }
  );

}


// ==================================================
// Enter：部屋作成
// ==================================================

roomNameInput.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key ===
      "Enter"
    ) {

      event.preventDefault();

      confirmCreateButton.click();

    }

  }
);


// ==================================================
// Enter：部屋参加
// ==================================================

inviteCodeInput.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key ===
      "Enter"
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
      event.target ===
      createModal
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
      event.target ===
      joinModal
    ) {

      joinModal.classList.add(
        "hidden"
      );

    }

  }
);


if (settingsModal) {

  settingsModal.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        settingsModal
      ) {

        settingsModal.classList.add(
          "hidden"
        );

      }

    }
  );

}


// ==================================================
// Escキー
//
// 編集中なら編集をキャンセル
// ==================================================

document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key ===
      "Escape" &&
      editingMessageId !== null
    ) {

      cancelEditing();

    }

  }
);


// ==================================================
// 初期化
// ==================================================

cleanupLocalMessages();

loadLocalMessages();

updateTheme();

updateBackToCasualButton();


// ==================================================
// 10分ごとに古いコメントを掃除
// ==================================================

setInterval(
  () => {

    cleanupLocalMessages();

  },
  10 * 60 * 1000
);


// ==================================================
// 5秒ごとに表示中コメントの期限確認
// ==================================================

setInterval(
  () => {

    const elements =
      messages.querySelectorAll(
        ".message"
      );


    elements.forEach(
      (element) => {

        const id =
          element.dataset.messageId;


        if (!id) {
          return;
        }


        // LocalStorage側で
        // 期限切れを掃除

        cleanupLocalMessages();

      }
    );

  },
  5 * 1000
);


// ==================================================
// 上へ・下へボタン
//
// HTML側に以下のIDがあれば自動的に使用します:
//
// scrollTopButton
// scrollBottomButton
// ==================================================

const scrollTopButton =
  document.getElementById(
    "scrollTopButton"
  );

const scrollBottomButton =
  document.getElementById(
    "scrollBottomButton"
  );


if (scrollTopButton) {

  scrollTopButton.addEventListener(
    "click",
    () => {

      scrollToTop();

    }
  );

}


if (scrollBottomButton) {

  scrollBottomButton.addEventListener(
    "click",
    () => {

      scrollToBottom();

    }
  );

}

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
// 雑談ルーム
// ==================================================

const casualRoomButton =
  document.getElementById("casualRoomButton");


// ==================================================
// 現在の部屋
// ==================================================

let currentRoom = "casual";


// ==================================================
// 返信対象
//
// replyTarget に返信するコメントを保存します。
// ==================================================

let replyTarget = null;


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

if (
  savedUsername &&
  usernameInput
) {

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
// 初期コメント読み込み
// ==================================================

loadLocalMessages();


// ==================================================
// 返信対象を設定
// ==================================================

function setReplyTarget(data) {

  if (!data) {
    return;
  }


  replyTarget = {

    id:
      data.id,

    username:
      data.username || "ゲスト",

    text:
      data.text || ""

  };


  // 入力欄にフォーカス

  messageInput.focus();


  // プレースホルダー変更

  messageInput.placeholder =
    `${replyTarget.username}さんに返信...`;


  console.log(
    "返信対象:",
    replyTarget
  );

}


// ==================================================
// 返信解除
// ==================================================

function clearReplyTarget() {

  replyTarget = null;


  messageInput.placeholder =
    "メッセージを入力...";


  messageInput.focus();

}


// ==================================================
// 返信対象の表示名
// ==================================================

function createReplyInfo(data) {

  if (
    !data.replyTo &&
    !data.replyToId
  ) {

    return null;

  }


  const replyId =
    data.replyToId ||
    data.replyTo?.id;


  const replyUsername =
    data.replyToUsername ||
    data.replyTo?.username ||
    "ゲスト";


  const replyText =
    data.replyToText ||
    data.replyTo?.text ||
    "";


  const wrapper =
    document.createElement("div");

  wrapper.className =
    "message-reply-info";


  // ==================================================
  // 返信アイコン
  // ==================================================

  const icon =
    document.createElement("span");

  icon.className =
    "reply-icon";

  icon.textContent =
    "↩";


  // ==================================================
  // 説明
  // ==================================================

  const label =
    document.createElement("span");

  label.className =
    "reply-label";


  label.textContent =
    `${replyUsername}さんの「${replyText}」に返信`;


  wrapper.appendChild(icon);

  wrapper.appendChild(label);


  // ==================================================
  // クリックすると返信先へ移動
  // ==================================================

  if (replyId) {

    wrapper.classList.add(
      "reply-clickable"
    );


    wrapper.addEventListener(
      "click",
      () => {

        scrollToMessage(
          replyId
        );

      }
    );

  }


  return wrapper;

}


// ==================================================
// メッセージへスクロール
// ==================================================

function scrollToMessage(id) {

  if (!id) {
    return;
  }


  const target =
    document.querySelector(
      `[data-message-id="${id}"]`
    );


  if (!target) {

    console.log(
      "返信先コメントが見つかりません:",
      id
    );

    return;

  }


  target.scrollIntoView({

    behavior: "smooth",

    block: "center"

  });


  target.classList.add(
    "message-highlight"
  );


  setTimeout(
    () => {

      target.classList.remove(
        "message-highlight"
      );

    },
    1500
  );

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
      usernameInput.value.trim() ||
      "ゲスト";


    if (!text) {
      return;
    }


    localStorage.setItem(
      "veylo_username",
      username
    );


    const messageData = {

      room:
        currentRoom,

      text:
        text,

      username:
        username

    };


    // ==================================================
    // 返信情報
    // ==================================================

    if (
      replyTarget &&
      replyTarget.id
    ) {

      messageData.replyToId =
        replyTarget.id;

      messageData.replyToUsername =
        replyTarget.username;

      messageData.replyToText =
        replyTarget.text;

    }


    socket.emit(
      "chat message",
      messageData
    );


    messageInput.value = "";


    clearReplyTarget();

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

  }
);


// ==================================================
// メッセージ表示
// ==================================================

function addMessage(
  data,
  scrollToBottom = true
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


  // ==================================================
  // ID
  // ==================================================

  if (data.id) {

    message.dataset.messageId =
      data.id;

  }


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
  // 返信情報
  // ==================================================

  const replyInfo =
    createReplyInfo(data);


  if (replyInfo) {

    message.appendChild(
      replyInfo
    );

  }


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
  // メッセージ本文エリア
  // ==================================================

  const content =
    document.createElement("div");

  content.className =
    "message-content";


  content.appendChild(
    text
  );

  content.appendChild(
    time
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
      "（編集済み）";

    content.appendChild(
      edited
    );

  }


  // ==================================================
  // ボタンエリア
  // ==================================================

  const actions =
    document.createElement("div");

  actions.className =
    "message-actions";


  // ==================================================
  // 返信
  // ==================================================

  const replyButton =
    document.createElement("button");

  replyButton.type =
    "button";

  replyButton.className =
    "message-action reply-action";

  replyButton.textContent =
    "↩️ 返信";


  replyButton.addEventListener(
    "click",
    () => {

      setReplyTarget(
        data
      );

    }
  );


  actions.appendChild(
    replyButton
  );


  // ==================================================
  // 現在のユーザー名
  // ==================================================

  const currentUsername =
    usernameInput?.value.trim() ||
    localStorage.getItem(
      "veylo_username"
    ) ||
    "";


  // ==================================================
  // 自分のコメントなら編集・削除
  // ==================================================

  if (
    data.username ===
    currentUsername
  ) {

    // ==================================================
    // 編集
    // ==================================================

    const editButton =
      document.createElement("button");

    editButton.type =
      "button";

    editButton.className =
      "message-action edit-action";

    editButton.textContent =
      "✏️ 編集";


    editButton.addEventListener(
      "click",
      () => {

        startEditingMessage(
          data,
          message
        );

      }
    );


    // ==================================================
    // 削除
    // ==================================================

    const deleteButton =
      document.createElement("button");

    deleteButton.type =
      "button";

    deleteButton.className =
      "message-action delete-action";

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

  }


  // ==================================================
  // DOMへ追加
  // ==================================================

  message.appendChild(
    user
  );

  message.appendChild(
    content
  );

  message.appendChild(
    actions
  );


  messages.appendChild(
    message
  );


  // ==================================================
  // 下へスクロール
  // ==================================================

  if (scrollToBottom) {

    messages.scrollTop =
      messages.scrollHeight;

  }

}


// ==================================================
// 編集開始
// ==================================================

function startEditingMessage(
  data,
  messageElement
) {

  const currentText =
    data.text || "";


  const input =
    document.createElement("input");

  input.type =
    "text";

  input.className =
    "message-edit-input";

  input.maxLength =
    500;

  input.value =
    currentText;


  const editActions =
    document.createElement("div");

  editActions.className =
    "message-edit-actions";


  const saveButton =
    document.createElement("button");

  saveButton.type =
    "button";

  saveButton.className =
    "message-edit-save";

  saveButton.textContent =
    "保存";


  const cancelButton =
    document.createElement("button");

  cancelButton.type =
    "button";

  cancelButton.className =
    "message-edit-cancel";

  cancelButton.textContent =
    "キャンセル";


  editActions.appendChild(
    saveButton
  );

  editActions.appendChild(
    cancelButton
  );


  const content =
    messageElement.querySelector(
      ".message-content"
    );


  const actions =
    messageElement.querySelector(
      ".message-actions"
    );


  if (content) {

    content.innerHTML = "";

    content.appendChild(
      input
    );

    content.appendChild(
      editActions
    );

  }


  if (actions) {

    actions.classList.add(
      "hidden"
    );

  }


  input.focus();

  input.select();


  // ==================================================
  // 保存
  // ==================================================

  const save = () => {

    const newText =
      input.value.trim();


    if (!newText) {

      alert(
        "メッセージを入力してください。"
      );

      return;

    }


    socket.emit(
      "edit message",
      {

        id:
          data.id,

        text:
          newText,

        username:
          usernameInput.value.trim() ||
          localStorage.getItem(
            "veylo_username"
          ) ||
          ""

      }
    );

  };


  saveButton.addEventListener(
    "click",
    save
  );


  cancelButton.addEventListener(
    "click",
    () => {

      refreshCurrentRoom();

    }
  );


  input.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        save();

      }


      if (
        event.key === "Escape"
      ) {

        refreshCurrentRoom();

      }

    }
  );

}


// ==================================================
// メッセージ削除
// ==================================================

function deleteMessage(data) {

  if (!data?.id) {
    return;
  }


  const confirmed =
    confirm(
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
        usernameInput.value.trim() ||
        localStorage.getItem(
          "veylo_username"
        ) ||
        ""

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


    const target =
      document.querySelector(
        `[data-message-id="${data.id}"]`
      );


    if (!target) {
      return;
    }


    const content =
      target.querySelector(
        ".message-content"
      );


    if (!content) {
      return;
    }


    content.innerHTML = "";


    const text =
      document.createElement("span");

    text.className =
      "message-text";

    text.textContent =
      data.text;


    const time =
      document.createElement("span");

    time.className =
      "message-time";

    time.textContent =
      formatTime(
        data.createdAt
      );


    const edited =
      document.createElement("span");

    edited.className =
      "message-edited";

    edited.textContent =
      "（編集済み）";


    content.appendChild(
      text
    );

    content.appendChild(
      time
    );

    content.appendChild(
      edited
    );


    // ==================================================
    // LocalStorage更新
    // ==================================================

    updateLocalMessage(
      data
    );


    console.log(
      "コメント編集反映:",
      data
    );

  }
);


// ==================================================
// 削除成功
// ==================================================

socket.on(
  "message deleted",
  (data) => {

    if (!data?.id) {
      return;
    }


    const target =
      document.querySelector(
        `[data-message-id="${data.id}"]`
      );


    if (target) {

      target.remove();

    }


    removeLocalMessage(
      data.id
    );


    console.log(
      "コメント削除反映:",
      data.id
    );

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
// 現在の部屋を再読み込み
// ==================================================

function refreshCurrentRoom() {

  messages.innerHTML = "";


  if (
    currentRoom ===
    "casual"
  ) {

    socket.emit(
      "join casual"
    );

    return;

  }


  // ==================================================
  // 部屋の場合はサーバーへ
  // ==================================================

  socket.emit(
    "request room messages",
    {
      room:
        currentRoom
    }
  );

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

function saveLocalMessage(data) {

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
            item.id ===
            data.id
          );

        }


        return (
          item.text ===
            data.text &&
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


  stored.push(
    data
  );


  stored =
    stored.filter(
      (item) =>
        isMessageValid(item)
    );


  if (
    stored.length >
    1000
  ) {

    stored =
      stored.slice(
        stored.length - 1000
      );

  }


  localStorage.setItem(
    "veylo_casual_messages",
    JSON.stringify(
      stored
    )
  );

}


// ==================================================
// LocalStorage全更新
// ==================================================

function saveAllLocalMessages(data) {

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
// LocalStorage編集更新
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


  const index =
    stored.findIndex(
      (item) =>
        String(item.id) ===
        String(data.id)
    );


  if (
    index === -1
  ) {

    return;

  }


  stored[index] = {

    ...stored[index],

    text:
      data.text,

    edited:
      true

  };


  localStorage.setItem(
    "veylo_casual_messages",
    JSON.stringify(
      stored
    )
  );

}


// ==================================================
// LocalStorage削除
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
    JSON.stringify(
      stored
    )
  );

}


// ==================================================
// 雑談ルームへ戻る
// ==================================================

casualRoomButton.addEventListener(
  "click",
  () => {

    currentRoom =
      "casual";


    roomName.textContent =
      "雑談";


    inviteArea.classList.add(
      "hidden"
    );


    clearReplyTarget();


    messages.innerHTML =
      "";


    loadLocalMessages();


    updateBackToCasualButton();


    socket.emit(
      "join casual"
    );


    console.log(
      "雑談ルームへ戻りました"
    );

  }
);


// ==================================================
// 雑談へ戻る
// ==================================================

backToCasualButton.addEventListener(
  "click",
  () => {

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


    clearReplyTarget();


    messages.innerHTML =
      "";


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

    messages.innerHTML =
      "";

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
// 部屋作成
// ==================================================

createRoomButton.addEventListener(
  "click",
  () => {

    roomNameInput.value =
      "";

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


    messages.innerHTML =
      "";


    clearReplyTarget();


    updateBackToCasualButton();


    alert(
      `部屋を作成しました。\n\n招待コード: ${room.inviteCode}`
    );

  }
);


// ==================================================
// 部屋参加
// ==================================================

joinRoomButton.addEventListener(
  "click",
  () => {

    inviteCodeInput.value =
      "";

    joinError.textContent =
      "";

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


    messages.innerHTML =
      "";


    clearReplyTarget();


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
// 設定
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
    darkMode
      ? "ON"
      : "OFF";


  grayToggleButton.textContent =
    grayMode
      ? "ON"
      : "OFF";


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


    updateTheme();


    settingsModal.classList.add(
      "hidden"
    );

  }
);


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


// ==================================================
// 初期設定
// ==================================================

updateTheme();

updateBackToCasualButton();

cleanupLocalMessages();


// ==================================================
// 10分ごとにブラウザ側も掃除
// ==================================================

setInterval(
  () => {

    cleanupLocalMessages();

  },
  10 * 60 * 1000
);

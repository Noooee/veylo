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
// 雑談ルームへ戻る
// ==================================================

const casualRoomButton =
  document.getElementById("casualRoomButton");

const backToCasualButton =
  document.getElementById("backToCasualButton");


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
  document.getElementById(
    "languageSelect"
  );


// ==================================================
// 現在の部屋
// ==================================================

let currentRoom =
  "casual";


// ==================================================
// 24時間
// ==================================================

const MESSAGE_LIFETIME =
  24 * 60 * 60 * 1000;


// ==================================================
// ユーザーID
// ==================================================
//
// ブラウザごとに固有IDを作ります。
// 編集・削除の本人確認に使用します。
// ==================================================

let userId =
  localStorage.getItem(
    "veylo_user_id"
  );


if (!userId) {

  userId =
    generateUserId();

  localStorage.setItem(
    "veylo_user_id",
    userId
  );

}


function generateUserId() {

  if (
    window.crypto &&
    crypto.randomUUID
  ) {

    return crypto.randomUUID();

  }


  return (
    "user-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .substring(2, 12)
  );

}


// ==================================================
// 返信中のコメント
// ==================================================

let replyingTo = null;


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
// ユーザー名読み込み
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
// 接続
// ==================================================

socket.on(
  "connect",
  () => {

    console.log(
      "Veylo Socket.IO connected:",
      socket.id
    );

  }
);


// ==================================================
// 24時間以内か確認
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
// LocalStorage読み込み
// ==================================================

loadLocalMessages();


// ==================================================
// メッセージ送信
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

        room:
          currentRoom,

        text:
          text,

        username:
          username,

        userId:
          userId,

        replyTo:
          replyingTo
            ? replyingTo.id
            : null

      }
    );


    messageInput.value = "";


    cancelReply();


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

          addMessage(message);

        }
      );


    if (
      currentRoom === "casual"
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

function addMessage(data) {

  if (
    !isMessageValid(data)
  ) {

    return;

  }


  const message =
    document.createElement(
      "div"
    );


  message.className =
    "message";


  message.dataset.messageId =
    data.id;


  // ==================================================
  // ユーザー名
  // ==================================================

  const user =
    document.createElement(
      "div"
    );


  user.className =
    "message-user";


  user.textContent =
    data.username ||
    "ゲスト";


  // ==================================================
  // 本文
  // ==================================================

  const text =
    document.createElement(
      "span"
    );


  text.className =
    "message-text";


  text.textContent =
    data.text;


  // ==================================================
  // 時刻
  // ==================================================

  const time =
    document.createElement(
      "span"
    );


  time.className =
    "message-time";


  time.textContent =
    formatTime(
      data.createdAt
    );


  // ==================================================
  // 編集済み表示
  // ==================================================

  const edited =
    document.createElement(
      "span"
    );


  edited.className =
    "message-edited";


  if (data.updatedAt) {

    edited.textContent =
      "編集済み";

  }


  // ==================================================
  // 本文エリア
  // ==================================================

  const content =
    document.createElement(
      "div"
    );


  content.className =
    "message-content";


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
  // リプライ元表示
  // ==================================================

  if (data.replyTo) {

    const reply =
      createReplyReference(
        data.replyTo
      );


    message.appendChild(
      reply
    );

  }


  message.appendChild(
    user
  );


  message.appendChild(
    content
  );


  // ==================================================
  // 操作ボタン
  // ==================================================

  const actions =
    document.createElement(
      "div"
    );


  actions.className =
    "message-actions";


  // --------------------------------------------------
  // 返信
  // --------------------------------------------------

  const replyButton =
    document.createElement(
      "button"
    );


  replyButton.type =
    "button";


  replyButton.className =
    "message-action-button";


  replyButton.textContent =
    "↩️ 返信";


  replyButton.addEventListener(
    "click",
    () => {

      startReply(
        data
      );

    }
  );


  actions.appendChild(
    replyButton
  );


  // --------------------------------------------------
  // 自分のコメントだけ編集・削除
  // --------------------------------------------------

  if (
    data.userId ===
    userId
  ) {

    const editButton =
      document.createElement(
        "button"
      );


    editButton.type =
      "button";


    editButton.className =
      "message-action-button";


    editButton.textContent =
      "✏️ 編集";


    editButton.addEventListener(
      "click",
      () => {

        startEdit(
          data
        );

      }
    );


    actions.appendChild(
      editButton
    );


    const deleteButton =
      document.createElement(
        "button"
      );


    deleteButton.type =
      "button";


    deleteButton.className =
      "message-action-button delete";


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
      deleteButton
    );

  }


  message.appendChild(
    actions
  );


  messages.appendChild(
    message
  );


  scrollToBottom();

}


// ==================================================
// リプライ元表示
// ==================================================

function createReplyReference(
  replyToId
) {

  const reference =
    document.createElement(
      "div"
    );


  reference.className =
    "reply-reference";


  const target =
    findMessageElement(
      replyToId
    );


  if (target) {

    const targetUser =
      target.querySelector(
        ".message-user"
      );


    const targetText =
      target.querySelector(
        ".message-text"
      );


    reference.textContent =
      `↩ ${targetUser?.textContent || "ユーザー"}: ${
        targetText?.textContent || ""
      }`;

  } else {

    reference.textContent =
      "↩ 元のメッセージ";

  }


  reference.addEventListener(
    "click",
    () => {

      const target =
        findMessageElement(
          replyToId
        );


      if (target) {

        target.scrollIntoView({
          behavior:
            "smooth",

          block:
            "center"
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
          1200
        );

      }

    }
  );


  return reference;

}


// ==================================================
// リプライ開始
// ==================================================

function startReply(data) {

  replyingTo =
    data;


  showReplyStatus(
    data
  );


  messageInput.focus();

}


// ==================================================
// リプライ表示
// ==================================================

function showReplyStatus(
  data
) {

  let status =
    document.getElementById(
      "replyStatus"
    );


  if (!status) {

    status =
      document.createElement(
        "div"
      );


    status.id =
      "replyStatus";


    status.className =
      "reply-status";


    messageForm.parentNode.insertBefore(
      status,
      messageForm
    );

  }


  status.innerHTML = "";


  const label =
    document.createElement(
      "span"
    );


  label.textContent =
    `↩ ${data.username || "ゲスト"} さんに返信中`;


  const cancel =
    document.createElement(
      "button"
    );


  cancel.type =
    "button";


  cancel.textContent =
    "キャンセル";


  cancel.addEventListener(
    "click",
    () => {

      cancelReply();

    }
  );


  status.appendChild(
    label
  );


  status.appendChild(
    cancel
  );


  status.classList.remove(
    "hidden"
  );

}


// ==================================================
// リプライ解除
// ==================================================

function cancelReply() {

  replyingTo =
    null;


  const status =
    document.getElementById(
      "replyStatus"
    );


  if (status) {

    status.classList.add(
      "hidden"
    );

  }

}


// ==================================================
// メッセージ編集開始
// ==================================================

function startEdit(data) {

  const message =
    findMessageElement(
      data.id
    );


  if (!message) {
    return;
  }


  const textElement =
    message.querySelector(
      ".message-text"
    );


  const actions =
    message.querySelector(
      ".message-actions"
    );


  if (!textElement) {
    return;
  }


  const originalText =
    data.text;


  const input =
    document.createElement(
      "input"
    );


  input.type =
    "text";


  input.className =
    "message-edit-input";


  input.maxLength =
    500;


  input.value =
    originalText;


  const save =
    document.createElement(
      "button"
    );


  save.type =
    "button";


  save.className =
    "message-action-button";


  save.textContent =
    "保存";


  const cancel =
    document.createElement(
      "button"
    );


  cancel.type =
    "button";


  cancel.className =
    "message-action-button";


  cancel.textContent =
    "キャンセル";


  const editArea =
    document.createElement(
      "div"
    );


  editArea.className =
    "message-edit-area";


  editArea.appendChild(
    input
  );


  editArea.appendChild(
    save
  );


  editArea.appendChild(
    cancel
  );


  textElement.replaceWith(
    editArea
  );


  if (actions) {

    actions.classList.add(
      "hidden"
    );

  }


  input.focus();


  input.select();


  function cancelEditing() {

    editArea.replaceWith(
      textElement
    );


    if (actions) {

      actions.classList.remove(
        "hidden"
      );

    }

  }


  function saveEditing() {

    const newText =
      input.value.trim();


    if (!newText) {

      alert(
        "メッセージを空にはできません。"
      );

      return;

    }


    if (
      newText ===
      originalText
    ) {

      cancelEditing();

      return;

    }


    socket.emit(
      "edit message",
      {

        messageId:
          data.id,

        userId:
          userId,

        text:
          newText

      }
    );

  }


  save.addEventListener(
    "click",
    saveEditing
  );


  cancel.addEventListener(
    "click",
    cancelEditing
  );


  input.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        saveEditing();

      }


      if (
        event.key === "Escape"
      ) {

        event.preventDefault();

        cancelEditing();

      }

    }
  );

}


// ==================================================
// 編集完了
// ==================================================

socket.on(
  "message edited",
  (data) => {

    if (!data) {
      return;
    }


    const message =
      findMessageElement(
        data.id
      );


    if (!message) {

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


    // ==================================================
    // 返信表示を作り直す
    // ==================================================

    const oldReply =
      message.querySelector(
        ".reply-reference"
      );


    if (oldReply) {

      oldReply.remove();

    }


    if (data.replyTo) {

      const reply =
        createReplyReference(
          data.replyTo
        );


      const user =
        message.querySelector(
          ".message-user"
        );


      message.insertBefore(
        reply,
        user
      );

    }


    const content =
      message.querySelector(
        ".message-content"
      );


    if (!content) {
      return;
    }


    const editArea =
      message.querySelector(
        ".message-edit-area"
      );


    if (editArea) {

      editArea.remove();

    }


    const text =
      document.createElement(
        "span"
      );


    text.className =
      "message-text";


    text.textContent =
      data.text;


    const time =
      message.querySelector(
        ".message-time"
      );


    const edited =
      message.querySelector(
        ".message-edited"
      );


    if (time) {

      content.insertBefore(
        text,
        time
      );

    } else {

      content.appendChild(
        text
      );

    }


    if (edited) {

      edited.textContent =
        "編集済み";

    }


    const actions =
      message.querySelector(
        ".message-actions"
      );


    if (actions) {

      actions.classList.remove(
        "hidden"
      );

    }


    updateLocalMessage(
      data
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
// コメント削除
// ==================================================

function deleteMessage(data) {

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

      messageId:
        data.id,

      userId:
        userId

    }
  );

}


// ==================================================
// 削除完了
// ==================================================

socket.on(
  "message deleted",
  (data) => {

    if (!data) {
      return;
    }


    const message =
      findMessageElement(
        data.id
      );


    if (message) {

      message.remove();

    }


    removeLocalMessage(
      data.id
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
// メッセージ要素検索
// ==================================================

function findMessageElement(
  messageId
) {

  const elements =
    messages.querySelectorAll(
      ".message"
    );


  for (
    const element of elements
  ) {

    if (
      String(
        element.dataset.messageId
      ) ===
      String(messageId)
    ) {

      return element;

    }

  }


  return null;

}


// ==================================================
// LocalStorageメッセージ更新
// ==================================================

function updateLocalMessage(
  data
) {

  if (
    currentRoom !==
    "casual"
  ) {

    return;

  }


  try {

    const stored =
      JSON.parse(
        localStorage.getItem(
          "veylo_casual_messages"
        )
      ) || [];


    const index =
      stored.findIndex(
        (item) =>
          String(item.id) ===
          String(data.id)
      );


    if (index !== -1) {

      stored[index] =
        data;

    }


    localStorage.setItem(
      "veylo_casual_messages",
      JSON.stringify(stored)
    );

  } catch {

    // 無視

  }

}


// ==================================================
// LocalStorageメッセージ削除
// ==================================================

function removeLocalMessage(
  messageId
) {

  if (
    currentRoom !==
    "casual"
  ) {

    return;

  }


  try {

    const stored =
      JSON.parse(
        localStorage.getItem(
          "veylo_casual_messages"
        )
      ) || [];


    const filtered =
      stored.filter(
        (item) =>
          String(item.id) !==
          String(messageId)
      );


    localStorage.setItem(
      "veylo_casual_messages",
      JSON.stringify(filtered)
    );

  } catch {

    // 無視

  }

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
// 一番上へ
// ==================================================

function scrollToTop() {

  messages.scrollTo({

    top:
      0,

    behavior:
      "smooth"

  });

}


// ==================================================
// 一番下へ
// ==================================================

function scrollToBottom() {

  messages.scrollTo({

    top:
      messages.scrollHeight,

    behavior:
      "smooth"

  });

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


  if (
    !isMessageValid(data)
  ) {

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
            String(item.id) ===
            String(data.id)
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
// 過去コメントまとめて保存
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
          data
        );

      }
    );

}


// ==================================================
// 雑談へ戻る
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


  messages.innerHTML =
    "";


  updateBackToCasualButton();


  socket.emit(
    "join casual"
  );

}


if (casualRoomButton) {

  casualRoomButton.addEventListener(
    "click",
    goToCasual
  );

}


if (backToCasualButton) {

  backToCasualButton.addEventListener(
    "click",
    goToCasual
  );

}


// ==================================================
// 雑談へ戻った
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


    messages.innerHTML =
      "";


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


    messages.innerHTML =
      "";


    cancelReply();


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
// キーボードショートカット
// ==================================================
//
// Home → 一番上
// End  → 一番下
// ==================================================

messages.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key ===
      "Home"
    ) {

      scrollToTop();

    }


    if (
      event.key ===
      "End"
    ) {

      scrollToBottom();

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
// 10分ごとに古いコメントを掃除
// ==================================================

setInterval(
  () => {

    cleanupLocalMessages();

  },
  10 * 60 * 1000
);


// ==================================================
// ページ読み込み完了
// ==================================================

console.log(
  "Veylo: app.js 初期化完了"
);

console.log(
  "ユーザーID:",
  userId
);

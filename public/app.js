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
  document.getElementById(
    "casualRoomButton"
  );

if (casualRoomButton) {

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

      messages.innerHTML = "";

      updateBackToCasualButton();

      socket.emit(
        "join casual"
      );

    }
  );

}


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
// 雑談へ戻る
// ==================================================

const backToCasualButton =
  document.getElementById(
    "backToCasualButton"
  );


// ==================================================
// 設定
// ==================================================

const settingsButton =
  document.getElementById(
    "settingsButton"
  );

const settingsModal =
  document.getElementById(
    "settingsModal"
  );

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
// 返信対象
//
// replyTarget に返信するコメントを
// 一時的に保存します。
// ==================================================

let replyTarget =
  null;


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
// Socket.IO 接続
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
    new Date(
      data.createdAt
    ).getTime();


  if (
    Number.isNaN(created)
  ) {

    return true;

  }


  return (
    Date.now() -
    created <
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
// LocalStorage読み込み
// ==================================================

loadLocalMessages();


// ==================================================
// 返信UIを作成
// ==================================================

function createReplyArea() {

  // 既に存在する場合
  if (
    document.getElementById(
      "replyArea"
    )
  ) {

    return;

  }


  const replyArea =
    document.createElement("div");

  replyArea.id =
    "replyArea";

  replyArea.className =
    "reply-area hidden";


  const replyInfo =
    document.createElement("div");

  replyInfo.className =
    "reply-info";


  const replyIcon =
    document.createElement("span");

  replyIcon.textContent =
    "↩️";


  const replyText =
    document.createElement("span");

  replyText.id =
    "replyTargetText";


  const cancelButton =
    document.createElement("button");

  cancelButton.type =
    "button";

  cancelButton.id =
    "cancelReplyButton";

  cancelButton.className =
    "cancel-reply-button";

  cancelButton.textContent =
    "×";


  cancelButton.title =
    "返信をキャンセル";


  cancelButton.addEventListener(
    "click",
    () => {

      clearReplyTarget();

    }
  );


  replyInfo.appendChild(
    replyIcon
  );

  replyInfo.appendChild(
    replyText
  );


  replyArea.appendChild(
    replyInfo
  );

  replyArea.appendChild(
    cancelButton
  );


  messageForm.parentNode.insertBefore(
    replyArea,
    messageForm
  );

}


// ==================================================
// 返信UI初期化
// ==================================================

createReplyArea();


// ==================================================
// 返信開始
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


  const replyArea =
    document.getElementById(
      "replyArea"
    );

  const replyTargetText =
    document.getElementById(
      "replyTargetText"
    );


  if (
    !replyArea ||
    !replyTargetText
  ) {

    return;

  }


  let preview =
    replyTarget.text;


  if (
    preview.length > 80
  ) {

    preview =
      preview.substring(
        0,
        80
      ) + "...";

  }


  replyTargetText.textContent =
    `${replyTarget.username}：「${preview}」へ返信`;


  replyArea.classList.remove(
    "hidden"
  );


  messageInput.focus();


  console.log(
    "返信対象:",
    replyTarget
  );

}


// ==================================================
// 返信解除
// ==================================================

function clearReplyTarget() {

  replyTarget =
    null;


  const replyArea =
    document.getElementById(
      "replyArea"
    );


  if (replyArea) {

    replyArea.classList.add(
      "hidden"
    );

  }


  const replyTargetText =
    document.getElementById(
      "replyTargetText"
    );


  if (replyTargetText) {

    replyTargetText.textContent =
      "";

  }


  console.log(
    "返信対象を解除しました"
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


    // ==================================================
    // 送信データ
    // ==================================================

    const messageData = {

      room:
        currentRoom,

      text:
        text,

      username:
        username,

      replyTo:
        replyTarget
          ? replyTarget.id
          : null

    };


    socket.emit(
      "chat message",
      messageData
    );


    messageInput.value =
      "";


    // ==================================================
    // 返信状態を解除
    // ==================================================

    clearReplyTarget();


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
// サーバーから過去コメント受信
// ==================================================

socket.on(
  "previous messages",
  (data) => {

    if (
      !Array.isArray(data)
    ) {

      return;

    }


    messages.innerHTML =
      "";


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


    // ==================================================
    // 初回読み込み時は一番下
    // ==================================================

    scrollToBottom();

  }
);


// ==================================================
// メッセージ表示
// ==================================================

function addMessage(
  data,
  autoScroll = true
) {

  if (
    !isMessageValid(data)
  ) {

    return;

  }


  // ==================================================
  // 既に存在している場合
  // ==================================================

  const existing =
    document.querySelector(
      `[data-message-id="${data.id}"]`
    );


  if (existing) {
    return;
  }


  const message =
    document.createElement("div");


  message.className =
    "message";


  if (data.replyTo) {

    message.classList.add(
      "has-reply"
    );

  }


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
  // 編集済み
  // ==================================================

  const edited =
    document.createElement("span");


  edited.className =
    "message-edited";


  if (data.edited) {

    edited.textContent =
      "編集済み";

  }


  // ==================================================
  // 返信情報
  // ==================================================

  if (data.replyTo) {

    createReplyPreview(
      data,
      message
    );

  }


  // ==================================================
  // 本文エリア
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


  if (
    data.edited
  ) {

    content.appendChild(
      edited
    );

  }


  // ==================================================
  // 操作ボタン
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
  // 自分のコメントか確認
  // ==================================================

  const currentUsername =
    usernameInput.value.trim();


  if (
    currentUsername &&
    currentUsername ===
      data.username
  ) {

    // ==================================================
    // 編集
    // ==================================================

    const editButton =
      document.createElement(
        "button"
      );


    editButton.type =
      "button";


    editButton.className =
      "message-action edit-action";


    editButton.textContent =
      "✏️ 編集";


    editButton.addEventListener(
      "click",
      () => {

        editMessage(
          data,
          message
        );

      }
    );


    // ==================================================
    // 削除
    // ==================================================

    const deleteButton =
      document.createElement(
        "button"
      );


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
  // メッセージ構築
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
  // 自動スクロール
  // ==================================================

  if (autoScroll) {

    scrollToBottom();

  }

}


// ==================================================
// 返信プレビュー
// ==================================================

function createReplyPreview(
  data,
  messageElement
) {

  const reply =
    document.createElement(
      "div"
    );


  reply.className =
    "message-reply";


  const replyIcon =
    document.createElement(
      "span"
    );


  replyIcon.className =
    "message-reply-icon";


  replyIcon.textContent =
    "↩️";


  const replyText =
    document.createElement(
      "span"
    );


  replyText.className =
    "message-reply-text";


  replyText.textContent =
    `返信: コメント #${data.replyTo}`;


  reply.appendChild(
    replyIcon
  );


  reply.appendChild(
    replyText
  );


  reply.addEventListener(
    "click",
    () => {

      jumpToMessage(
        data.replyTo
      );

    }
  );


  messageElement.appendChild(
    reply
  );

}


// ==================================================
// 指定コメントへ移動
// ==================================================

function jumpToMessage(
  messageId
) {

  const target =
    document.querySelector(
      `[data-message-id="${messageId}"]`
    );


  if (!target) {

    console.log(
      "返信先コメントが見つかりません:",
      messageId
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
    1200
  );

}


// ==================================================
// メッセージ編集
// ==================================================

function editMessage(
  data,
  messageElement
) {

  const textElement =
    messageElement.querySelector(
      ".message-text"
    );


  if (!textElement) {
    return;
  }


  const oldText =
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
    oldText;


  textElement.replaceWith(
    input
  );


  input.focus();


  input.select();


  const actions =
    messageElement.querySelector(
      ".message-actions"
    );


  if (actions) {

    actions.classList.add(
      "editing"
    );

  }


  const saveButton =
    document.createElement(
      "button"
    );


  saveButton.type =
    "button";


  saveButton.className =
    "message-action save-edit-action";


  saveButton.textContent =
    "保存";


  const cancelButton =
    document.createElement(
      "button"
    );


  cancelButton.type =
    "button";


  cancelButton.className =
    "message-action cancel-edit-action";


  cancelButton.textContent =
    "キャンセル";


  if (actions) {

    actions.innerHTML =
      "";


    actions.appendChild(
      saveButton
    );


    actions.appendChild(
      cancelButton
    );

  }


  function cancelEdit() {

    const restored =
      document.createElement(
        "span"
      );


    restored.className =
      "message-text";


    restored.textContent =
      oldText;


    input.replaceWith(
      restored
    );


    if (actions) {

      actions.innerHTML =
        "";


      restoreMessageActions(
        data,
        messageElement,
        actions
      );

    }

  }


  function saveEdit() {

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
          usernameInput.value.trim()

      }
    );

  }


  saveButton.addEventListener(
    "click",
    saveEdit
  );


  cancelButton.addEventListener(
    "click",
    cancelEdit
  );


  input.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key ===
        "Enter"
      ) {

        event.preventDefault();

        saveEdit();

      }


      if (
        event.key ===
        "Escape"
      ) {

        event.preventDefault();

        cancelEdit();

      }

    }
  );

}


// ==================================================
// メッセージ操作ボタンを復元
// ==================================================

function restoreMessageActions(
  data,
  messageElement,
  actions
) {

  actions.innerHTML =
    "";


  const replyButton =
    document.createElement(
      "button"
    );


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


  const currentUsername =
    usernameInput.value.trim();


  if (
    currentUsername ===
    data.username
  ) {

    const editButton =
      document.createElement(
        "button"
      );


    editButton.type =
      "button";


    editButton.className =
      "message-action edit-action";


    editButton.textContent =
      "✏️ 編集";


    editButton.addEventListener(
      "click",
      () => {

        editMessage(
          data,
          messageElement
        );

      }
    );


    const deleteButton =
      document.createElement(
        "button"
      );


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


    if (
      data.room !==
      currentRoom
    ) {

      return;

    }


    const messageElement =
      document.querySelector(
        `[data-message-id="${data.id}"]`
      );


    if (!messageElement) {
      return;
    }


    const oldText =
      messageElement.querySelector(
        ".message-text"
      );


    const input =
      messageElement.querySelector(
        ".message-edit-input"
      );


    const newTextElement =
      document.createElement(
        "span"
      );


    newTextElement.className =
      "message-text";


    newTextElement.textContent =
      data.text;


    if (input) {

      input.replaceWith(
        newTextElement
      );

    } else if (oldText) {

      oldText.replaceWith(
        newTextElement
      );

    }


    const actions =
      messageElement.querySelector(
        ".message-actions"
      );


    if (actions) {

      restoreMessageActions(
        data,
        messageElement,
        actions
      );

    }


    // ==================================================
    // LocalStorageも更新
    // ==================================================

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
      "メッセージを編集できませんでした。"
    );

  }
);


// ==================================================
// メッセージ削除
// ==================================================

function deleteMessage(
  data
) {

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
        usernameInput.value.trim()

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


    if (
      data.room !==
      currentRoom
    ) {

      return;

    }


    const messageElement =
      document.querySelector(
        `[data-message-id="${data.id}"]`
      );


    if (messageElement) {

      messageElement.remove();

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
      "メッセージを削除できませんでした。"
    );

  }
);


// ==================================================
// 一般メッセージエラー
// ==================================================

socket.on(
  "message error",
  (data) => {

    alert(
      data?.message ||
      "メッセージを送信できませんでした。"
    );

  }
);


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
      hour: "2-digit",
      minute: "2-digit"
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
    stored.length > 1000
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
// LocalStorageのコメント更新
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

    ...data

  };


  localStorage.setItem(
    "veylo_casual_messages",
    JSON.stringify(
      stored
    )
  );

}


// ==================================================
// LocalStorageからコメント削除
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
// 過去コメントをまとめて保存
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
// 上下ボタン
// ==================================================

function createScrollButtons() {

  if (
    document.getElementById(
      "chatScrollButtons"
    )
  ) {

    return;

  }


  const container =
    document.createElement(
      "div"
    );


  container.id =
    "chatScrollButtons";


  container.className =
    "chat-scroll-buttons";


  const topButton =
    document.createElement(
      "button"
    );


  topButton.type =
    "button";


  topButton.textContent =
    "↑ 上へ";


  topButton.title =
    "一番上へ";


  topButton.addEventListener(
    "click",
    scrollToTop
  );


  const bottomButton =
    document.createElement(
      "button"
    );


  bottomButton.type =
    "button";


  bottomButton.textContent =
    "↓ 下へ";


  bottomButton.title =
    "一番下へ";


  bottomButton.addEventListener(
    "click",
    scrollToBottom
  );


  container.appendChild(
    topButton
  );


  container.appendChild(
    bottomButton
  );


  const chatContainer =
    document.querySelector(
      ".chat-container"
    );


  if (chatContainer) {

    chatContainer.appendChild(
      container
    );

  }

}


// ==================================================
// 上下ボタン作成
// ==================================================

createScrollButtons();


// ==================================================
// 部屋作成ボタン
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


    clearReplyTarget();


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


    clearReplyTarget();


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
// 部屋参加ボタン
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


  if (themeToggleButton) {

    themeToggleButton.textContent =
      darkMode
        ? "ON"
        : "OFF";


    themeToggleButton.classList.toggle(
      "active",
      darkMode
    );

  }


  if (grayToggleButton) {

    grayToggleButton.textContent =
      grayMode
        ? "ON"
        : "OFF";


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

}


// ==================================================
// Enterキー：部屋作成
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
// Enterキー：部屋参加
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
// 24時間ごとにブラウザ側も掃除
// ==================================================

setInterval(
  () => {

    cleanupLocalMessages();

  },
  10 * 60 * 1000
);

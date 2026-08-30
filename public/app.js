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
// 雑談ルームボタン
// ==================================================

const casualRoomButton =
  document.getElementById(
    "casualRoomButton"
  );


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
// 返信中のコメント
// ==================================================

let replyTarget = null;


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
// 新着メッセージ関連
// ==================================================

let newMessageButton = null;


// ==================================================
// 最下部にいるか確認
//
// 少しだけ余裕を持たせることで
// 「ほぼ最下部」でも自動スクロールします。
// ==================================================

function isAtBottom() {

  if (!messages) {
    return true;
  }


  const threshold = 80;


  return (
    messages.scrollHeight -
      messages.scrollTop -
      messages.clientHeight <=
    threshold
  );

}


// ==================================================
// 一番下まで移動
// ==================================================

function scrollToBottom(
  behavior = "smooth"
) {

  if (!messages) {
    return;
  }


  messages.scrollTo({

    top:
      messages.scrollHeight,

    behavior:
      behavior

  });

}


// ==================================================
// 新着メッセージボタン作成
// ==================================================

function createNewMessageButton() {

  if (
    document.getElementById(
      "newMessageButton"
    )
  ) {

    newMessageButton =
      document.getElementById(
        "newMessageButton"
      );

    return newMessageButton;

  }


  newMessageButton =
    document.createElement(
      "button"
    );


  newMessageButton.id =
    "newMessageButton";


  newMessageButton.type =
    "button";


  newMessageButton.className =
    "new-message-button hidden";


  newMessageButton.textContent =
    "新着メッセージあり ↓";


  newMessageButton.setAttribute(
    "aria-label",
    "新着メッセージがあります。下へ移動"
  );


  newMessageButton.addEventListener(
    "click",
    () => {

      scrollToBottom();

      hideNewMessageButton();

    }
  );


  const chatContainer =
    document.querySelector(
      ".chat-container"
    );


  if (chatContainer) {

    chatContainer.appendChild(
      newMessageButton
    );

  }


  return newMessageButton;

}


// ==================================================
// 新着メッセージボタン表示
// ==================================================

function showNewMessageButton() {

  const button =
    createNewMessageButton();


  if (!button) {
    return;
  }


  button.classList.remove(
    "hidden"
  );

}


// ==================================================
// 新着メッセージボタン非表示
// ==================================================

function hideNewMessageButton() {

  if (!newMessageButton) {
    return;
  }


  newMessageButton.classList.add(
    "hidden"
  );

}


// ==================================================
// スクロール位置監視
//
// 下まで戻ってきたら
// 「新着メッセージあり」を自動で消します。
// ==================================================

if (messages) {

  messages.addEventListener(
    "scroll",
    () => {

      if (isAtBottom()) {

        hideNewMessageButton();

      }

    }
  );

}


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
// 返信表示エリア作成
// ==================================================

function createReplyPreview() {

  let preview =
    document.getElementById(
      "replyPreview"
    );


  if (preview) {
    return preview;
  }


  preview =
    document.createElement("div");


  preview.id =
    "replyPreview";


  preview.className =
    "reply-preview hidden";


  const text =
    document.createElement("div");


  text.className =
    "reply-preview-text";


  const cancel =
    document.createElement("button");


  cancel.type =
    "button";


  cancel.className =
    "reply-cancel-button";


  cancel.textContent =
    "✕";


  cancel.title =
    "返信をキャンセル";


  cancel.addEventListener(
    "click",
    () => {

      clearReplyTarget();

    }
  );


  preview.appendChild(
    text
  );


  preview.appendChild(
    cancel
  );


  if (
    messageForm &&
    messageForm.parentNode
  ) {

    messageForm.parentNode.insertBefore(
      preview,
      messageForm
    );

  }


  return preview;

}


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


  const preview =
    createReplyPreview();


  const previewText =
    preview.querySelector(
      ".reply-preview-text"
    );


  if (previewText) {

    previewText.textContent =
      `↩ ${replyTarget.username}さんの「${replyTarget.text}」に返信`;

  }


  preview.classList.remove(
    "hidden"
  );


  if (messageInput) {

    messageInput.focus();

  }

}


// ==================================================
// 返信解除
// ==================================================

function clearReplyTarget() {

  replyTarget = null;


  const preview =
    document.getElementById(
      "replyPreview"
    );


  if (preview) {

    preview.classList.add(
      "hidden"
    );

  }

}


// ==================================================
// チャット送信
// ==================================================

if (messageForm) {

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


      if (
        replyTarget &&
        replyTarget.id
      ) {

        messageData.replyToId =
          replyTarget.id;

      }


      socket.emit(
        "chat message",
        messageData
      );


      messageInput.value =
        "";


      clearReplyTarget();


      messageInput.focus();

    }
  );

}


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


    // ==================================================
    // メッセージ追加前のスクロール位置を記録
    //
    // ここが今回の重要部分です。
    // ==================================================

    const wasAtBottom =
      isAtBottom();


    addMessage(data);


    saveLocalMessage(data);


    // ==================================================
    // 追加後
    // ==================================================

    if (wasAtBottom) {

      // 最下部にいた
      // ↓
      // 新着メッセージを自動表示

      scrollToBottom();

      hideNewMessageButton();

    } else {

      // 過去ログを読んでいる
      // ↓
      // 勝手に下へ行かない

      showNewMessageButton();

    }

  }
);


// ==================================================
// 送信エラー
// ==================================================

socket.on(
  "message send error",
  (data) => {

    alert(
      data?.message ||
      "メッセージを送信できませんでした。"
    );

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


    messages.innerHTML =
      "";


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
      currentRoom ===
      "casual"
    ) {

      saveAllLocalMessages(
        data
      );

    }


    // ==================================================
    // 過去ログ読み込み時は最下部へ
    // ==================================================

    scrollToBottom(
      "auto"
    );


    hideNewMessageButton();

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
    document.createElement("div");


  message.className =
    "message";


  message.dataset.messageId =
    data.id;


  // ==================================================
  // メッセージ上部
  // ==================================================

  const header =
    document.createElement("div");


  header.className =
    "message-header";


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


  header.appendChild(
    user
  );


  header.appendChild(
    time
  );


  // ==================================================
  // 返信先表示
  // ==================================================

  if (
    data.replyToId
  ) {

    const replyInfo =
      document.createElement(
        "div"
      );


    replyInfo.className =
      "message-reply-info";


    replyInfo.dataset.replyTargetId =
      data.replyToId;


    const replyIcon =
      document.createElement(
        "span"
      );


    replyIcon.className =
      "reply-info-icon";


    replyIcon.textContent =
      "↩";


    const replyText =
      document.createElement(
        "span"
      );


    replyText.className =
      "reply-info-text";


    const replyUsername =
      data.replyToUsername ||
      "ゲスト";


    const originalText =
      data.replyToText ||
      "コメント";


    replyText.textContent =
      `${replyUsername}さんの「${originalText}」に返信`;


    replyInfo.appendChild(
      replyIcon
    );


    replyInfo.appendChild(
      replyText
    );


    replyInfo.addEventListener(
      "click",
      () => {

        scrollToMessage(
          data.replyToId
        );

      }
    );


    message.appendChild(
      replyInfo
    );

  }


  // ==================================================
  // 本文
  // ==================================================

  const content =
    document.createElement(
      "div"
    );


  content.className =
    "message-content";


  const text =
    document.createElement(
      "span"
    );


  text.className =
    "message-text";


  text.textContent =
    data.text;


  content.appendChild(
    text
  );


  // ==================================================
  // 編集済み表示
  // ==================================================

  if (data.edited) {

    const edited =
      document.createElement(
        "span"
      );


    edited.className =
      "edited-label";


    edited.textContent =
      "編集済み";


    content.appendChild(
      edited
    );

  }


  message.appendChild(
    header
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


  // ==================================================
  // 返信ボタン
  // ==================================================

  const replyButton =
    document.createElement(
      "button"
    );


  replyButton.type =
    "button";


  replyButton.className =
    "message-action reply-action";


  replyButton.textContent =
    "↩ 返信";


  replyButton.title =
    "このコメントに返信";


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


  const isMine =
    currentUsername &&
    currentUsername ===
      data.username;


  if (isMine) {

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
          data,
          message
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


  message.appendChild(
    actions
  );


  messages.appendChild(
    message
  );

}


// ==================================================
// 編集
// ==================================================

function editMessage(
  data,
  messageElement
) {

  const currentText =
    data.text || "";


  const newText =
    prompt(
      "メッセージを編集",
      currentText
    );


  if (
    newText === null
  ) {

    return;

  }


  const trimmed =
    newText.trim();


  if (!trimmed) {

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
        trimmed,

      username:
        usernameInput.value.trim()

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


    if (
      data.room !==
      currentRoom
    ) {

      return;

    }


    const element =
      document.querySelector(
        `.message[data-message-id="${data.id}"]`
      );


    if (!element) {

      return;

    }


    const wasAtBottom =
      isAtBottom();


    element.remove();


    addMessage(data);


    if (wasAtBottom) {

      scrollToBottom();

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
// 削除
// ==================================================

function deleteMessage(
  data,
  messageElement
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


    const element =
      document.querySelector(
        `.message[data-message-id="${data.id}"]`
      );


    if (element) {

      element.remove();

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
// LocalStorageからコメント削除
// ==================================================

function removeLocalMessage(
  id
) {

  if (!id) {
    return;
  }


  try {

    const stored =
      JSON.parse(
        localStorage.getItem(
          "veylo_casual_messages"
        )
      ) || [];


    const valid =
      stored.filter(
        (item) =>
          String(item.id) !==
          String(id)
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
// メッセージへ移動
// ==================================================

function scrollToMessage(
  messageId
) {

  const target =
    document.querySelector(
      `.message[data-message-id="${messageId}"]`
    );


  if (!target) {

    return;

  }


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


// ==================================================
// 一番上へ
// ==================================================

function scrollToTop() {

  if (!messages) {
    return;
  }


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

function scrollToBottomButton() {

  scrollToBottom();

  hideNewMessageButton();

}


// ==================================================
// 上下移動ボタン作成
// ==================================================

function createScrollButtons() {

  if (
    document.getElementById(
      "scrollControls"
    )
  ) {

    return;

  }


  const controls =
    document.createElement(
      "div"
    );


  controls.id =
    "scrollControls";


  controls.className =
    "scroll-controls";


  // ==================================================
  // 上へ
  // ==================================================

  const upButton =
    document.createElement(
      "button"
    );


  upButton.type =
    "button";


  upButton.className =
    "scroll-button";


  upButton.textContent =
    "↑ 上へ";


  upButton.addEventListener(
    "click",
    scrollToTop
  );


  // ==================================================
  // 下へ
  // ==================================================

  const downButton =
    document.createElement(
      "button"
    );


  downButton.type =
    "button";


  downButton.className =
    "scroll-button";


  downButton.textContent =
    "↓ 下へ";


  downButton.addEventListener(
    "click",
    scrollToBottomButton
  );


  controls.appendChild(
    upButton
  );


  controls.appendChild(
    downButton
  );


  const chatContainer =
    document.querySelector(
      ".chat-container"
    );


  if (chatContainer) {

    chatContainer.appendChild(
      controls
    );

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
    JSON.stringify(
      stored
    )
  );

}


// ==================================================
// 過去コメントまとめ保存
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
// 雑談ルームへ戻る
// ==================================================

function returnToCasual() {

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

  hideNewMessageButton();


  updateBackToCasualButton();


  socket.emit(
    "join casual"
  );

}


if (casualRoomButton) {

  casualRoomButton.addEventListener(
    "click",
    returnToCasual
  );

}


if (backToCasualButton) {

  backToCasualButton.addEventListener(
    "click",
    () => {

      if (
        currentRoom ===
        "casual"
      ) {

        return;

      }


      returnToCasual();

    }
  );

}


// ==================================================
// 雑談へ戻ったとき
// ==================================================

socket.on(
  "casual joined",
  () => {

    messages.innerHTML =
      "";


    loadLocalMessages();


    scrollToBottom(
      "auto"
    );


    hideNewMessageButton();

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
// 部屋作成ボタン
// ==================================================

if (createRoomButton) {

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

}


// ==================================================
// 部屋作成キャンセル
// ==================================================

if (cancelCreateButton) {

  cancelCreateButton.addEventListener(
    "click",
    () => {

      createModal.classList.add(
        "hidden"
      );

    }
  );

}


// ==================================================
// 部屋作成
// ==================================================

if (confirmCreateButton) {

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

}


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

    hideNewMessageButton();


    updateBackToCasualButton();


    alert(
      `部屋を作成しました。\n\n招待コード: ${room.inviteCode}`
    );

  }
);


// ==================================================
// 部屋参加ボタン
// ==================================================

if (joinRoomButton) {

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

}


// ==================================================
// 部屋参加キャンセル
// ==================================================

if (cancelJoinButton) {

  cancelJoinButton.addEventListener(
    "click",
    () => {

      joinModal.classList.add(
        "hidden"
      );

    }
  );

}


// ==================================================
// 部屋参加
// ==================================================

if (confirmJoinButton) {

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

}


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

    hideNewMessageButton();


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

if (roomNameInput) {

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

}


// ==================================================
// Enterキー：部屋参加
// ==================================================

if (inviteCodeInput) {

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

}


// ==================================================
// モーダル外クリック
// ==================================================

if (createModal) {

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

}


if (joinModal) {

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

}


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
// 初期設定
// ==================================================

updateTheme();

updateBackToCasualButton();

createScrollButtons();

createReplyPreview();

createNewMessageButton();

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

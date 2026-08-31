"use strict";

// ==================================================
// Veylo App.js
// ==================================================

console.log(
  "Veylo app.js loaded successfully."
);

// ==================================================
// DOM
// ==================================================

const authScreen =
  document.getElementById(
    "authScreen"
  );

const appScreen =
  document.getElementById(
    "appScreen"
  );

// ==================================================
// 認証DOM
// ==================================================

const loginPanel =
  document.getElementById(
    "loginPanel"
  );

const registerPanel =
  document.getElementById(
    "registerPanel"
  );

const forgotPanel =
  document.getElementById(
    "forgotPanel"
  );

const loginForm =
  document.getElementById(
    "loginForm"
  );

const registerForm =
  document.getElementById(
    "registerForm"
  );

const forgotForm =
  document.getElementById(
    "forgotForm"
  );

const loginName =
  document.getElementById(
    "loginName"
  );

const loginPassword =
  document.getElementById(
    "loginPassword"
  );

const registerEmail =
  document.getElementById(
    "registerEmail"
  );

const registerName =
  document.getElementById(
    "registerName"
  );

const registerPassword =
  document.getElementById(
    "registerPassword"
  );

const forgotEmail =
  document.getElementById(
    "forgotEmail"
  );

const loginError =
  document.getElementById(
    "loginError"
  );

const registerError =
  document.getElementById(
    "registerError"
  );

const forgotMessage =
  document.getElementById(
    "forgotMessage"
  );

const showRegisterButton =
  document.getElementById(
    "showRegisterButton"
  );

const showLoginButton =
  document.getElementById(
    "showLoginButton"
  );

const forgotPasswordButton =
  document.getElementById(
    "forgotPasswordButton"
  );

const backToLoginButton =
  document.getElementById(
    "backToLoginButton"
  );

// ==================================================
// Socket
// ==================================================

let socket = null;

// ==================================================
// チャットDOM
// ==================================================

const messages =
  document.getElementById(
    "messages"
  );

const messageForm =
  document.getElementById(
    "messageForm"
  );

const messageInput =
  document.getElementById(
    "messageInput"
  );

const usernameInput =
  document.getElementById(
    "usernameInput"
  );

const roomName =
  document.getElementById(
    "roomName"
  );

const inviteArea =
  document.getElementById(
    "inviteArea"
  );

const inviteCode =
  document.getElementById(
    "inviteCode"
  );

const newMessageButton =
  document.getElementById(
    "newMessageButton"
  );

// ==================================================
// ルーム
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

const logoutButton =
  document.getElementById(
    "logoutButton"
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
// アカウント管理DOM
// ==================================================

const accountCountLabel =
  document.getElementById(
    "accountCountLabel"
  );

const accountList =
  document.getElementById(
    "accountList"
  );

const deleteAccountSelect =
  document.getElementById(
    "deleteAccountSelect"
  );

const deleteAccountPassword =
  document.getElementById(
    "deleteAccountPassword"
  );

const deleteAccountButton =
  document.getElementById(
    "deleteAccountButton"
  );

const deleteAccountMessage =
  document.getElementById(
    "deleteAccountMessage"
  );

// ==================================================
// 状態
// ==================================================

let currentUser =
  null;

let currentRoom =
  "casual";

let replyTarget =
  null;

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
// API
// ==================================================

async function api(
  url,
  options = {}
) {
  const response =
    await fetch(
      url,
      {
        credentials:
          "same-origin",

        ...options,

        headers: {
          ...(options.headers || {}),

          "Content-Type":
            "application/json"
        }
      }
    );

  let data = {};

  try {
    data =
      await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error =
      new Error(
        data.message ||
        "通信に失敗しました。"
      );

    error.code =
      data.code;

    throw error;
  }

  return data;
}

// ==================================================
// 認証画面切り替え
// ==================================================

function showPanel(
  panel
) {
  loginPanel.classList.add(
    "hidden"
  );

  registerPanel.classList.add(
    "hidden"
  );

  forgotPanel.classList.add(
    "hidden"
  );

  panel.classList.remove(
    "hidden"
  );
}

// ==================================================
// ログイン状態確認
// ==================================================

async function checkLogin() {
  try {
    const data =
      await api(
        "/api/me"
      );

    if (
      data.loggedIn &&
      data.user
    ) {
      currentUser =
        data.user;

      enterApp();

      return;
    }

    showAuth();
  } catch (error) {
    console.error(
      "checkLogin error:",
      error
    );

    showAuth();
  }
}

// ==================================================
// 認証画面
// ==================================================

function showAuth() {
  authScreen.classList.remove(
    "hidden"
  );

  appScreen.classList.add(
    "hidden"
  );

  showPanel(
    loginPanel
  );
}

// ==================================================
// アプリ画面
// ==================================================

function enterApp() {
  if (!currentUser) {
    return;
  }

  authScreen.classList.add(
    "hidden"
  );

  appScreen.classList.remove(
    "hidden"
  );

  usernameInput.textContent =
    currentUser.name;

  settingsUsernameInput.value =
    currentUser.name;

  connectSocket();
}

// ==================================================
// Socket接続
// ==================================================

function connectSocket() {
  if (
    socket &&
    socket.connected
  ) {
    return;
  }

  if (socket) {
    socket.removeAllListeners();

    socket.disconnect();

    socket = null;
  }

  socket =
    io(
      window.location.origin,
      {
        withCredentials:
          true,

        transports: [
          "websocket",
          "polling"
        ],

        reconnection:
          true,

        reconnectionAttempts:
          10,

        reconnectionDelay:
          1000,

        reconnectionDelayMax:
          5000
      }
    );

  socket.on(
    "connect",
    () => {
      console.log(
        "Socket connected:",
        socket.id
      );
    }
  );

  socket.on(
    "connect_error",
    (error) => {
      console.error(
        "Socket connection error:",
        error
      );

      if (
        error &&
        error.message ===
          "UNAUTHORIZED"
      ) {
        verifyLoginAfterSocketError();
      }
    }
  );

  socket.on(
    "disconnect",
    (reason) => {
      console.log(
        "Socket disconnected:",
        reason
      );
    }
  );

  setupSocketEvents();
}

// ==================================================
// Socketエラー時のログイン確認
// ==================================================

let socketAuthCheckRunning =
  false;

async function verifyLoginAfterSocketError() {
  if (
    socketAuthCheckRunning
  ) {
    return;
  }

  socketAuthCheckRunning =
    true;

  try {
    const data =
      await api(
        "/api/me"
      );

    if (
      data.loggedIn &&
      data.user
    ) {
      currentUser =
        data.user;

      usernameInput.textContent =
        currentUser.name;

      settingsUsernameInput.value =
        currentUser.name;

      return;
    }

    currentUser =
      null;

    if (socket) {
      socket.disconnect();
    }

    showAuth();
  } catch (error) {
    console.error(
      "Session verification error:",
      error
    );
  } finally {
    socketAuthCheckRunning =
      false;
  }
}

// ==================================================
// Socketイベント
// ==================================================

function setupSocketEvents() {
  socket.on(
    "chat message",
    handleChatMessage
  );

  socket.on(
    "previous messages",
    handlePreviousMessages
  );

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

  socket.on(
    "room created",
    handleRoomCreated
  );

  socket.on(
    "room joined",
    handleRoomJoined
  );

  socket.on(
    "join room error",
    (data) => {
      joinError.textContent =
        data?.message ||
        "部屋に参加できませんでした。";
    }
  );

  socket.on(
    "create room error",
    (data) => {
      alert(
        data?.message ||
        "部屋を作成できませんでした。"
      );
    }
  );

  socket.on(
    "message edited",
    handleMessageEdited
  );

  socket.on(
    "message deleted",
    handleMessageDeleted
  );

  socket.on(
    "message send error",
    (data) => {
      alert(
        data?.message ||
        "メッセージを送信できませんでした。"
      );
    }
  );

  socket.on(
    "message edit error",
    (data) => {
      alert(
        data?.message ||
        "コメントを編集できませんでした。"
      );
    }
  );

  socket.on(
    "message delete error",
    (data) => {
      alert(
        data?.message ||
        "コメントを削除できませんでした。"
      );
    }
  );
}

// ==================================================
// Login
// ==================================================

loginForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    loginError.textContent =
      "";

    try {
      const data =
        await api(
          "/api/login",
          {
            method:
              "POST",

            body:
              JSON.stringify({
                name:
                  loginName.value.trim(),

                password:
                  loginPassword.value
              })
          }
        );

      currentUser =
        data.user;

      usernameInput.textContent =
        currentUser.name;

      settingsUsernameInput.value =
        currentUser.name;

      loginPassword.value =
        "";

      enterApp();
    } catch (error) {
      loginError.textContent =
        error.message;
    }
  }
);

// ==================================================
// 登録
// ==================================================

registerForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    registerError.textContent =
      "";

    try {
      const data =
        await api(
          "/api/register",
          {
            method:
              "POST",

            body:
              JSON.stringify({
                email:
                  registerEmail.value.trim(),

                password:
                  registerPassword.value,

                name:
                  registerName.value.trim()
              })
          }
        );

      currentUser =
        data.user;

      usernameInput.textContent =
        currentUser.name;

      settingsUsernameInput.value =
        currentUser.name;

      registerPassword.value =
        "";

      enterApp();
    } catch (error) {
      registerError.textContent =
        error.message;
    }
  }
);

// ==================================================
// パスワード忘れ
// ==================================================

forgotForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    forgotMessage.textContent =
      "";

    try {
      const data =
        await api(
          "/api/forgot-password",
          {
            method:
              "POST",

            body:
              JSON.stringify({
                email:
                  forgotEmail.value.trim()
              })
          }
        );

      forgotMessage.textContent =
        data.message;
    } catch (error) {
      forgotMessage.textContent =
        error.message;
    }
  }
);

// ==================================================
// 認証画面ボタン
// ==================================================

showRegisterButton.addEventListener(
  "click",
  () => {
    registerError.textContent =
      "";

    showPanel(
      registerPanel
    );
  }
);

showLoginButton.addEventListener(
  "click",
  () => {
    loginError.textContent =
      "";

    showPanel(
      loginPanel
    );
  }
);

forgotPasswordButton.addEventListener(
  "click",
  () => {
    forgotMessage.textContent =
      "";

    showPanel(
      forgotPanel
    );
  }
);

backToLoginButton.addEventListener(
  "click",
  () => {
    showPanel(
      loginPanel
    );
  }
);

// ==================================================
// ログアウト
// ==================================================

logoutButton.addEventListener(
  "click",
  async () => {
    const confirmed =
      confirm(
        "ログアウトしますか？"
      );

    if (!confirmed) {
      return;
    }

    try {
      await api(
        "/api/logout",
        {
          method:
            "POST"
        }
      );

      if (socket) {
        socket.removeAllListeners();

        socket.disconnect();

        socket = null;
      }

      currentUser =
        null;

      messages.innerHTML =
        "";

      settingsModal.classList.add(
        "hidden"
      );

      showAuth();
    } catch (error) {
      alert(
        error.message
      );
    }
  }
);

// ==================================================
// スクロール
// ==================================================

function isAtBottom() {
  if (!messages) {
    return true;
  }

  return (
    messages.scrollHeight -
      messages.scrollTop -
      messages.clientHeight <=
    80
  );
}

function scrollToBottom(
  behavior = "smooth"
) {
  if (!messages) {
    return;
  }

  messages.scrollTo({
    top:
      messages.scrollHeight,

    behavior
  });
}

function scrollToTop() {
  messages.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// ==================================================
// 返信先へジャンプ
// ==================================================

function scrollToMessage(
  id
) {
  const selector =
    `.message[data-message-id="${CSS.escape(
      String(id)
    )}"]`;

  const element =
    document.querySelector(
      selector
    );

  if (!element) {
    return;
  }

  element.scrollIntoView({
    behavior:
      "smooth",

    block:
      "center"
  });

  element.classList.add(
    "message-highlight"
  );

  setTimeout(
    () => {
      element.classList.remove(
        "message-highlight"
      );
    },
    1800
  );
}

function showNewMessageButton() {
  newMessageButton.classList.remove(
    "hidden"
  );
}

function hideNewMessageButton() {
  newMessageButton.classList.add(
    "hidden"
  );
}

newMessageButton.addEventListener(
  "click",
  () => {
    scrollToBottom();

    hideNewMessageButton();
  }
);

messages.addEventListener(
  "scroll",
  () => {
    if (
      isAtBottom()
    ) {
      hideNewMessageButton();
    }
  }
);

document
  .getElementById(
    "scrollTopButton"
  )
  .addEventListener(
    "click",
    scrollToTop
  );

document
  .getElementById(
    "scrollBottomButton"
  )
  .addEventListener(
    "click",
    () => {
      scrollToBottom();

      hideNewMessageButton();
    }
  );

// ==================================================
// 24時間
// ==================================================

const MESSAGE_LIFETIME =
  24 *
  60 *
  60 *
  1000;

function isMessageValid(
  data
) {
  if (!data) {
    return false;
  }

  if (!data.createdAt) {
    return true;
  }

  const time =
    new Date(
      data.createdAt
    ).getTime();

  if (
    Number.isNaN(time)
  ) {
    return true;
  }

  return (
    Date.now() -
      time <
    MESSAGE_LIFETIME
  );
}

// ==================================================
// LocalStorage
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
        isMessageValid
      );

    localStorage.setItem(
      "veylo_casual_messages",
      JSON.stringify(
        valid.slice(-1000)
      )
    );
  } catch {
    localStorage.removeItem(
      "veylo_casual_messages"
    );
  }
}

function loadLocalMessages() {
  cleanupLocalMessages();

  try {
    const stored =
      JSON.parse(
        localStorage.getItem(
          "veylo_casual_messages"
        )
      ) || [];

    stored
      .filter(
        isMessageValid
      )
      .forEach(
        addMessage
      );
  } catch {}
}

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

  try {
    let stored =
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

    if (
      index >= 0
    ) {
      stored[index] =
        data;
    } else {
      stored.push(
        data
      );
    }

    stored =
      stored
        .filter(
          isMessageValid
        )
        .slice(-1000);

    localStorage.setItem(
      "veylo_casual_messages",
      JSON.stringify(
        stored
      )
    );
  } catch {
    localStorage.removeItem(
      "veylo_casual_messages"
    );
  }
}

function removeLocalMessage(
  id
) {
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
          String(id)
      );

    localStorage.setItem(
      "veylo_casual_messages",
      JSON.stringify(
        filtered
      )
    );
  } catch {
    localStorage.removeItem(
      "veylo_casual_messages"
    );
  }
}

// ==================================================
// メッセージ受信
// ==================================================

function handleChatMessage(
  data
) {
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

  const wasAtBottom =
    isAtBottom();

  addMessage(
    data
  );

  saveLocalMessage(
    data
  );

  if (
    wasAtBottom
  ) {
    scrollToBottom();

    hideNewMessageButton();
  } else {
    showNewMessageButton();
  }
}

// ==================================================
// 過去メッセージ
// ==================================================

function handlePreviousMessages(
  data
) {
  if (
    !Array.isArray(data)
  ) {
    return;
  }

  messages.innerHTML =
    "";

  data
    .filter(
      isMessageValid
    )
    .forEach(
      addMessage
    );

  if (
    currentRoom ===
    "casual"
  ) {
    localStorage.setItem(
      "veylo_casual_messages",
      JSON.stringify(
        data
          .filter(
            isMessageValid
          )
          .slice(-1000)
      )
    );
  }

  scrollToBottom(
    "auto"
  );

  hideNewMessageButton();
}

// ==================================================
// メッセージ表示
// ==================================================

function addMessage(
  data
) {
  if (
    !isMessageValid(data)
  ) {
    return;
  }

  if (
    !data.id
  ) {
    return;
  }

  const selector =
    `.message[data-message-id="${CSS.escape(
      String(data.id)
    )}"]`;

  if (
    document.querySelector(
      selector
    )
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
  // Header
  // ==================================================

  const header =
    document.createElement(
      "div"
    );

  header.className =
    "message-header";

  const user =
    document.createElement(
      "div"
    );

  user.className =
    "message-user";

  user.textContent =
    data.username ||
    "ゲスト";

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

  header.appendChild(
    user
  );

  header.appendChild(
    time
  );

  message.appendChild(
    header
  );

  // ==================================================
  // 返信元
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

    replyInfo.textContent =
      `↩ ${
        data.replyToUsername ||
        "ゲスト"
      }さんの「${
        data.replyToText ||
        "コメント"
      }」に返信`;

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

  if (
    Number(data.edited) ===
      1 ||
    data.edited === true
  ) {
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
    content
  );

  // ==================================================
  // 操作
  // ==================================================

  const actions =
    document.createElement(
      "div"
    );

  actions.className =
    "message-actions";

  const replyButton =
    document.createElement(
      "button"
    );

  replyButton.type =
    "button";

  replyButton.textContent =
    "↩ 返信";

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
  // 本人判定
  // ==================================================

  if (
    currentUser &&
    Number(data.userId) ===
      Number(currentUser.id)
  ) {
    const editButton =
      document.createElement(
        "button"
      );

    editButton.type =
      "button";

    editButton.textContent =
      "✏️ 編集";

    editButton.addEventListener(
      "click",
      () => {
        editMessage(
          data
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
      "delete-action";

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
  data
) {
  const newText =
    prompt(
      "メッセージを編集",
      data.text || ""
    );

  if (
    newText === null
  ) {
    return;
  }

  const text =
    newText.trim();

  if (!text) {
    alert(
      "メッセージを入力してください。"
    );

    return;
  }

  if (
    !socket ||
    !socket.connected
  ) {
    alert(
      "サーバーに接続されていません。"
    );

    return;
  }

  socket.emit(
    "edit message",
    {
      id:
        data.id,

      text
    }
  );
}

// ==================================================
// 編集完了
// ==================================================

function handleMessageEdited(
  data
) {
  if (
    !data ||
    data.room !==
      currentRoom
  ) {
    return;
  }

  const selector =
    `.message[data-message-id="${CSS.escape(
      String(data.id)
    )}"]`;

  const element =
    document.querySelector(
      selector
    );

  const wasAtBottom =
    isAtBottom();

  if (element) {
    element.remove();
  }

  addMessage(
    data
  );

  saveLocalMessage(
    data
  );

  if (
    wasAtBottom
  ) {
    scrollToBottom();
  }
}

// ==================================================
// 削除
// ==================================================

function deleteMessage(
  data
) {
  if (
    !confirm(
      "このコメントを削除しますか？"
    )
  ) {
    return;
  }

  if (
    !socket ||
    !socket.connected
  ) {
    alert(
      "サーバーに接続されていません。"
    );

    return;
  }

  socket.emit(
    "delete message",
    {
      id:
        data.id
    }
  );
}

// ==================================================
// 削除完了
// ==================================================

function handleMessageDeleted(
  data
) {
  if (
    !data ||
    data.room !==
      currentRoom
  ) {
    return;
  }

  const selector =
    `.message[data-message-id="${CSS.escape(
      String(data.id)
    )}"]`;

  const element =
    document.querySelector(
      selector
    );

  if (element) {
    element.remove();
  }

  removeLocalMessage(
    data.id
  );
}

// ==================================================
// 返信
// ==================================================

function setReplyTarget(
  data
) {
  replyTarget = {
    id:
      data.id,

    username:
      data.username,

    text:
      data.text
  };

  const preview =
    document.getElementById(
      "replyPreview"
    );

  preview.innerHTML =
    "";

  const text =
    document.createElement(
      "span"
    );

  text.textContent =
    `↩ ${
      data.username
    }さんの「${
      data.text
    }」に返信`;

  const cancel =
    document.createElement(
      "button"
    );

  cancel.type =
    "button";

  cancel.textContent =
    "✕";

  cancel.addEventListener(
    "click",
    clearReplyTarget
  );

  preview.appendChild(
    text
  );

  preview.appendChild(
    cancel
  );

  preview.classList.remove(
    "hidden"
  );

  messageInput.focus();
}

function clearReplyTarget() {
  replyTarget =
    null;

  const preview =
    document.getElementById(
      "replyPreview"
    );

  preview.classList.add(
    "hidden"
  );
}

// ==================================================
// 送信
// ==================================================

messageForm.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    const text =
      messageInput.value.trim();

    if (!text) {
      return;
    }

    if (
      !socket ||
      !socket.connected
    ) {
      alert(
        "サーバーに接続されていません。"
      );

      return;
    }

    const data = {
      room:
        currentRoom,

      text
    };

    if (
      replyTarget
    ) {
      data.replyToId =
        replyTarget.id;
    }

    socket.emit(
      "chat message",
      data
    );

    messageInput.value =
      "";

    clearReplyTarget();

    messageInput.focus();
  }
);

// ==================================================
// 部屋
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

  if (
    socket &&
    socket.connected
  ) {
    socket.emit(
      "join casual"
    );
  }
}

casualRoomButton.addEventListener(
  "click",
  returnToCasual
);

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

    setTimeout(
      () => {
        roomNameInput.focus();
      },
      50
    );
  }
);

cancelCreateButton.addEventListener(
  "click",
  () => {
    createModal.classList.add(
      "hidden"
    );
  }
);

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

    if (
      !socket ||
      !socket.connected
    ) {
      alert(
        "サーバーに接続されていません。"
      );

      return;
    }

    confirmCreateButton.disabled =
      true;

    socket.emit(
      "create room",
      {
        name
      }
    );

    setTimeout(
      () => {
        confirmCreateButton.disabled =
          false;
      },
      1000
    );
  }
);

// ==================================================
// 部屋作成完了
// ==================================================

function handleRoomCreated(
  room
) {
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

  alert(
    `部屋を作成しました。\n\n招待コード: ${room.inviteCode}`
  );
}

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

    setTimeout(
      () => {
        inviteCodeInput.focus();
      },
      50
    );
  }
);

cancelJoinButton.addEventListener(
  "click",
  () => {
    joinModal.classList.add(
      "hidden"
    );
  }
);

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

    if (
      !socket ||
      !socket.connected
    ) {
      joinError.textContent =
        "サーバーに接続されていません。";

      return;
    }

    socket.emit(
      "join room",
      {
        code
      }
    );
  }
);

// ==================================================
// 部屋参加完了
// ==================================================

function handleRoomJoined(
  room
) {
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
}

// ==================================================
// 設定
// ==================================================

settingsButton.addEventListener(
  "click",
  async () => {
    settingsUsernameInput.value =
      currentUser.name;

    languageSelect.value =
      language;

    deleteAccountMessage.textContent =
      "";

    deleteAccountPassword.value =
      "";

    settingsModal.classList.remove(
      "hidden"
    );

    await loadAccounts();
  }
);

closeSettingsButton.addEventListener(
  "click",
  () => {
    settingsModal.classList.add(
      "hidden"
    );
  }
);

// ==================================================
// 設定保存
// ==================================================

saveSettingsButton.addEventListener(
  "click",
  () => {
    const newName =
      settingsUsernameInput.value.trim();

    if (!newName) {
      alert(
        "名前を入力してください。"
      );

      return;
    }

    /*
     * 元コードには名前変更APIが存在しなかったため、
     * 今回はUIだけ残し、保存時にはローカルの表示を更新します。
     *
     * サーバー側で名前変更も行いたい場合は
     * 別APIを追加できます。
     */

    currentUser.name =
      newName;

    usernameInput.textContent =
      newName;

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
// アカウント一覧
// ==================================================

async function loadAccounts() {
  if (!currentUser) {
    return;
  }

  try {
    const data =
      await api(
        "/api/accounts"
      );

    const accounts =
      Array.isArray(
        data.accounts
      )
        ? data.accounts
        : [];

    accountCountLabel.textContent =
      `${accounts.length} / ${
        data.maxAccounts || 5
      }`;

    accountList.innerHTML =
      "";

    deleteAccountSelect.innerHTML =
      "";

    accounts.forEach(
      (account) => {
        const item =
          document.createElement(
            "div"
          );

        item.className =
          "account-item";

        if (
          Number(account.id) ===
          Number(currentUser.id)
        ) {
          item.classList.add(
            "current"
          );
        }

        const avatar =
          document.createElement(
            "div"
          );

        avatar.className =
          "account-avatar";

        avatar.textContent =
          (
            account.name ||
            "?"
          )
            .charAt(0)
            .toUpperCase();

        const info =
          document.createElement(
            "div"
          );

        info.className =
          "account-info";

        const name =
          document.createElement(
            "div"
          );

        name.className =
          "account-name";

        name.textContent =
          account.name;

        const email =
          document.createElement(
            "div"
          );

        email.className =
          "account-email";

        email.textContent =
          account.email;

        info.appendChild(
          name
        );

        info.appendChild(
          email
        );

        item.appendChild(
          avatar
        );

        item.appendChild(
          info
        );

        if (
          Number(account.id) ===
          Number(currentUser.id)
        ) {
          const current =
            document.createElement(
              "span"
            );

          current.textContent =
            "現在使用中";

          current.style.marginLeft =
            "auto";

          current.style.fontSize =
            "10px";

          current.style.color =
            "var(--primary)";

          current.style.fontWeight =
            "800";

          item.appendChild(
            current
          );
        }

        accountList.appendChild(
          item
        );

        const option =
          document.createElement(
            "option"
          );

        option.value =
          account.id;

        option.textContent =
          `${account.name}${
            Number(account.id) ===
            Number(currentUser.id)
              ? "（現在使用中）"
              : ""
          }`;

        deleteAccountSelect.appendChild(
          option
        );
      }
    );

    if (
      accounts.length === 0
    ) {
      const empty =
        document.createElement(
          "p"
        );

      empty.textContent =
        "アカウントがありません。";

      empty.style.color =
        "var(--text-soft)";

      empty.style.fontSize =
        "12px";

      accountList.appendChild(
        empty
      );
    }
  } catch (error) {
    accountList.innerHTML =
      "";

    const errorText =
      document.createElement(
        "p"
      );

    errorText.textContent =
      error.message;

    errorText.style.color =
      "var(--danger)";

    errorText.style.fontSize =
      "12px";

    accountList.appendChild(
      errorText
    );
  }
}

// ==================================================
// アカウント削除
// ==================================================

deleteAccountButton.addEventListener(
  "click",
  async () => {
    deleteAccountMessage.textContent =
      "";

    const userId =
      Number(
        deleteAccountSelect.value
      );

    const password =
      deleteAccountPassword.value;

    if (
      !Number.isInteger(
        userId
      )
    ) {
      deleteAccountMessage.textContent =
        "削除するアカウントを選択してください。";

      return;
    }

    if (!password) {
      deleteAccountMessage.textContent =
        "現在のパスワードを入力してください。";

      return;
    }

    const isCurrent =
      userId ===
      Number(currentUser.id);

    const message =
      isCurrent
        ? "現在ログイン中のアカウントを削除します。削除するとログアウトされます。本当に削除しますか？"
        : "このアカウントを削除しますか？";

    if (
      !confirm(message)
    ) {
      return;
    }

    deleteAccountButton.disabled =
      true;

    try {
      const data =
        await api(
          "/api/delete-account",
          {
            method:
              "POST",

            body:
              JSON.stringify({
                userId,

                password
              })
          }
        );

      if (
        data.loggedOut
      ) {
        if (socket) {
          socket.removeAllListeners();

          socket.disconnect();

          socket =
            null;
        }

        currentUser =
          null;

        messages.innerHTML =
          "";

        settingsModal.classList.add(
          "hidden"
        );

        deleteAccountPassword.value =
          "";

        showAuth();

        alert(
          "アカウントを削除しました。"
        );

        return;
      }

      deleteAccountPassword.value =
        "";

      deleteAccountMessage.style.color =
        "var(--primary)";

      deleteAccountMessage.textContent =
        data.message ||
        "アカウントを削除しました。";

      await loadAccounts();
    } catch (error) {
      deleteAccountMessage.style.color =
        "var(--danger)";

      deleteAccountMessage.textContent =
        error.message;
    } finally {
      deleteAccountButton.disabled =
        false;
    }
  }
);

// ==================================================
// テーマ
// ==================================================

themeToggleButton.addEventListener(
  "click",
  () => {
    darkMode =
      !darkMode;

    updateTheme();
  }
);

grayToggleButton.addEventListener(
  "click",
  () => {
    grayMode =
      !grayMode;

    updateTheme();
  }
);

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

  themeToggleButton.classList.toggle(
    "active",
    darkMode
  );

  grayToggleButton.textContent =
    grayMode
      ? "ON"
      : "OFF";

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
// モーダル外クリック
// ==================================================

[
  createModal,
  joinModal,
  settingsModal
].forEach(
  (modal) => {
    modal.addEventListener(
      "click",
      (event) => {
        if (
          event.target ===
          modal
        ) {
          modal.classList.add(
            "hidden"
          );
        }
      }
    );
  }
);

// ==================================================
// Enter
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
// 初期化
// ==================================================

updateTheme();

cleanupLocalMessages();

// ==================================================
// 10分ごとのLocalStorage掃除
// ==================================================

setInterval(
  cleanupLocalMessages,
  10 * 60 * 1000
);

// ==================================================
// 起動
// ==================================================

checkLogin();

"use strict";

// ==================================================
// Veylo App.js
// ==================================================

let socket = null;

let currentUser = null;

let currentRoom = "casual";

let currentRoomData = {
  id: "casual",
  name: "雑談",
  inviteCode: null,
  ownerId: null
};

let myRooms = [];

let replyToMessage = null;

let editingMessageId = null;

let isConnected = false;

let isLoadingMessages = false;


// ==================================================
// DOM
// ==================================================

const $ = (id) => document.getElementById(id);


// ==================================================
// Auth
// ==================================================

const authScreen = $("authScreen");
const appScreen = $("appScreen");

const loginPanel = $("loginPanel");
const registerPanel = $("registerPanel");
const forgotPanel = $("forgotPanel");

const loginForm = $("loginForm");
const registerForm = $("registerForm");
const forgotForm = $("forgotForm");

const loginError = $("loginError");
const registerError = $("registerError");
const forgotMessage = $("forgotMessage");

const loginName = $("loginName");
const loginPassword = $("loginPassword");

const registerEmail = $("registerEmail");
const registerName = $("registerName");
const registerPassword = $("registerPassword");

const forgotEmail = $("forgotEmail");


// ==================================================
// App
// ==================================================

const usernameInput = $("usernameInput");
const settingsUsernameInput = $("settingsUsernameInput");

const casualRoomButton = $("casualRoomButton");

const createRoomButton = $("createRoomButton");
const joinRoomButton = $("joinRoomButton");

const joinedRooms = $("joinedRooms");

const roomIcon = $("roomIcon");
const roomName = $("roomName");

const inviteArea = $("inviteArea");
const inviteCode = $("inviteCode");

const messages = $("messages");

const messageForm = $("messageForm");
const messageInput = $("messageInput");

const replyPreview = $("replyPreview");

const newMessageButton = $("newMessageButton");

const scrollTopButton = $("scrollTopButton");
const scrollBottomButton = $("scrollBottomButton");

const connectionDot = $("connectionDot");


// ==================================================
// Modals
// ==================================================

const createModal = $("createModal");

const roomNameInput = $("roomNameInput");

const confirmCreateButton =
  $("confirmCreateButton");

const cancelCreateButtons =
  document.querySelectorAll(
    "#cancelCreateButton"
  );

const joinModal = $("joinModal");

const inviteCodeInput =
  $("inviteCodeInput");

const confirmJoinButton =
  $("confirmJoinButton");

const cancelJoinButtons =
  document.querySelectorAll(
    "#cancelJoinButton"
  );

const joinError = $("joinError");

const settingsModal = $("settingsModal");

const settingsButton =
  $("settingsButton");

const closeSettingsButtons =
  document.querySelectorAll(
    "#closeSettingsButton"
  );

const logoutButton =
  $("logoutButton");

const saveSettingsButton =
  $("saveSettingsButton");

const themeToggleButton =
  $("themeToggleButton");

const grayToggleButton =
  $("grayToggleButton");

const languageSelect =
  $("languageSelect");


// ==================================================
// 初期化
// ==================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupAuthEvents();

    setupAppEvents();

    setupModalEvents();

    setupSettings();

    checkLogin();

  }
);


// ==================================================
// Authentication
// ==================================================

function setupAuthEvents() {

  const showRegisterButton =
    $("showRegisterButton");

  const showLoginButton =
    $("showLoginButton");

  const forgotPasswordButton =
    $("forgotPasswordButton");

  const backToLoginButton =
    $("backToLoginButton");


  if (showRegisterButton) {

    showRegisterButton.addEventListener(
      "click",
      () => {

        showAuthPanel(
          "register"
        );

      }
    );

  }


  if (showLoginButton) {

    showLoginButton.addEventListener(
      "click",
      () => {

        showAuthPanel(
          "login"
        );

      }
    );

  }


  if (forgotPasswordButton) {

    forgotPasswordButton.addEventListener(
      "click",
      () => {

        showAuthPanel(
          "forgot"
        );

      }
    );

  }


  if (backToLoginButton) {

    backToLoginButton.addEventListener(
      "click",
      () => {

        showAuthPanel(
          "login"
        );

      }
    );

  }


  if (loginForm) {

    loginForm.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        clearAuthMessages();

        const name =
          loginName.value.trim();

        const password =
          loginPassword.value;

        if (!name || !password) {

          showError(
            loginError,
            "名前とパスワードを入力してください。"
          );

          return;

        }

        try {

          const response =
            await fetch(
              "/api/login",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body:
                  JSON.stringify({
                    name,
                    password
                  })
              }
            );

          const data =
            await response.json();

          if (!response.ok) {

            showError(
              loginError,
              data.message ||
                "ログインに失敗しました。"
            );

            return;

          }

          currentUser =
            data.user;

          loginPassword.value = "";

          showApp();

        } catch (error) {

          console.error(
            "Login error:",
            error
          );

          showError(
            loginError,
            "通信エラーが発生しました。"
          );

        }

      }
    );

  }


  if (registerForm) {

    registerForm.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        clearAuthMessages();

        const email =
          registerEmail.value.trim();

        const name =
          registerName.value.trim();

        const password =
          registerPassword.value;

        if (!email || !name || !password) {

          showError(
            registerError,
            "すべて入力してください。"
          );

          return;

        }

        if (password.length < 8) {

          showError(
            registerError,
            "パスワードは8文字以上にしてください。"
          );

          return;

        }

        try {

          const response =
            await fetch(
              "/api/register",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body:
                  JSON.stringify({
                    email,
                    name,
                    password
                  })
              }
            );

          const data =
            await response.json();

          if (!response.ok) {

            showError(
              registerError,
              data.message ||
                "登録に失敗しました。"
            );

            return;

          }

          currentUser =
            data.user;

          registerPassword.value = "";

          showApp();

        } catch (error) {

          console.error(
            "Register error:",
            error
          );

          showError(
            registerError,
            "通信エラーが発生しました。"
          );

        }

      }
    );

  }


  if (forgotForm) {

    forgotForm.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();

        clearAuthMessages();

        const email =
          forgotEmail.value.trim();

        if (!email) {

          showError(
            forgotMessage,
            "メールアドレスを入力してください。"
          );

          return;

        }

        try {

          const response =
            await fetch(
              "/api/forgot-password",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body:
                  JSON.stringify({
                    email
                  })
              }
            );

          const data =
            await response.json();

          if (!response.ok) {

            showError(
              forgotMessage,
              data.message ||
                "処理に失敗しました。"
            );

            return;

          }

          forgotMessage.textContent =
            data.message ||
            "パスワード再設定の案内を送信しました。";

          forgotMessage.classList.remove(
            "form-error"
          );

          forgotMessage.classList.add(
            "form-message"
          );

        } catch (error) {

          console.error(
            "Forgot password error:",
            error
          );

          showError(
            forgotMessage,
            "通信エラーが発生しました。"
          );

        }

      }
    );

  }

}


// ==================================================
// Login Check
// ==================================================

async function checkLogin() {

  try {

    const response =
      await fetch(
        "/api/me",
        {
          credentials: "include"
        }
      );

    const data =
      await response.json();

    if (
      response.ok &&
      data.loggedIn &&
      data.user
    ) {

      currentUser =
        data.user;

      showApp();

    } else {

      showAuth();

    }

  } catch (error) {

    console.error(
      "checkLogin error:",
      error
    );

    showAuth();

  }

}


// ==================================================
// Auth UI
// ==================================================

function showAuth() {

  authScreen.classList.remove(
    "hidden"
  );

  appScreen.classList.add(
    "hidden"
  );

  disconnectSocket();

  showAuthPanel(
    "login"
  );

}


function showApp() {

  authScreen.classList.add(
    "hidden"
  );

  appScreen.classList.remove(
    "hidden"
  );

  updateUserUI();

  connectSocket();

}


function showAuthPanel(panel) {

  loginPanel.classList.add(
    "hidden"
  );

  registerPanel.classList.add(
    "hidden"
  );

  forgotPanel.classList.add(
    "hidden"
  );

  if (panel === "login") {

    loginPanel.classList.remove(
      "hidden"
    );

  }

  if (panel === "register") {

    registerPanel.classList.remove(
      "hidden"
    );

  }

  if (panel === "forgot") {

    forgotPanel.classList.remove(
      "hidden"
    );

  }

  clearAuthMessages();

}


function clearAuthMessages() {

  if (loginError) {
    loginError.textContent = "";
  }

  if (registerError) {
    registerError.textContent = "";
  }

  if (forgotMessage) {
    forgotMessage.textContent = "";
  }

}


function showError(
  element,
  message
) {

  if (!element) {
    return;
  }

  element.textContent =
    message;

}


// ==================================================
// User UI
// ==================================================

function updateUserUI() {

  if (!currentUser) {
    return;
  }

  if (usernameInput) {

    usernameInput.value =
      currentUser.name || "";

  }

  if (settingsUsernameInput) {

    settingsUsernameInput.value =
      currentUser.name || "";

  }

}


// ==================================================
// Socket.IO
// ==================================================

function connectSocket() {

  if (socket) {

    try {
      socket.disconnect();
    } catch (_) {}

    socket = null;

  }

  socket =
    io({
      withCredentials: true
    });


  socket.on(
    "connect",
    () => {

      isConnected = true;

      updateConnectionStatus(
        true
      );

      console.log(
        "Socket connected:",
        socket.id
      );

      socket.emit(
        "get my rooms"
      );

    }
  );


  socket.on(
    "disconnect",
    (reason) => {

      isConnected = false;

      updateConnectionStatus(
        false
      );

      console.log(
        "Socket disconnected:",
        reason
      );

    }
  );


  socket.on(
    "connect_error",
    (error) => {

      isConnected = false;

      updateConnectionStatus(
        false
      );

      console.error(
        "Socket connection error:",
        error
      );

    }
  );


  // ==================================================
  // 自分の部屋一覧
  // ==================================================

  socket.on(
    "my rooms",
    (rooms) => {

      if (!Array.isArray(rooms)) {

        myRooms = [];

      } else {

        myRooms = rooms;

      }

      renderJoinedRooms();

    }
  );


  // ==================================================
  // 部屋作成
  // ==================================================

  socket.on(
    "room created",
    (room) => {

      if (!room) {
        return;
      }

      currentRoomData =
        room;

      currentRoom =
        room.id;

      renderCurrentRoom();

      closeModal(
        createModal
      );

      roomNameInput.value = "";

      renderJoinedRooms();

      showToast(
        `「${room.name}」を作成しました。`
      );

    }
  );


  // ==================================================
  // 部屋参加
  // ==================================================

  socket.on(
    "room joined",
    (room) => {

      if (!room) {
        return;
      }

      currentRoomData =
        room;

      currentRoom =
        room.id;

      renderCurrentRoom();

      closeModal(
        joinModal
      );

      inviteCodeInput.value = "";

      if (joinError) {
        joinError.textContent = "";
      }

      renderJoinedRooms();

      showToast(
        `「${room.name}」に参加しました。`
      );

    }
  );


  // ==================================================
  // 部屋を開いた
  // ==================================================

  socket.on(
    "room opened",
    (room) => {

      if (!room) {
        return;
      }

      currentRoomData =
        room;

      currentRoom =
        room.id;

      renderCurrentRoom();

      renderJoinedRooms();

    }
  );


  // ==================================================
  // 雑談
  // ==================================================

  socket.on(
    "casual joined",
    () => {

      currentRoom =
        "casual";

      currentRoomData = {
        id: "casual",
        name: "雑談",
        inviteCode: null,
        ownerId: null
      };

      renderCurrentRoom();

    }
  );


  // ==================================================
  // 部屋削除
  // ==================================================

  socket.on(
    "room deleted",
    (data) => {

      const roomId =
        String(
          data?.roomId || ""
        );

      if (!roomId) {
        return;
      }

      myRooms =
        myRooms.filter(
          (room) =>
            room.id !== roomId
        );

      renderJoinedRooms();

      if (
        currentRoom === roomId
      ) {

        currentRoom =
          "casual";

        currentRoomData = {
          id: "casual",
          name: "雑談",
          inviteCode: null,
          ownerId: null
        };

        renderCurrentRoom();

      }

      showToast(
        "部屋が削除されました。"
      );

    }
  );


  // ==================================================
  // 部屋削除エラー
  // ==================================================

  socket.on(
    "delete room error",
    (data) => {

      showToast(
        data?.message ||
          "部屋を削除できませんでした。",
        true
      );

    }
  );


  // ==================================================
  // 部屋参加エラー
  // ==================================================

  socket.on(
    "join room error",
    (data) => {

      if (joinError) {

        joinError.textContent =
          data?.message ||
          "部屋に参加できませんでした。";

      }

    }
  );


  // ==================================================
  // 部屋作成エラー
  // ==================================================

  socket.on(
    "create room error",
    (data) => {

      showToast(
        data?.message ||
          "部屋を作成できませんでした。",
        true
      );

    }
  );


  // ==================================================
  // 部屋を開くエラー
  // ==================================================

  socket.on(
    "room open error",
    (data) => {

      showToast(
        data?.message ||
          "部屋を開けませんでした。",
        true
      );

    }
  );


  // ==================================================
  // 過去メッセージ
  // ==================================================

  socket.on(
    "previous messages",
    (messageList) => {

      isLoadingMessages = true;

      clearMessages();

      if (Array.isArray(messageList)) {

        messageList.forEach(
          (message) => {

            addMessageToUI(
              message,
              false
            );

          }
        );

      }

      isLoadingMessages = false;

      scrollMessagesToBottom();

    }
  );


  // ==================================================
  // 新着メッセージ
  // ==================================================

  socket.on(
    "chat message",
    (message) => {

      if (!message) {
        return;
      }

      if (
        message.room !==
        currentRoom
      ) {

        return;

      }

      const nearBottom =
        isNearBottom();

      addMessageToUI(
        message,
        true
      );

      if (nearBottom) {

        scrollMessagesToBottom();

        hideNewMessageButton();

      } else {

        showNewMessageButton();

      }

    }
  );


  // ==================================================
  // メッセージ編集
  // ==================================================

  socket.on(
    "message edited",
    (message) => {

      if (!message) {
        return;
      }

      updateMessageUI(
        message
      );

    }
  );


  // ==================================================
  // メッセージ削除
  // ==================================================

  socket.on(
    "message deleted",
    (data) => {

      if (!data) {
        return;
      }

      removeMessageUI(
        data.id
      );

    }
  );


  // ==================================================
  // エラー
  // ==================================================

  socket.on(
    "message send error",
    (data) => {

      showToast(
        data?.message ||
          "メッセージを送信できませんでした。",
        true
      );

    }
  );


  socket.on(
    "message edit error",
    (data) => {

      showToast(
        data?.message ||
          "メッセージを編集できませんでした。",
        true
      );

    }
  );


  socket.on(
    "message delete error",
    (data) => {

      showToast(
        data?.message ||
          "メッセージを削除できませんでした。",
        true
      );

    }
  );

}


// ==================================================
// Socket Disconnect
// ==================================================

function disconnectSocket() {

  if (!socket) {
    return;
  }

  try {

    socket.removeAllListeners();

    socket.disconnect();

  } catch (error) {

    console.error(
      "disconnectSocket error:",
      error
    );

  }

  socket = null;

  isConnected = false;

  updateConnectionStatus(
    false
  );

}


// ==================================================
// Connection UI
// ==================================================

function updateConnectionStatus(
  connected
) {

  if (!connectionDot) {
    return;
  }

  if (connected) {

    connectionDot.classList.add(
      "connected"
    );

    connectionDot.title =
      "接続中";

  } else {

    connectionDot.classList.remove(
      "connected"
    );

    connectionDot.title =
      "未接続";

  }

}


// ==================================================
// App Events
// ==================================================

function setupAppEvents() {

  // ==================================================
  // 雑談
  // ==================================================

  if (casualRoomButton) {

    casualRoomButton.addEventListener(
      "click",
      () => {

        if (!socket) {
          return;
        }

        socket.emit(
          "join casual"
        );

      }
    );

  }


  // ==================================================
  // 部屋作成
  // ==================================================

  if (createRoomButton) {

    createRoomButton.addEventListener(
      "click",
      () => {

        openModal(
          createModal
        );

        setTimeout(
          () => {

            if (roomNameInput) {
              roomNameInput.focus();
            }

          },
          50
        );

      }
    );

  }


  if (confirmCreateButton) {

    confirmCreateButton.addEventListener(
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


  // ==================================================
  // 部屋参加
  // ==================================================

  if (joinRoomButton) {

    joinRoomButton.addEventListener(
      "click",
      () => {

        openModal(
          joinModal
        );

        setTimeout(
          () => {

            if (inviteCodeInput) {
              inviteCodeInput.focus();
            }

          },
          50
        );

      }
    );

  }


  if (confirmJoinButton) {

    confirmJoinButton.addEventListener(
      "click",
      joinRoom
    );

  }


  if (inviteCodeInput) {

    inviteCodeInput.addEventListener(
      "input",
      () => {

        inviteCodeInput.value =
          inviteCodeInput.value
            .toUpperCase();

      }
    );


    inviteCodeInput.addEventListener(
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


  // ==================================================
  // メッセージ
  // ==================================================

  if (messageForm) {

    messageForm.addEventListener(
      "submit",
      (event) => {

        event.preventDefault();

        if (
          editingMessageId !== null
        ) {

          submitEditMessage();

          return;

        }

        sendMessage();

      }
    );

  }


  // ==================================================
  // Scroll
  // ==================================================

  if (scrollTopButton) {

    scrollTopButton.addEventListener(
      "click",
      () => {

        if (!messages) {
          return;
        }

        messages.scrollTo({
          top: 0,
          behavior: "smooth"
        });

      }
    );

  }


  if (scrollBottomButton) {

    scrollBottomButton.addEventListener(
      "click",
      () => {

        scrollMessagesToBottom();

      }
    );

  }


  if (newMessageButton) {

    newMessageButton.addEventListener(
      "click",
      () => {

        scrollMessagesToBottom();

        hideNewMessageButton();

      }
    );

  }


  if (messages) {

    messages.addEventListener(
      "scroll",
      () => {

        if (
          isNearBottom()
        ) {

          hideNewMessageButton();

        }

      }
    );

  }


  // ==================================================
  // 招待コードコピー
  // ==================================================

  if (inviteCode) {

    inviteCode.addEventListener(
      "click",
      async () => {

        const code =
          inviteCode.textContent.trim();

        if (
          !code ||
          code === "------"
        ) {

          return;

        }

        try {

          await navigator.clipboard.writeText(
            code
          );

          showToast(
            "招待コードをコピーしました。"
          );

        } catch (error) {

          console.error(
            "Copy error:",
            error
          );

          showToast(
            "招待コードをコピーできませんでした。",
            true
          );

        }

      }
    );

  }

}


// ==================================================
// Modal Events
// ==================================================

function setupModalEvents() {

  cancelCreateButtons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          closeModal(
            createModal
          );

        }
      );

    }
  );


  cancelJoinButtons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          closeModal(
            joinModal
          );

        }
      );

    }
  );


  if (settingsButton) {

    settingsButton.addEventListener(
      "click",
      () => {

        openModal(
          settingsModal
        );

      }
    );

  }


  closeSettingsButtons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          closeModal(
            settingsModal
          );

        }
      );

    }
  );


  [
    createModal,
    joinModal,
    settingsModal
  ].forEach(
    (modal) => {

      if (!modal) {
        return;
      }

      modal.addEventListener(
        "click",
        (event) => {

          if (
            event.target === modal
          ) {

            closeModal(
              modal
            );

          }

        }
      );

    }
  );


  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key !== "Escape"
      ) {

        return;

      }

      closeModal(
        createModal
      );

      closeModal(
        joinModal
      );

      closeModal(
        settingsModal
      );

    }
  );

}


// ==================================================
// Modal
// ==================================================

function openModal(
  modal
) {

  if (!modal) {
    return;
  }

  modal.classList.remove(
    "hidden"
  );

}


function closeModal(
  modal
) {

  if (!modal) {
    return;
  }

  modal.classList.add(
    "hidden"
  );

}


// ==================================================
// Create Room
// ==================================================

function createRoom() {

  if (!socket) {

    showToast(
      "サーバーに接続されていません。",
      true
    );

    return;

  }

  const name =
    roomNameInput.value.trim();

  if (!name) {

    showToast(
      "部屋の名前を入力してください。",
      true
    );

    roomNameInput.focus();

    return;

  }

  if (name.length > 100) {

    showToast(
      "部屋の名前は100文字以内にしてください。",
      true
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

      if (confirmCreateButton) {

        confirmCreateButton.disabled =
          false;

      }

    },
    1000
  );

}


// ==================================================
// Join Room
// ==================================================

function joinRoom() {

  if (!socket) {

    showJoinError(
      "サーバーに接続されていません。"
    );

    return;

  }

  const code =
    inviteCodeInput.value
      .trim()
      .toUpperCase();

  if (!code) {

    showJoinError(
      "招待コードを入力してください。"
    );

    inviteCodeInput.focus();

    return;

  }

  if (code.length > 20) {

    showJoinError(
      "招待コードが長すぎます。"
    );

    return;

  }

  confirmJoinButton.disabled =
    true;

  socket.emit(
    "join room",
    {
      code
    }
  );

  setTimeout(
    () => {

      if (confirmJoinButton) {

        confirmJoinButton.disabled =
          false;

      }

    },
    1000
  );

}


function showJoinError(
  message
) {

  if (joinError) {

    joinError.textContent =
      message;

  }

}


// ==================================================
// Room List
// ==================================================

function renderJoinedRooms() {

  if (!joinedRooms) {
    return;
  }

  joinedRooms.innerHTML = "";


  if (
    !Array.isArray(myRooms)
  ) {

    myRooms = [];

  }


  // --------------------------------------------------
  // 重複排除
  // --------------------------------------------------

  const uniqueRooms = [];

  const seen =
    new Set();

  myRooms.forEach(
    (room) => {

      if (
        !room ||
        !room.id
      ) {

        return;

      }

      if (
        seen.has(room.id)
      ) {

        return;

      }

      seen.add(
        room.id
      );

      uniqueRooms.push(
        room
      );

    }
  );


  // --------------------------------------------------
  // 部屋を作成日時順
  // --------------------------------------------------

  uniqueRooms.sort(
    (a, b) => {

      const aTime =
        new Date(
          a.createdAt || 0
        ).getTime();

      const bTime =
        new Date(
          b.createdAt || 0
        ).getTime();

      return aTime - bTime;

    }
  );


  // --------------------------------------------------
  // 部屋なし
  // --------------------------------------------------

  if (
    uniqueRooms.length === 0
  ) {

    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "joined-room-empty";

    empty.textContent =
      "まだ部屋がありません";

    joinedRooms.appendChild(
      empty
    );

    return;

  }


  // --------------------------------------------------
  // 部屋生成
  // --------------------------------------------------

  uniqueRooms.forEach(
    (room) => {

      const wrapper =
        document.createElement(
          "div"
        );

      wrapper.className =
        "joined-room-item";


      if (
        room.id === currentRoom
      ) {

        wrapper.classList.add(
          "active"
        );

      }


      // ==================================================
      // 開くボタン
      // ==================================================

      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

      button.className =
        "joined-room-button";


      const icon =
        document.createElement(
          "span"
        );

      icon.className =
        "joined-room-icon";

      icon.textContent =
        "🏠";


      const name =
        document.createElement(
          "span"
        );

      name.className =
        "joined-room-name";

      name.textContent =
        room.name ||
        "名前のない部屋";


      button.appendChild(
        icon
      );

      button.appendChild(
        name
      );


      button.addEventListener(
        "click",
        () => {

          openMyRoom(
            room.id
          );

        }
      );


      wrapper.appendChild(
        button
      );


      // ==================================================
      // 自分が作った部屋の場合
      // ==================================================

      if (
        isRoomOwner(room)
      ) {

        const deleteButton =
          document.createElement(
            "button"
          );

        deleteButton.type =
          "button";

        deleteButton.className =
          "joined-room-delete";

        deleteButton.textContent =
          "×";

        deleteButton.title =
          "この部屋を削除";

        deleteButton.addEventListener(
          "click",
          (event) => {

            event.stopPropagation();

            confirmDeleteRoom(
              room
            );

          }
        );

        wrapper.appendChild(
          deleteButton
        );

      }


      joinedRooms.appendChild(
        wrapper
      );

    }
  );

}


// ==================================================
// Room Owner
// ==================================================

function isRoomOwner(
  room
) {

  if (
    !currentUser ||
    !room
  ) {

    return false;

  }

  return (
    Number(room.ownerId) ===
    Number(currentUser.id)
  );

}


// ==================================================
// Open Room
// ==================================================

function openMyRoom(
  roomId
) {

  if (!socket) {

    showToast(
      "サーバーに接続されていません。",
      true
    );

    return;

  }

  if (!roomId) {
    return;
  }

  socket.emit(
    "open my room",
    {
      roomId
    }
  );

}


// ==================================================
// Delete Room Confirm
// ==================================================

function confirmDeleteRoom(
  room
) {

  if (!room) {
    return;
  }

  if (
    !isRoomOwner(room)
  ) {

    showToast(
      "自分が作成した部屋だけ削除できます。",
      true
    );

    return;

  }


  const confirmed =
    window.confirm(
      [
        `「${room.name}」を削除しますか？`,
        "",
        "この部屋のメッセージや参加情報も削除されます。",
        "この操作は元に戻せません。"
      ].join("\n")
    );


  if (!confirmed) {
    return;
  }


  deleteRoom(
    room.id
  );

}


// ==================================================
// Delete Room
// ==================================================

function deleteRoom(
  roomId
) {

  if (!socket) {

    showToast(
      "サーバーに接続されていません。",
      true
    );

    return;

  }

  if (!roomId) {
    return;
  }

  socket.emit(
    "delete room",
    {
      roomId
    }
  );

}


// ==================================================
// Current Room UI
// ==================================================

function renderCurrentRoom() {

  if (!currentRoomData) {
    return;
  }


  if (roomName) {

    roomName.textContent =
      currentRoomData.name ||
      "雑談";

  }


  if (roomIcon) {

    if (
      currentRoomData.id ===
      "casual"
    ) {

      roomIcon.textContent =
        "💬";

    } else {

      roomIcon.textContent =
        "🏠";

    }

  }


  // ==================================================
  // Invite Code
  // ==================================================

  if (
    currentRoomData.id !==
    "casual" &&
    currentRoomData.inviteCode
  ) {

    inviteArea.classList.remove(
      "hidden"
    );

    inviteCode.textContent =
      currentRoomData.inviteCode;

  } else {

    inviteArea.classList.add(
      "hidden"
    );

    inviteCode.textContent =
      "------";

  }


  // ==================================================
  // 雑談 active
  // ==================================================

  if (casualRoomButton) {

    if (
      currentRoom ===
      "casual"
    ) {

      casualRoomButton.classList.add(
        "active"
      );

    } else {

      casualRoomButton.classList.remove(
        "active"
      );

    }

  }


  renderJoinedRooms();

}


// ==================================================
// Messages
// ==================================================

function clearMessages() {

  if (!messages) {
    return;
  }

  messages.innerHTML = "";

}


function addMessageToUI(
  message,
  animate
) {

  if (!messages || !message) {
    return;
  }

  const element =
    createMessageElement(
      message
    );

  if (animate) {

    element.classList.add(
      "message-new"
    );

  }

  messages.appendChild(
    element
  );

}


function createMessageElement(
  message
) {

  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.className =
    "message";

  wrapper.dataset.messageId =
    String(message.id);


  if (
    currentUser &&
    Number(message.userId) ===
      Number(currentUser.id)
  ) {

    wrapper.classList.add(
      "own-message"
    );

  }


  // ==================================================
  // Header
  // ==================================================

  const header =
    document.createElement(
      "div"
    );

  header.className =
    "message-header";


  const username =
    document.createElement(
      "span"
    );

  username.className =
    "message-username";

  username.textContent =
    message.username ||
    "Unknown";


  const time =
    document.createElement(
      "span"
    );

  time.className =
    "message-time";

  time.textContent =
    formatMessageTime(
      message.createdAt
    );


  header.appendChild(
    username
  );

  header.appendChild(
    time
  );


  if (message.edited) {

    const edited =
      document.createElement(
        "span"
      );

    edited.className =
      "message-edited";

    edited.textContent =
      "編集済み";

    header.appendChild(
      edited
    );

  }


  wrapper.appendChild(
    header
  );


  // ==================================================
  // Reply
  // ==================================================

  if (
    message.replyToId
  ) {

    const reply =
      document.createElement(
        "div"
      );

    reply.className =
      "message-reply";


    const replyUser =
      document.createElement(
        "div"
      );

    replyUser.className =
      "message-reply-user";

    replyUser.textContent =
      message.replyToUsername ||
      "";


    const replyText =
      document.createElement(
        "div"
      );

    replyText.className =
      "message-reply-text";

    replyText.textContent =
      message.replyToText ||
      "";


    reply.appendChild(
      replyUser
    );

    reply.appendChild(
      replyText
    );


    reply.addEventListener(
      "click",
      () => {

        focusMessage(
          message.replyToId
        );

      }
    );


    wrapper.appendChild(
      reply
    );

  }


  // ==================================================
  // Text
  // ==================================================

  const text =
    document.createElement(
      "div"
    );

  text.className =
    "message-text";

  text.textContent =
    message.text || "";


  wrapper.appendChild(
    text
  );


  // ==================================================
  // Actions
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

  replyButton.className =
    "message-action";

  replyButton.textContent =
    "返信";

  replyButton.addEventListener(
    "click",
    () => {

      startReply(
        message
      );

    }
  );


  actions.appendChild(
    replyButton
  );


  if (
    currentUser &&
    Number(message.userId) ===
      Number(currentUser.id)
  ) {

    const editButton =
      document.createElement(
        "button"
      );

    editButton.type =
      "button";

    editButton.className =
      "message-action";

    editButton.textContent =
      "編集";

    editButton.addEventListener(
      "click",
      () => {

        startEdit(
          message
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
      "message-action danger";

    deleteButton.textContent =
      "削除";

    deleteButton.addEventListener(
      "click",
      () => {

        confirmDeleteMessage(
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


  wrapper.appendChild(
    actions
  );


  return wrapper;

}


// ==================================================
// Send Message
// ==================================================

function sendMessage() {

  if (!socket) {

    showToast(
      "サーバーに接続されていません。",
      true
    );

    return;

  }

  const text =
    messageInput.value.trim();

  if (!text) {
    return;
  }

  if (
    text.length > 5000
  ) {

    showToast(
      "メッセージは5000文字以内にしてください。",
      true
    );

    return;

  }


  socket.emit(
    "chat message",
    {
      room:
        currentRoom,

      text,

      replyToId:
        replyToMessage
          ? replyToMessage.id
          : null
    }
  );


  messageInput.value = "";

  clearReply();

  messageInput.focus();

}


// ==================================================
// Reply
// ==================================================

function startReply(
  message
) {

  if (!message) {
    return;
  }

  replyToMessage =
    message;


  if (replyPreview) {

    replyPreview.classList.remove(
      "hidden"
    );

    replyPreview.innerHTML = "";


    const title =
      document.createElement(
        "div"
      );

    title.className =
      "reply-preview-title";

    title.textContent =
      `${message.username || ""} に返信`;


    const text =
      document.createElement(
        "div"
      );

    text.className =
      "reply-preview-text";

    text.textContent =
      message.text || "";


    const close =
      document.createElement(
        "button"
      );

    close.type =
      "button";

    close.className =
      "reply-preview-close";

    close.textContent =
      "×";

    close.addEventListener(
      "click",
      clearReply
    );


    replyPreview.appendChild(
      title
    );

    replyPreview.appendChild(
      text
    );

    replyPreview.appendChild(
      close
    );

  }


  messageInput.focus();

}


function clearReply() {

  replyToMessage =
    null;

  if (replyPreview) {

    replyPreview.classList.add(
      "hidden"
    );

    replyPreview.innerHTML = "";

  }

}


// ==================================================
// Edit Message
// ==================================================

function startEdit(
  message
) {

  if (!message) {
    return;
  }

  if (
    !currentUser ||
    Number(message.userId) !==
      Number(currentUser.id)
  ) {

    return;

  }


  editingMessageId =
    Number(message.id);

  messageInput.value =
    message.text || "";

  messageInput.focus();


  if (messageInput) {

    messageInput.placeholder =
      "コメントを編集しています...";

  }


  if (replyPreview) {

    replyPreview.classList.remove(
      "hidden"
    );

    replyPreview.innerHTML = "";


    const title =
      document.createElement(
        "div"
      );

    title.className =
      "reply-preview-title";

    title.textContent =
      "コメントを編集中";


    const cancel =
      document.createElement(
        "button"
      );

    cancel.type =
      "button";

    cancel.className =
      "reply-preview-close";

    cancel.textContent =
      "×";

    cancel.addEventListener(
      "click",
      cancelEdit
    );


    replyPreview.appendChild(
      title
    );

    replyPreview.appendChild(
      cancel
    );

  }

}


function submitEditMessage() {

  if (!socket) {
    return;
  }

  if (
    editingMessageId === null
  ) {
    return;
  }

  const text =
    messageInput.value.trim();

  if (!text) {
    return;
  }

  if (
    text.length > 5000
  ) {

    showToast(
      "メッセージは5000文字以内にしてください。",
      true
    );

    return;

  }


  socket.emit(
    "edit message",
    {
      id:
        editingMessageId,

      text
    }
  );


  cancelEdit();

}


function cancelEdit() {

  editingMessageId =
    null;

  messageInput.value =
    "";

  messageInput.placeholder =
    "メッセージを入力...";

  clearReply();

  messageInput.focus();

}


// ==================================================
// Delete Message
// ==================================================

function confirmDeleteMessage(
  message
) {

  if (!message) {
    return;
  }

  const confirmed =
    window.confirm(
      "このコメントを削除しますか？"
    );

  if (!confirmed) {
    return;
  }

  deleteMessage(
    message.id
  );

}


function deleteMessage(
  id
) {

  if (!socket) {
    return;
  }

  socket.emit(
    "delete message",
    {
      id
    }
  );

}


// ==================================================
// Update Message UI
// ==================================================

function updateMessageUI(
  message
) {

  if (!messages || !message) {
    return;
  }

  const oldElement =
    messages.querySelector(
      `[data-message-id="${CSS.escape(
        String(message.id)
      )}"]`
    );

  if (!oldElement) {
    return;
  }

  const newElement =
    createMessageElement(
      message
    );

  oldElement.replaceWith(
    newElement
  );

}


// ==================================================
// Remove Message UI
// ==================================================

function removeMessageUI(
  id
) {

  if (!messages) {
    return;
  }

  const element =
    messages.querySelector(
      `[data-message-id="${CSS.escape(
        String(id)
      )}"]`
    );

  if (!element) {
    return;
  }

  element.remove();

}


// ==================================================
// Focus Message
// ==================================================

function focusMessage(
  id
) {

  if (!messages) {
    return;
  }

  const element =
    messages.querySelector(
      `[data-message-id="${CSS.escape(
        String(id)
      )}"]`
    );

  if (!element) {
    return;
  }

  element.scrollIntoView({
    behavior: "smooth",
    block: "center"
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
    1500
  );

}


// ==================================================
// Message Time
// ==================================================

function formatMessageTime(
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
// Scroll
// ==================================================

function scrollMessagesToBottom() {

  if (!messages) {
    return;
  }

  messages.scrollTo({
    top:
      messages.scrollHeight,

    behavior:
      "smooth"
  });

}


function isNearBottom() {

  if (!messages) {
    return true;
  }

  const distance =
    messages.scrollHeight -
    messages.scrollTop -
    messages.clientHeight;

  return distance < 120;

}


function showNewMessageButton() {

  if (!newMessageButton) {
    return;
  }

  newMessageButton.classList.remove(
    "hidden"
  );

}


function hideNewMessageButton() {

  if (!newMessageButton) {
    return;
  }

  newMessageButton.classList.add(
    "hidden"
  );

}


// ==================================================
// Settings
// ==================================================

function setupSettings() {

  const darkMode =
    localStorage.getItem(
      "veylo-dark-mode"
    ) === "true";

  const grayMode =
    localStorage.getItem(
      "veylo-gray-mode"
    ) === "true";


  applyTheme(
    darkMode
  );

  applyGrayMode(
    grayMode
  );


  if (themeToggleButton) {

    themeToggleButton.addEventListener(
      "click",
      () => {

        const enabled =
          document.body.classList.contains(
            "dark-mode"
          );

        applyTheme(
          !enabled
        );

      }
    );

  }


  if (grayToggleButton) {

    grayToggleButton.addEventListener(
      "click",
      () => {

        const enabled =
          document.body.classList.contains(
            "gray-mode"
          );

        applyGrayMode(
          !enabled
        );

      }
    );

  }


  if (languageSelect) {

    const language =
      localStorage.getItem(
        "veylo-language"
      ) || "ja";

    languageSelect.value =
      language;

  }


  if (saveSettingsButton) {

    saveSettingsButton.addEventListener(
      "click",
      () => {

        const language =
          languageSelect
            ? languageSelect.value
            : "ja";


        localStorage.setItem(
          "veylo-language",
          language
        );


        closeModal(
          settingsModal
        );


        showToast(
          "設定を保存しました。"
        );

      }
    );

  }


  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      logout
    );

  }

}


// ==================================================
// Theme
// ==================================================

function applyTheme(
  enabled
) {

  if (enabled) {

    document.body.classList.add(
      "dark-mode"
    );

    localStorage.setItem(
      "veylo-dark-mode",
      "true"
    );

  } else {

    document.body.classList.remove(
      "dark-mode"
    );

    localStorage.setItem(
      "veylo-dark-mode",
      "false"
    );

  }


  if (themeToggleButton) {

    themeToggleButton.textContent =
      enabled
        ? "ON"
        : "OFF";

  }

}


function applyGrayMode(
  enabled
) {

  if (enabled) {

    document.body.classList.add(
      "gray-mode"
    );

    localStorage.setItem(
      "veylo-gray-mode",
      "true"
    );

  } else {

    document.body.classList.remove(
      "gray-mode"
    );

    localStorage.setItem(
      "veylo-gray-mode",
      "false"
    );

  }


  if (grayToggleButton) {

    grayToggleButton.textContent =
      enabled
        ? "ON"
        : "OFF";

  }

}


// ==================================================
// Logout
// ==================================================

async function logout() {

  const confirmed =
    window.confirm(
      "ログアウトしますか？"
    );

  if (!confirmed) {
    return;
  }

  try {

    const response =
      await fetch(
        "/api/logout",
        {
          method: "POST",
          credentials: "include"
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      showToast(
        data.message ||
          "ログアウトに失敗しました。",
        true
      );

      return;

    }

    disconnectSocket();

    currentUser =
      null;

    currentRoom =
      "casual";

    currentRoomData = {
      id: "casual",
      name: "雑談",
      inviteCode: null,
      ownerId: null
    };

    myRooms = [];

    clearMessages();

    showAuth();

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

    showToast(
      "通信エラーが発生しました。",
      true
    );

  }

}


// ==================================================
// Toast
// ==================================================

function showToast(
  message,
  isError = false
) {

  const oldToast =
    document.querySelector(
      ".veylo-toast"
    );

  if (oldToast) {
    oldToast.remove();
  }


  const toast =
    document.createElement(
      "div"
    );

  toast.className =
    "veylo-toast";

  if (isError) {

    toast.classList.add(
      "error"
    );

  }

  toast.textContent =
    message;


  document.body.appendChild(
    toast
  );


  setTimeout(
    () => {

      toast.classList.add(
        "show"
      );

    },
    10
  );


  setTimeout(
    () => {

      toast.classList.remove(
        "show"
      );

      setTimeout(
        () => {

          toast.remove();

        },
        300
      );

    },
    3000
  );

}


// ==================================================
// Utility
// ==================================================

function escapeHtml(
  value
) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    value == null
      ? ""
      : String(value);

  return div.innerHTML;

}


// ==================================================
// Browser compatibility
// ==================================================

if (
  typeof CSS === "undefined" ||
  typeof CSS.escape !== "function"
) {

  if (
    typeof CSS === "undefined"
  ) {

    window.CSS = {};

  }

  CSS.escape =
    function (value) {

      return String(value)
        .replace(
          /[^a-zA-Z0-9_-]/g,
          "\\$&"
        );

    };

}


// ==================================================
// 初期状態
// ==================================================

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      !document.hidden &&
      socket &&
      !socket.connected &&
      currentUser
    ) {

      socket.connect();

    }

  }
);


// ==================================================
// Debug
// ==================================================

window.Veylo =
  {
    get currentUser() {
      return currentUser;
    },

    get currentRoom() {
      return currentRoom;
    },

    get currentRoomData() {
      return currentRoomData;
    },

    get myRooms() {
      return myRooms;
    },

    get socket() {
      return socket;
    }
  };

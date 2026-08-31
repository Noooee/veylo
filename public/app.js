"use strict";

// ==================================================
// Veylo App.js
// ==================================================

document.addEventListener("DOMContentLoaded", () => {

  // ==================================================
  // DOM
  // ==================================================

  const authScreen =
    document.getElementById("authScreen");

  const appScreen =
    document.getElementById("appScreen");

  // ==================================================
  // Auth
  // ==================================================

  const loginPanel =
    document.getElementById("loginPanel");

  const registerPanel =
    document.getElementById("registerPanel");

  const forgotPanel =
    document.getElementById("forgotPanel");

  const loginForm =
    document.getElementById("loginForm");

  const registerForm =
    document.getElementById("registerForm");

  const forgotForm =
    document.getElementById("forgotForm");

  const loginError =
    document.getElementById("loginError");

  const registerError =
    document.getElementById("registerError");

  const forgotMessage =
    document.getElementById("forgotMessage");

  const showRegisterButton =
    document.getElementById("showRegisterButton");

  const showLoginButton =
    document.getElementById("showLoginButton");

  const forgotPasswordButton =
    document.getElementById("forgotPasswordButton");

  const backToLoginButton =
    document.getElementById("backToLoginButton");

  // ==================================================
  // User
  // ==================================================

  const usernameInput =
    document.getElementById("usernameInput");

  const settingsUsernameInput =
    document.getElementById(
      "settingsUsernameInput"
    );

  // ==================================================
  // Rooms
  // ==================================================

  const casualRoomButton =
    document.getElementById(
      "casualRoomButton"
    );

  const createRoomButton =
    document.getElementById(
      "createRoomButton"
    );

  const joinRoomButton =
    document.getElementById(
      "joinRoomButton"
    );

  const joinedRooms =
    document.getElementById(
      "joinedRooms"
    );

  const roomName =
    document.getElementById(
      "roomName"
    );

  const roomIcon =
    document.getElementById(
      "roomIcon"
    );

  const inviteArea =
    document.getElementById(
      "inviteArea"
    );

  const inviteCode =
    document.getElementById(
      "inviteCode"
    );

  // ==================================================
  // Create modal
  // ==================================================

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

  // HTML側に cancelCreateButton が2つあるので
  // querySelectorAllで全部取得する
  const cancelCreateButtons =
    document.querySelectorAll(
      "#cancelCreateButton"
    );

  // ==================================================
  // Join modal
  // ==================================================

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

  const joinError =
    document.getElementById(
      "joinError"
    );

  const cancelJoinButtons =
    document.querySelectorAll(
      "#cancelJoinButton"
    );

  // ==================================================
  // Settings
  // ==================================================

  const settingsButton =
    document.getElementById(
      "settingsButton"
    );

  const settingsModal =
    document.getElementById(
      "settingsModal"
    );

  const closeSettingsButtons =
    document.querySelectorAll(
      "#closeSettingsButton"
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
  // Chat
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

  const replyPreview =
    document.getElementById(
      "replyPreview"
    );

  const newMessageButton =
    document.getElementById(
      "newMessageButton"
    );

  const scrollTopButton =
    document.getElementById(
      "scrollTopButton"
    );

  const scrollBottomButton =
    document.getElementById(
      "scrollBottomButton"
    );

  const connectionDot =
    document.getElementById(
      "connectionDot"
    );

  // ==================================================
  // State
  // ==================================================

  let socket = null;

  let currentUser = null;

  let currentRoomId = "casual";

  let currentRoom = {
    id: "casual",
    name: "雑談",
    inviteCode: null,
    ownerId: null
  };

  let myRooms = [];

  let replyToMessage = null;

  let isLoadingMessages = false;

  // ==================================================
  // Utilities
  // ==================================================

  function escapeHtml(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }

  function formatTime(dateValue) {

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

    return date.toLocaleTimeString(
      "ja-JP",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

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

  function scrollToBottom(
    smooth = true
  ) {

    if (!messages) {
      return;
    }

    messages.scrollTo({
      top:
        messages.scrollHeight,

      behavior:
        smooth
          ? "smooth"
          : "auto"
    });

  }

  function showScreen(
    screen
  ) {

    if (screen === "app") {

      authScreen?.classList.add(
        "hidden"
      );

      appScreen?.classList.remove(
        "hidden"
      );

    } else {

      appScreen?.classList.add(
        "hidden"
      );

      authScreen?.classList.remove(
        "hidden"
      );

    }

  }

  function setConnection(
    connected
  ) {

    if (!connectionDot) {
      return;
    }

    if (connected) {

      connectionDot.classList.add(
        "connected"
      );

      connectionDot.classList.remove(
        "disconnected"
      );

    } else {

      connectionDot.classList.remove(
        "connected"
      );

      connectionDot.classList.add(
        "disconnected"
      );

    }

  }

  // ==================================================
  // Auth panel
  // ==================================================

  function showAuthPanel(
    panel
  ) {

    loginPanel?.classList.add(
      "hidden"
    );

    registerPanel?.classList.add(
      "hidden"
    );

    forgotPanel?.classList.add(
      "hidden"
    );

    panel?.classList.remove(
      "hidden"
    );

  }

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
          credentials: "same-origin",

          ...options,

          headers: {
            "Content-Type":
              "application/json",

            ...(options.headers || {})
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

      error.status =
        response.status;

      error.data =
        data;

      throw error;

    }

    return data;

  }

  // ==================================================
  // Me
  // ==================================================

  async function loadCurrentUser() {

    try {

      const data =
        await api(
          "/api/me"
        );

      if (
        !data.loggedIn ||
        !data.user
      ) {

        currentUser = null;

        showScreen(
          "auth"
        );

        return false;

      }

      currentUser =
        data.user;

      updateUserUI();

      showScreen(
        "app"
      );

      return true;

    } catch (error) {

      console.error(
        "loadCurrentUser error:",
        error
      );

      showScreen(
        "auth"
      );

      return false;

    }

  }

  function updateUserUI() {

    if (!currentUser) {
      return;
    }

    if (usernameInput) {

      usernameInput.value =
        currentUser.name;

    }

    if (settingsUsernameInput) {

      settingsUsernameInput.value =
        currentUser.name;

    }

  }

  // ==================================================
  // Socket接続
  // ==================================================

  function connectSocket() {

    if (socket) {

      try {
        socket.disconnect();
      } catch {
        // ignore
      }

    }

    socket =
      io({
        withCredentials: true
      });

    // ==================================================
    // 接続
    // ==================================================

    socket.on(
      "connect",
      () => {

        console.log(
          "Socket connected:",
          socket.id
        );

        setConnection(
          true
        );

        // サーバーに最新の部屋一覧を要求
        socket.emit(
          "get my rooms"
        );

      }
    );

    // ==================================================
    // 切断
    // ==================================================

    socket.on(
      "disconnect",
      (reason) => {

        console.log(
          "Socket disconnected:",
          reason
        );

        setConnection(
          false
        );

      }
    );

    // ==================================================
    // 接続エラー
    // ==================================================

    socket.on(
      "connect_error",
      (error) => {

        console.error(
          "Socket connection error:",
          error
        );

        setConnection(
          false
        );

        if (
          error?.message ===
          "UNAUTHORIZED"
        ) {

          showScreen(
            "auth"
          );

        }

      }
    );

    // ==================================================
    // 自分の部屋一覧
    // ==================================================

    socket.on(
      "my rooms",
      (rooms) => {

        console.log(
          "my rooms:",
          rooms
        );

        setMyRooms(
          Array.isArray(rooms)
            ? rooms
            : []
        );

      }
    );

    // ==================================================
    // 部屋作成成功
    // ==================================================

    socket.on(
      "room created",
      (room) => {

        console.log(
          "room created:",
          room
        );

        if (!room) {
          return;
        }

        currentRoom =
          room;

        currentRoomId =
          room.id;

        // 部屋一覧に即追加
        addOrUpdateMyRoom(
          room
        );

        updateCurrentRoomUI();

        closeCreateModal();

      }
    );

    // ==================================================
    // 部屋参加成功
    // ==================================================

    socket.on(
      "room joined",
      (room) => {

        console.log(
          "room joined:",
          room
        );

        if (!room) {
          return;
        }

        currentRoom =
          room;

        currentRoomId =
          room.id;

        addOrUpdateMyRoom(
          room
        );

        updateCurrentRoomUI();

        closeJoinModal();

      }
    );

    // ==================================================
    // 自分の部屋を開いた
    // ==================================================

    socket.on(
      "room opened",
      (room) => {

        console.log(
          "room opened:",
          room
        );

        if (!room) {
          return;
        }

        currentRoom =
          room;

        currentRoomId =
          room.id;

        addOrUpdateMyRoom(
          room
        );

        updateCurrentRoomUI();

      }
    );

    // ==================================================
    // 雑談に参加
    // ==================================================

    socket.on(
      "casual joined",
      () => {

        currentRoomId =
          "casual";

        currentRoom = {
          id: "casual",
          name: "雑談",
          inviteCode: null,
          ownerId: null
        };

        updateCurrentRoomUI();

      }
    );

    // ==================================================
    // 過去メッセージ
    // ==================================================

    socket.on(
      "previous messages",
      (list) => {

        renderMessages(
          Array.isArray(list)
            ? list
            : []
        );

      }
    );

    // ==================================================
    // 新規メッセージ
    // ==================================================

    socket.on(
      "chat message",
      (message) => {

        if (!message) {
          return;
        }

        if (
          message.room !==
          currentRoomId
        ) {

          return;

        }

        const shouldScroll =
          isNearBottom();

        appendMessage(
          message
        );

        if (shouldScroll) {

          scrollToBottom(
            true
          );

        } else {

          newMessageButton?.classList.remove(
            "hidden"
          );

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

        updateMessageElement(
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

        const element =
          document.querySelector(
            `[data-message-id="${CSS.escape(String(data.id))}"]`
          );

        if (element) {

          element.remove();

        }

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

        console.log(
          "room deleted:",
          roomId
        );

        // ローカル一覧から削除
        myRooms =
          myRooms.filter(
            room =>
              String(room.id) !==
              roomId
          );

        renderJoinedRooms();

        // 今開いていた部屋なら雑談へ
        if (
          String(currentRoomId) ===
          roomId
        ) {

          currentRoomId =
            "casual";

          currentRoom = {
            id: "casual",
            name: "雑談",
            inviteCode: null,
            ownerId: null
          };

          updateCurrentRoomUI();

          messages.innerHTML =
            "";

          // サーバー側でも雑談へ移動済みだが
          // 念のため
          if (
            socket.connected
          ) {

            socket.emit(
              "join casual"
            );

          }

        }

      }
    );

    // ==================================================
    // エラー
    // ==================================================

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
      "join room error",
      (data) => {

        if (joinError) {

          joinError.textContent =
            data?.message ||
            "部屋に参加できませんでした。";

        } else {

          alert(
            data?.message ||
            "部屋に参加できませんでした。"
          );

        }

      }
    );

    socket.on(
      "room open error",
      (data) => {

        alert(
          data?.message ||
          "部屋を開けませんでした。"
        );

      }
    );

    socket.on(
      "delete room error",
      (data) => {

        alert(
          data?.message ||
          "部屋を削除できませんでした。"
        );

      }
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
  // 部屋一覧
  // ==================================================

  function setMyRooms(
    rooms
  ) {

    const unique =
      new Map();

    for (
      const room of rooms
    ) {

      if (
        !room ||
        !room.id
      ) {
        continue;
      }

      unique.set(
        String(room.id),
        room
      );

    }

    myRooms =
      Array.from(
        unique.values()
      );

    renderJoinedRooms();

  }

  function addOrUpdateMyRoom(
    room
  ) {

    if (
      !room ||
      !room.id
    ) {
      return;
    }

    const roomId =
      String(room.id);

    const index =
      myRooms.findIndex(
        item =>
          String(item.id) ===
          roomId
      );

    if (index >= 0) {

      myRooms[index] =
        {
          ...myRooms[index],
          ...room
        };

    } else {

      myRooms.push(
        room
      );

    }

    renderJoinedRooms();

  }

  function renderJoinedRooms() {

    if (!joinedRooms) {
      return;
    }

    joinedRooms.innerHTML =
      "";

    // ==================================================
    // 重要
    //
    // 雑談はHTML側に最初からあるので、
    // ここでは作成/参加した部屋だけ描画する。
    // ==================================================

    if (
      myRooms.length === 0
    ) {

      const empty =
        document.createElement(
          "div"
        );

      empty.className =
        "joined-rooms-empty";

      empty.textContent =
        "参加中の部屋はありません";

      joinedRooms.appendChild(
        empty
      );

      return;

    }

    // 作成日時順
    const rooms =
      [...myRooms].sort(
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

    for (
      const room of rooms
    ) {

      const button =
        document.createElement(
          "div"
        );

      button.className =
        "joined-room-item";

      if (
        String(room.id) ===
        String(currentRoomId)
      ) {

        button.classList.add(
          "active"
        );

      }

      // ==================================================
      // 部屋本体
      // ==================================================

      const main =
        document.createElement(
          "button"
        );

      main.type =
        "button";

      main.className =
        "joined-room-main";

      main.innerHTML = `
        <span class="joined-room-icon">🏠</span>
        <span class="joined-room-name">
          ${escapeHtml(room.name)}
        </span>
      `;

      main.addEventListener(
        "click",
        () => {

          openMyRoom(
            room.id
          );

        }
      );

      button.appendChild(
        main
      );

      // ==================================================
      // 自分が作成した部屋なら削除ボタン
      // ==================================================

      const ownerId =
        room.ownerId !== null &&
        room.ownerId !== undefined
          ? Number(room.ownerId)
          : null;

      const userId =
        currentUser
          ? Number(currentUser.id)
          : null;

      if (
        ownerId !== null &&
        userId !== null &&
        ownerId === userId
      ) {

        const deleteButton =
          document.createElement(
            "button"
          );

        deleteButton.type =
          "button";

        deleteButton.className =
          "joined-room-delete";

        deleteButton.title =
          "この部屋を削除";

        deleteButton.textContent =
          "×";

        deleteButton.addEventListener(
          "click",
          (event) => {

            event.preventDefault();

            event.stopPropagation();

            deleteRoom(
              room
            );

          }
        );

        button.appendChild(
          deleteButton
        );

      }

      joinedRooms.appendChild(
        button
      );

    }

  }

  // ==================================================
  // 部屋を開く
  // ==================================================

  function openMyRoom(
    roomId
  ) {

    if (
      !socket ||
      !socket.connected
    ) {

      alert(
        "サーバーに接続されていません。"
      );

      return;

    }

    const room =
      myRooms.find(
        item =>
          String(item.id) ===
          String(roomId)
      );

    if (!room) {

      console.warn(
        "Room not found in local list:",
        roomId
      );

      socket.emit(
        "get my rooms"
      );

      return;

    }

    currentRoomId =
      room.id;

    currentRoom =
      room;

    updateCurrentRoomUI();

    messages.innerHTML =
      "";

    socket.emit(
      "open my room",
      {
        roomId:
          room.id
      }
    );

  }

  // ==================================================
  // 部屋削除
  // ==================================================

  function deleteRoom(
    room
  ) {

    if (!room) {
      return;
    }

    const roomNameText =
      room.name ||
      "この部屋";

    const confirmed =
      window.confirm(
        `「${roomNameText}」を削除しますか？\n\nこの部屋のメッセージも削除されます。\nこの操作は元に戻せません。`
      );

    if (!confirmed) {
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
      "delete room",
      {
        roomId:
          room.id
      }
    );

  }

  // ==================================================
  // 現在の部屋UI
  // ==================================================

  function updateCurrentRoomUI() {

    const isCasual =
      currentRoomId ===
      "casual";

    if (isCasual) {

      if (roomName) {

        roomName.textContent =
          "雑談";

      }

      if (roomIcon) {

        roomIcon.textContent =
          "💬";

      }

      if (inviteArea) {

        inviteArea.classList.add(
          "hidden"
        );

      }

      casualRoomButton?.classList.add(
        "active"
      );

    } else {

      if (roomName) {

        roomName.textContent =
          currentRoom?.name ||
          "ルーム";

      }

      if (roomIcon) {

        roomIcon.textContent =
          "🏠";

      }

      if (
        inviteArea &&
        currentRoom?.inviteCode
      ) {

        inviteArea.classList.remove(
          "hidden"
        );

      }

      if (inviteCode) {

        inviteCode.textContent =
          currentRoom?.inviteCode ||
          "------";

      }

      casualRoomButton?.classList.remove(
        "active"
      );

    }

    // サイドバーを再描画して
    // 現在の部屋をactiveにする
    renderJoinedRooms();

  }

  // ==================================================
  // 雑談
  // ==================================================

  function joinCasualRoom() {

    if (
      !socket ||
      !socket.connected
    ) {

      return;

    }

    currentRoomId =
      "casual";

    currentRoom = {
      id: "casual",
      name: "雑談",
      inviteCode: null,
      ownerId: null
    };

    updateCurrentRoomUI();

    messages.innerHTML =
      "";

    socket.emit(
      "join casual"
    );

  }

  casualRoomButton?.addEventListener(
    "click",
    joinCasualRoom
  );

  // ==================================================
  // Create Modal
  // ==================================================

  function openCreateModal() {

    if (!createModal) {
      return;
    }

    createModal.classList.remove(
      "hidden"
    );

    if (roomNameInput) {

      roomNameInput.value =
        "";

      setTimeout(
        () => {
          roomNameInput.focus();
        },
        50
      );

    }

  }

  function closeCreateModal() {

    createModal?.classList.add(
      "hidden"
    );

  }

  createRoomButton?.addEventListener(
    "click",
    openCreateModal
  );

  cancelCreateButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        closeCreateModal
      );

    }
  );

  confirmCreateButton?.addEventListener(
    "click",
    () => {

      const name =
        String(
          roomNameInput?.value ||
          ""
        ).trim();

      if (!name) {

        alert(
          "部屋の名前を入力してください。"
        );

        roomNameInput?.focus();

        return;

      }

      if (name.length > 100) {

        alert(
          "部屋の名前は100文字以内にしてください。"
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

      // 少しだけ待ってから戻す
      setTimeout(
        () => {

          if (
            confirmCreateButton
          ) {

            confirmCreateButton.disabled =
              false;

          }

        },
        1500
      );

    }
  );

  roomNameInput?.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key ===
        "Enter"
      ) {

        event.preventDefault();

        confirmCreateButton?.click();

      }

    }
  );

  // ==================================================
  // Join Modal
  // ==================================================

  function openJoinModal() {

    if (!joinModal) {
      return;
    }

    joinModal.classList.remove(
      "hidden"
    );

    if (joinError) {

      joinError.textContent =
        "";

    }

    if (inviteCodeInput) {

      inviteCodeInput.value =
        "";

      setTimeout(
        () => {
          inviteCodeInput.focus();
        },
        50
      );

    }

  }

  function closeJoinModal() {

    joinModal?.classList.add(
      "hidden"
    );

  }

  joinRoomButton?.addEventListener(
    "click",
    openJoinModal
  );

  cancelJoinButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        closeJoinModal
      );

    }
  );

  confirmJoinButton?.addEventListener(
    "click",
    () => {

      const code =
        String(
          inviteCodeInput?.value ||
          ""
        )
          .trim()
          .toUpperCase();

      if (!code) {

        if (joinError) {

          joinError.textContent =
            "招待コードを入力してください。";

        }

        inviteCodeInput?.focus();

        return;

      }

      if (
        !socket ||
        !socket.connected
      ) {

        if (joinError) {

          joinError.textContent =
            "サーバーに接続されていません。";

        }

        return;

      }

      if (joinError) {

        joinError.textContent =
          "";

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

          if (
            confirmJoinButton
          ) {

            confirmJoinButton.disabled =
              false;

          }

        },
        1500
      );

    }
  );

  inviteCodeInput?.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key ===
        "Enter"
      ) {

        event.preventDefault();

        confirmJoinButton?.click();

      }

    }
  );

  // ==================================================
  // Invite Code Copy
  // ==================================================

  inviteCode?.addEventListener(
    "click",
    async () => {

      const code =
        currentRoom?.inviteCode;

      if (!code) {
        return;
      }

      try {

        await navigator.clipboard.writeText(
          code
        );

        const original =
          inviteCode.textContent;

        inviteCode.textContent =
          "コピーしました！";

        setTimeout(
          () => {

            if (inviteCode) {

              inviteCode.textContent =
                original;

            }

          },
          1200
        );

      } catch (error) {

        console.error(
          "clipboard error:",
          error
        );

      }

    }
  );

  // ==================================================
  // Messages
  // ==================================================

  function clearMessages() {

    if (messages) {

      messages.innerHTML =
        "";

    }

  }

  function renderMessages(
    list
  ) {

    if (!messages) {
      return;
    }

    isLoadingMessages =
      true;

    clearMessages();

    for (
      const message of list
    ) {

      if (
        message.room !==
        currentRoomId
      ) {

        continue;

      }

      appendMessage(
        message,
        false
      );

    }

    isLoadingMessages =
      false;

    requestAnimationFrame(
      () => {

        scrollToBottom(
          false
        );

      }
    );

  }

  function appendMessage(
    message,
    scroll = true
  ) {

    if (!messages || !message) {
      return;
    }

    if (
      message.room !==
      currentRoomId
    ) {

      return;

    }

    const wrapper =
      document.createElement(
        "div"
      );

    wrapper.className =
      "message";

    wrapper.dataset.messageId =
      String(message.id);

    const isOwn =
      currentUser &&
      Number(message.userId) ===
      Number(currentUser.id);

    if (isOwn) {

      wrapper.classList.add(
        "own"
      );

    }

    const replyHtml =
      message.replyToId
        ? `
          <div class="message-reply">
            <div class="message-reply-user">
              ↪ ${escapeHtml(
                message.replyToUsername ||
                ""
              )}
            </div>

            <div class="message-reply-text">
              ${escapeHtml(
                message.replyToText ||
                ""
              )}
            </div>
          </div>
        `
        : "";

    wrapper.innerHTML = `
      ${replyHtml}

      <div class="message-header">

        <span class="message-username">
          ${escapeHtml(
            message.username ||
            "Unknown"
          )}
        </span>

        <span class="message-time">
          ${formatTime(
            message.createdAt
          )}
        </span>

        ${
          message.edited
            ? `
              <span class="message-edited">
                編集済み
              </span>
            `
            : ""
        }

      </div>

      <div class="message-text">
        ${escapeHtml(
          message.text
        )}
      </div>

      <div class="message-actions">

        <button
          type="button"
          class="message-reply-button"
          data-action="reply"
        >
          返信
        </button>

        ${
          isOwn
            ? `
              <button
                type="button"
                class="message-edit-button"
                data-action="edit"
              >
                編集
              </button>

              <button
                type="button"
                class="message-delete-button"
                data-action="delete"
              >
                削除
              </button>
            `
            : ""
        }

      </div>
    `;

    wrapper
      .querySelector(
        '[data-action="reply"]'
      )
      ?.addEventListener(
        "click",
        () => {

          setReply(
            message
          );

        }
      );

    wrapper
      .querySelector(
        '[data-action="edit"]'
      )
      ?.addEventListener(
        "click",
        () => {

          editMessage(
            message
          );

        }
      );

    wrapper
      .querySelector(
        '[data-action="delete"]'
      )
      ?.addEventListener(
        "click",
        () => {

          deleteMessage(
            message
          );

        }
      );

    messages.appendChild(
      wrapper
    );

    if (scroll) {

      requestAnimationFrame(
        () => {

          scrollToBottom(
            true
          );

        }
      );

    }

  }

  function updateMessageElement(
    message
  ) {

    if (!messages || !message) {
      return;
    }

    const element =
      messages.querySelector(
        `[data-message-id="${CSS.escape(String(message.id))}"]`
      );

    if (!element) {
      return;
    }

    const textElement =
      element.querySelector(
        ".message-text"
      );

    if (textElement) {

      textElement.textContent =
        message.text;

    }

    let editedElement =
      element.querySelector(
        ".message-edited"
      );

    if (
      message.edited &&
      !editedElement
    ) {

      editedElement =
        document.createElement(
          "span"
        );

      editedElement.className =
        "message-edited";

      editedElement.textContent =
        "編集済み";

      element
        .querySelector(
          ".message-header"
        )
        ?.appendChild(
          editedElement
        );

    }

  }

  // ==================================================
  // Reply
  // ==================================================

  function setReply(
    message
  ) {

    replyToMessage =
      message;

    if (!replyPreview) {
      return;
    }

    replyPreview.classList.remove(
      "hidden"
    );

    replyPreview.innerHTML = `
      <div class="reply-preview-content">

        <div class="reply-preview-title">
          ${escapeHtml(
            message.username ||
            ""
          )}
          に返信
        </div>

        <div class="reply-preview-text">
          ${escapeHtml(
            message.text ||
            ""
          )}
        </div>

      </div>

      <button
        type="button"
        class="reply-preview-close"
        id="cancelReplyButton"
      >
        ×
      </button>
    `;

    document
      .getElementById(
        "cancelReplyButton"
      )
      ?.addEventListener(
        "click",
        clearReply
      );

    messageInput?.focus();

  }

  function clearReply() {

    replyToMessage =
      null;

    replyPreview?.classList.add(
      "hidden"
    );

    if (replyPreview) {

      replyPreview.innerHTML =
        "";

    }

  }

  // ==================================================
  // Send message
  // ==================================================

  messageForm?.addEventListener(
    "submit",
    (event) => {

      event.preventDefault();

      const text =
        String(
          messageInput?.value ||
          ""
        ).trim();

      if (!text) {
        return;
      }

      if (text.length > 5000) {

        alert(
          "メッセージが長すぎます。"
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
        "chat message",
        {
          room:
            currentRoomId,

          text,

          replyToId:
            replyToMessage
              ? replyToMessage.id
              : null
        }
      );

      messageInput.value =
        "";

      clearReply();

    }
  );

  // ==================================================
  // Edit message
  // ==================================================

  function editMessage(
    message
  ) {

    if (!message) {
      return;
    }

    const newText =
      window.prompt(
        "メッセージを編集",
        message.text || ""
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
        "メッセージを空にはできません。"
      );

      return;

    }

    if (
      !socket ||
      !socket.connected
    ) {

      return;

    }

    socket.emit(
      "edit message",
      {
        id:
          message.id,

        text
      }
    );

  }

  // ==================================================
  // Delete message
  // ==================================================

  function deleteMessage(
    message
  ) {

    if (!message) {
      return;
    }

    const confirmed =
      window.confirm(
        "このメッセージを削除しますか？"
      );

    if (!confirmed) {
      return;
    }

    if (
      !socket ||
      !socket.connected
    ) {

      return;

    }

    socket.emit(
      "delete message",
      {
        id:
          message.id
      }
    );

  }

  // ==================================================
  // Scroll
  // ==================================================

  scrollTopButton?.addEventListener(
    "click",
    () => {

      messages?.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    }
  );

  scrollBottomButton?.addEventListener(
    "click",
    () => {

      scrollToBottom(
        true
      );

    }
  );

  newMessageButton?.addEventListener(
    "click",
    () => {

      scrollToBottom(
        true
      );

      newMessageButton.classList.add(
        "hidden"
      );

    }
  );

  messages?.addEventListener(
    "scroll",
    () => {

      if (
        isNearBottom()
      ) {

        newMessageButton?.classList.add(
          "hidden"
        );

      }

    }
  );

  // ==================================================
  // Settings
  // ==================================================

  function openSettings() {

    settingsModal?.classList.remove(
      "hidden"
    );

    loadSettings();

  }

  function closeSettings() {

    settingsModal?.classList.add(
      "hidden"
    );

  }

  settingsButton?.addEventListener(
    "click",
    openSettings
  );

  closeSettingsButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        closeSettings
      );

    }
  );

  function loadSettings() {

    const dark =
      localStorage.getItem(
        "veylo-dark-mode"
      ) === "true";

    const gray =
      localStorage.getItem(
        "veylo-gray-mode"
      ) === "true";

    applyTheme(
      dark
    );

    applyGrayMode(
      gray
    );

    if (themeToggleButton) {

      themeToggleButton.textContent =
        dark
          ? "ON"
          : "OFF";

    }

    if (grayToggleButton) {

      grayToggleButton.textContent =
        gray
          ? "ON"
          : "OFF";

    }

    const language =
      localStorage.getItem(
        "veylo-language"
      ) || "ja";

    if (languageSelect) {

      languageSelect.value =
        language;

    }

  }

  function applyTheme(
    enabled
  ) {

    document.body.classList.toggle(
      "dark-mode",
      Boolean(enabled)
    );

  }

  function applyGrayMode(
    enabled
  ) {

    document.body.classList.toggle(
      "gray-mode",
      Boolean(enabled)
    );

  }

  themeToggleButton?.addEventListener(
    "click",
    () => {

      const enabled =
        !(
          localStorage.getItem(
            "veylo-dark-mode"
          ) === "true"
        );

      localStorage.setItem(
        "veylo-dark-mode",
        String(enabled)
      );

      applyTheme(
        enabled
      );

      themeToggleButton.textContent =
        enabled
          ? "ON"
          : "OFF";

    }
  );

  grayToggleButton?.addEventListener(
    "click",
    () => {

      const enabled =
        !(
          localStorage.getItem(
            "veylo-gray-mode"
          ) === "true"
        );

      localStorage.setItem(
        "veylo-gray-mode",
        String(enabled)
      );

      applyGrayMode(
        enabled
      );

      grayToggleButton.textContent =
        enabled
          ? "ON"
          : "OFF";

    }
  );

  saveSettingsButton?.addEventListener(
    "click",
    () => {

      if (languageSelect) {

        localStorage.setItem(
          "veylo-language",
          languageSelect.value
        );

      }

      closeSettings();

    }
  );

  // ==================================================
  // Logout
  // ==================================================

  logoutButton?.addEventListener(
    "click",
    async () => {

      const confirmed =
        window.confirm(
          "ログアウトしますか？"
        );

      if (!confirmed) {
        return;
      }

      try {

        await api(
          "/api/logout",
          {
            method: "POST"
          }
        );

        if (socket) {

          socket.disconnect();

        }

        currentUser =
          null;

        myRooms =
          [];

        currentRoomId =
          "casual";

        currentRoom = {
          id: "casual",
          name: "雑談",
          inviteCode: null,
          ownerId: null
        };

        showScreen(
          "auth"
        );

        showAuthPanel(
          loginPanel
        );

        closeSettings();

      } catch (error) {

        alert(
          error.message ||
          "ログアウトに失敗しました。"
        );

      }

    }
  );

  // ==================================================
  // Login
  // ==================================================

  loginForm?.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      if (loginError) {

        loginError.textContent =
          "";

      }

      const name =
        String(
          document.getElementById(
            "loginName"
          )?.value ||
          ""
        ).trim();

      const password =
        String(
          document.getElementById(
            "loginPassword"
          )?.value ||
          ""
        );

      try {

        const data =
          await api(
            "/api/login",
            {
              method: "POST",

              body:
                JSON.stringify({
                  name,
                  password
                })
            }
          );

        currentUser =
          data.user;

        updateUserUI();

        showScreen(
          "app"
        );

        connectSocket();

      } catch (error) {

        if (loginError) {

          loginError.textContent =
            error.message ||
            "ログインに失敗しました。";

        }

      }

    }
  );

  // ==================================================
  // Register
  // ==================================================

  registerForm?.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      if (registerError) {

        registerError.textContent =
          "";

      }

      const email =
        String(
          document.getElementById(
            "registerEmail"
          )?.value ||
          ""
        ).trim();

      const name =
        String(
          document.getElementById(
            "registerName"
          )?.value ||
          ""
        ).trim();

      const password =
        String(
          document.getElementById(
            "registerPassword"
          )?.value ||
          ""
        );

      try {

        const data =
          await api(
            "/api/register",
            {
              method: "POST",

              body:
                JSON.stringify({
                  email,
                  name,
                  password
                })
            }
          );

        currentUser =
          data.user;

        updateUserUI();

        showScreen(
          "app"
        );

        connectSocket();

      } catch (error) {

        if (registerError) {

          registerError.textContent =
            error.message ||
            "登録に失敗しました。";

        }

      }

    }
  );

  // ==================================================
  // Forgot Password
  // ==================================================

  forgotForm?.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      if (forgotMessage) {

        forgotMessage.textContent =
          "";

      }

      const email =
        String(
          document.getElementById(
            "forgotEmail"
          )?.value ||
          ""
        ).trim();

      try {

        const data =
          await api(
            "/api/forgot-password",
            {
              method: "POST",

              body:
                JSON.stringify({
                  email
                })
            }
          );

        if (forgotMessage) {

          forgotMessage.textContent =
            data.message ||
            "メールを送信しました。";

        }

      } catch (error) {

        if (forgotMessage) {

          forgotMessage.textContent =
            error.message ||
            "処理に失敗しました。";

        }

      }

    }
  );

  // ==================================================
  // Auth navigation
  // ==================================================

  showRegisterButton?.addEventListener(
    "click",
    () => {

      showAuthPanel(
        registerPanel
      );

    }
  );

  showLoginButton?.addEventListener(
    "click",
    () => {

      showAuthPanel(
        loginPanel
      );

    }
  );

  forgotPasswordButton?.addEventListener(
    "click",
    () => {

      showAuthPanel(
        forgotPanel
      );

    }
  );

  backToLoginButton?.addEventListener(
    "click",
    () => {

      showAuthPanel(
        loginPanel
      );

    }
  );

  // ==================================================
  // Modal outside click
  // ==================================================

  createModal?.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        createModal
      ) {

        closeCreateModal();

      }

    }
  );

  joinModal?.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        joinModal
      ) {

        closeJoinModal();

      }

    }
  );

  settingsModal?.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        settingsModal
      ) {

        closeSettings();

      }

    }
  );

  // ==================================================
  // ESCでモーダルを閉じる
  // ==================================================

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key !==
        "Escape"
      ) {

        return;

      }

      closeCreateModal();

      closeJoinModal();

      closeSettings();

    }
  );

  // ==================================================
  // 初期化
  // ==================================================

  async function init() {

    console.log(
      "Veylo App initializing..."
    );

    loadSettings();

    const loggedIn =
      await loadCurrentUser();

    if (!loggedIn) {

      return;

    }

    connectSocket();

  }

  init();

});

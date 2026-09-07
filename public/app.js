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

  const userAvatarImage =
    document.getElementById("userAvatarImage");

  const userAvatarWrapper =
    document.querySelector(".user-avatar");

  // ==================================================
  // Profile Modal
  // ==================================================

  const profileModal =
    document.getElementById("profileModal");

  const closeProfileButton =
    document.getElementById("closeProfileButton");

  const profileAvatar =
    document.getElementById("profileAvatar");

  const profileAvatarImage =
    document.getElementById("profileAvatarImage");

  const profileAvatarFallback =
    document.getElementById("profileAvatarFallback");

  const profileAvatarInput =
    document.getElementById("profileAvatarInput");

  const profileAvatarButton =
    document.getElementById("profileAvatarButton");

  const removeAvatarButton =
    document.getElementById("removeAvatarButton");

  const profileNameInput =
    document.getElementById("profileNameInput");

  const profileBioInput =
    document.getElementById("profileBioInput");

  const profileMessage =
    document.getElementById("profileMessage");

  const saveProfileButton =
    document.getElementById("saveProfileButton");

  let pendingAvatarDataUrl = undefined;

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

  const userSearchButton =
    document.getElementById("userSearchButton");

  const dmList =
    document.getElementById("dmList");

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
  // User Search / DM modal
  // ==================================================

  const userSearchModal =
    document.getElementById("userSearchModal");

  const closeUserSearchButton =
    document.getElementById("closeUserSearchButton");

  const userSearchInput =
    document.getElementById("userSearchInput");

  const userSearchMessage =
    document.getElementById("userSearchMessage");

  const userSearchResults =
    document.getElementById("userSearchResults");

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
      "[data-close-settings]"
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

  const themeSelect =
    document.getElementById("themeSelect");

  const languageSelect =
    document.getElementById(
      "languageSelect"
    );

  const notificationSoundToggleButton =
    document.getElementById("notificationSoundToggleButton");

  const desktopNotificationToggleButton =
    document.getElementById("desktopNotificationToggleButton");

  const currentPasswordInput =
    document.getElementById("currentPasswordInput");

  const newPasswordInput =
    document.getElementById("newPasswordInput");

  const passwordChangeMessage =
    document.getElementById("passwordChangeMessage");

  const changePasswordButton =
    document.getElementById("changePasswordButton");

  const deleteAccountPasswordInput =
    document.getElementById("deleteAccountPasswordInput");

  const deleteAccountMessage =
    document.getElementById("deleteAccountMessage");

  const deleteAccountButton =
    document.getElementById("deleteAccountButton");

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

  let currentChatType = "room";

  let dmListData = [];

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

  // ==================================================
  // アイコン画像 / 頭文字フォールバック 共通ヘルパー
  // ==================================================

  function avatarInnerHtml(avatarUrl, name) {

    const letter =
      String(name || "U")
        .trim()
        .charAt(0)
        .toUpperCase() || "U";

    if (avatarUrl) {

      return `<img src="${escapeHtml(avatarUrl)}" alt="" class="avatar-image">`;

    }

    return `<span class="avatar-fallback">${escapeHtml(letter)}</span>`;

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

      usernameInput.textContent =
        currentUser.name;

    }

    if (settingsUsernameInput) {

      settingsUsernameInput.value =
        currentUser.name;

    }

    if (userAvatarImage) {

      if (currentUser.avatar) {

        userAvatarImage.src =
          currentUser.avatar;

        userAvatarImage.classList.remove(
          "hidden"
        );

      } else {

        userAvatarImage.src = "";

        userAvatarImage.classList.add(
          "hidden"
        );

      }

    }

    if (userAvatarWrapper) {

      const fallback =
        userAvatarWrapper.querySelector(
          "span:not(.user-avatar-image)"
        );

      if (fallback) {

        fallback.textContent =
          (currentUser.name || "U")
            .trim()
            .charAt(0)
            .toUpperCase() || "U";

      }

    }

  }

  // ==================================================
  // Socket
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
    // Connect
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

        socket.emit(
          "get my rooms"
        );

        socket.emit("get my dms");

      }
    );

    // ==================================================
    // Disconnect
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
    // Connection Error
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
    // My Rooms
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
    // Room Created
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

        currentChatType = "room";

        currentRoom =
          room;

        currentRoomId =
          room.id;

        addOrUpdateMyRoom(
          room
        );

        updateCurrentRoomUI();

        closeCreateModal();

      }
    );

    // ==================================================
    // Room Joined
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

        currentChatType = "room";

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
    // Room Opened
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

        currentChatType = "room";

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
    // Casual
    // ==================================================

    socket.on(
      "casual joined",
      () => {

        currentChatType = "room";

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
    // My DMs
    // ==================================================

    socket.on("my dms", (list) => {
      dmListData = Array.isArray(list) ? list : [];
      renderDMList();
    });

    socket.on("dm opened", (dm) => {
      if (!dm) return;

      currentChatType = "dm";
      currentRoomId = dm.id;
      currentRoom = {
        id: dm.id,
        name: dm.otherUserName || "DM",
        inviteCode: null,
        ownerId: null,
        otherUserId: dm.otherUserId
      };

      updateCurrentRoomUI();
      clearMessages();
      clearReply();
    });

    socket.on("dm previous messages", (list) => {
      renderMessages(Array.isArray(list) ? list : []);
    });

    socket.on("dm message", (message) => {
      if (!message || String(message.room) !== String(currentRoomId) || currentChatType !== "dm") return;
      notifyIncomingMessage(message);
      const shouldScroll = isNearBottom();
      appendMessage(message);
      if (shouldScroll) scrollToBottom(true);
    });

    socket.on("dm error", (data) => {
      alert(data?.message || "DMを開けませんでした。");
    });

    socket.on("dm message error", (data) => {
      alert(data?.message || "DMを送信できませんでした。");
    });

    // ==================================================
    // Previous Messages
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
    // New Message
    // ==================================================

    socket.on(
      "chat message",
      (message) => {

        if (!message) {
          return;
        }

        if (
          String(message.room) !==
          String(currentRoomId)
        ) {

          return;

        }

        const shouldScroll =
          isNearBottom();

        notifyIncomingMessage(
          message
        );

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
    // Message Edited
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
    // Message Deleted
    // ==================================================

    socket.on(
      "message deleted",
      (data) => {

        if (!data) {
          return;
        }

        const element =
          document.querySelector(
            `[data-message-id="${CSS.escape(
              String(data.id)
            )}"]`
          );

        if (element) {

          element.classList.add(
            "message-removing"
          );

          setTimeout(
            () => {

              element.remove();

            },
            180
          );

        }

      }
    );

    // ==================================================
    // Room Deleted
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

        myRooms =
          myRooms.filter(
            room =>
              String(room.id) !==
              roomId
          );

        renderJoinedRooms();

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
    // Errors
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
  // Rooms
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

      myRooms[index] = {
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

      const main =
        document.createElement(
          "button"
        );

      main.type =
        "button";

      main.className =
        "joined-room-main";

      main.innerHTML = `
        <span class="joined-room-icon">
          🏠
        </span>

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
  // Open Room
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
        "Room not found:",
        roomId
      );

      socket.emit(
        "get my rooms"
      );

      return;

    }

    currentChatType = "room";

    currentRoomId =
      room.id;

    currentRoom =
      room;

    updateCurrentRoomUI();

    clearMessages();

    socket.emit(
      "open my room",
      {
        roomId:
          room.id
      }
    );

  }

  // ==================================================
  // Delete Room
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
  // Current Room UI
  // ==================================================

  function updateCurrentRoomUI() {

    if (currentChatType === "dm") {
      if (roomName) roomName.textContent = currentRoom?.name || "DM";
      if (roomIcon) roomIcon.textContent = "✉️";
      if (inviteArea) inviteArea.classList.add("hidden");
      casualRoomButton?.classList.remove("active");
      renderJoinedRooms();
      renderDMList();
      return;
    }

    const isCasual = String(currentRoomId) === "casual";

    if (isCasual) {
      if (roomName) roomName.textContent = "雑談";
      if (roomIcon) roomIcon.textContent = "💬";
      if (inviteArea) inviteArea.classList.add("hidden");
      casualRoomButton?.classList.add("active");
    } else {
      if (roomName) roomName.textContent = currentRoom?.name || "ルーム";
      if (roomIcon) roomIcon.textContent = "🏠";
      if (inviteArea && currentRoom?.inviteCode) inviteArea.classList.remove("hidden");
      if (inviteCode) inviteCode.textContent = currentRoom?.inviteCode || "------";
      casualRoomButton?.classList.remove("active");
    }

    renderJoinedRooms();
    renderDMList();
  }


  // ==================================================
  // Casual
  // ==================================================

  function joinCasualRoom() {

    if (
      !socket ||
      !socket.connected
    ) {

      return;

    }

    currentChatType = "room";

    currentRoomId =
      "casual";

    currentRoom = {
      id: "casual",
      name: "雑談",
      inviteCode: null,
      ownerId: null
    };

    updateCurrentRoomUI();

    clearMessages();

    socket.emit(
      "join casual"
    );

  }

  casualRoomButton?.addEventListener(
    "click",
    joinCasualRoom
  );

  // ==================================================
  // DM / User Search
  // ==================================================

  function openUserSearchModal() {
    userSearchModal?.classList.remove("hidden");
    if (userSearchMessage) userSearchMessage.textContent = "";
    if (userSearchResults) userSearchResults.innerHTML = "";
    if (userSearchInput) {
      userSearchInput.value = "";
      setTimeout(() => userSearchInput.focus(), 50);
    }
  }

  function closeUserSearchModal() {
    userSearchModal?.classList.add("hidden");
  }

  async function searchUsers() {
    const q = String(userSearchInput?.value || "").trim();
    if (!q) {
      if (userSearchMessage) userSearchMessage.textContent = "ユーザー名を入力してください。";
      if (userSearchResults) userSearchResults.innerHTML = "";
      return;
    }

    try {
      if (userSearchMessage) userSearchMessage.textContent = "検索中…";
      const data = await api(`/api/users/search?q=${encodeURIComponent(q)}`);
      renderUserSearchResults(Array.isArray(data?.users) ? data.users : []);
    } catch (error) {
      if (userSearchMessage) userSearchMessage.textContent = error.message || "検索できませんでした。";
    }
  }

  function renderUserSearchResults(users) {
    if (!userSearchResults) return;
    userSearchResults.innerHTML = "";
    if (users.length === 0) {
      if (userSearchMessage) userSearchMessage.textContent = "ユーザーが見つかりませんでした。";
      return;
    }
    if (userSearchMessage) userSearchMessage.textContent = `${users.length}件見つかりました。`;
    for (const item of users) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "user-search-result";
      button.innerHTML = `<span class="user-search-avatar">${avatarInnerHtml(item.avatar, item.name)}</span><span class="user-search-name-wrap"><span class="user-search-name">${escapeHtml(item.name)}</span>${item.bio ? `<span class="user-search-bio">${escapeHtml(item.bio)}</span>` : ""}</span><span class="user-search-arrow">›</span>`;
      button.addEventListener("click", () => startDM(item.id));
      userSearchResults.appendChild(button);
    }
  }

  function startDM(userId) {
    if (!socket || !socket.connected) {
      alert("サーバーに接続されていません。");
      return;
    }
    socket.emit("start dm", { userId });
    closeUserSearchModal();
  }

  function openDM(conversationId) {
    if (!socket || !socket.connected) return;
    socket.emit("open dm", { conversationId });
  }

  function renderDMList() {
    if (!dmList) return;
    dmList.innerHTML = "";
    if (dmListData.length === 0) {
      const empty = document.createElement("div");
      empty.className = "dm-empty";
      empty.textContent = "まだDMはありません";
      dmList.appendChild(empty);
      return;
    }
    for (const dm of dmListData) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "dm-button";
      if (String(currentRoomId) === String(dm.id) && currentChatType === "dm") button.classList.add("active");
      const initial = (dm.otherUserName || "U").charAt(0).toUpperCase();
      button.innerHTML = `<span class="dm-avatar">${avatarInnerHtml(dm.otherUserAvatar, dm.otherUserName)}</span><span class="dm-info"><span class="dm-name">${escapeHtml(dm.otherUserName || "ユーザー")}</span><span class="dm-last-message">${escapeHtml(dm.lastMessage || "新しいDM")}</span></span>`;
      button.addEventListener("click", () => openDM(dm.id));
      dmList.appendChild(button);
    }
  }

  userSearchButton?.addEventListener("click", openUserSearchModal);
  closeUserSearchButton?.addEventListener("click", closeUserSearchModal);
  userSearchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") { event.preventDefault(); searchUsers(); }
  });
  userSearchModal?.addEventListener("click", (event) => {
    if (event.target === userSearchModal) closeUserSearchModal();
  });

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
  // Invite Code
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
        String(message.room) !==
        String(currentRoomId)
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

  // ==================================================
  // Append Message
  // ==================================================

  function appendMessage(
    message,
    scroll = true
  ) {

    if (!messages || !message) {
      return;
    }

    if (
      String(message.room) !==
      String(currentRoomId)
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

    // ----------------------------------------------
    // 自分 / 他人
    // ----------------------------------------------

    const isOwn =
      currentUser &&
      Number(message.userId) ===
      Number(currentUser.id);

    if (isOwn) {

      wrapper.classList.add(
        "own"
      );

    } else {

      wrapper.classList.add(
        "other"
      );

    }

    // ----------------------------------------------
    // Avatar
    // ----------------------------------------------

    const username =
      message.username ||
      "Unknown";

    const avatarLetter =
      username
        .trim()
        .charAt(0)
        .toUpperCase() ||
      "U";

    // ----------------------------------------------
    // Reply Card
    // ----------------------------------------------

    const hasReply =
      message.replyToId !== null &&
      message.replyToId !== undefined &&
      String(message.replyToId) !== "";

    const replyHtml =
      hasReply
        ? `
          <button
            type="button"
            class="message-reply-card"
            data-action="reply-jump"
            title="返信元のコメントを見る"
          >

            <span class="reply-card-bar"></span>

            <span class="reply-card-inner">

              <span class="reply-card-label">
                ↩ 返信
              </span>

              <span class="reply-card-user">
                ${escapeHtml(
                  message.replyToUsername ||
                  "ユーザー"
                )}
              </span>

              <span class="reply-card-text">
                ${escapeHtml(
                  message.replyToText ||
                  "元のメッセージ"
                )}
              </span>

            </span>

            <span class="reply-card-arrow">
              ›
            </span>

          </button>
        `
        : "";

    // ----------------------------------------------
    // Header
    // ----------------------------------------------

    const headerHtml =
      !isOwn
        ? `
          <div class="message-header">

            <span class="message-username">
              ${escapeHtml(
                username
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
        `
        : "";

    // ----------------------------------------------
    // Own Meta
    // ----------------------------------------------

    const ownMetaHtml =
      isOwn
        ? `
          <div class="message-meta">

            ${
              message.edited
                ? `
                  <span class="message-edited">
                    編集済み
                  </span>
                `
                : ""
            }

            <span class="message-time">
              ${formatTime(
                message.createdAt
              )}
            </span>

          </div>
        `
        : "";

    // ----------------------------------------------
    // Actions
    // ----------------------------------------------

    const actionsHtml = message.isDm
      ? ""
      : `
        <div class="message-actions">
          <button type="button" class="message-reply-button" data-action="reply" title="このコメントに返信">↩ 返信</button>
          ${
            isOwn
              ? `
                <button type="button" class="message-edit-button" data-action="edit">編集</button>
                <button type="button" class="message-delete-button" data-action="delete">削除</button>
              `
              : ""
          }
        </div>
      `;

    // ----------------------------------------------
    // HTML
    // ----------------------------------------------

    wrapper.innerHTML = `

      <div class="message-avatar">
        ${avatarInnerHtml(
          message.avatar,
          username
        )}
      </div>

      <div class="message-body">

        ${headerHtml}

        <div class="message-bubble">

          ${replyHtml}

          <div class="message-text">
            ${escapeHtml(
              message.text
            )}
          </div>

          ${ownMetaHtml}

        </div>

        ${actionsHtml}

      </div>
    `;

    // ----------------------------------------------
    // Reply
    // ----------------------------------------------

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

    // ----------------------------------------------
    // Reply Jump
    // ----------------------------------------------

    wrapper
      .querySelector(
        '[data-action="reply-jump"]'
      )
      ?.addEventListener(
        "click",
        (event) => {

          event.preventDefault();

          event.stopPropagation();

          jumpToMessage(
            message.replyToId
          );

        }
      );

    // ----------------------------------------------
    // Edit
    // ----------------------------------------------

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

    // ----------------------------------------------
    // Delete
    // ----------------------------------------------

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

    // ----------------------------------------------
    // Append
    // ----------------------------------------------

    messages.appendChild(
      wrapper
    );

    // ----------------------------------------------
    // Animation
    // ----------------------------------------------

    requestAnimationFrame(
      () => {

        wrapper.classList.add(
          "message-visible"
        );

      }
    );

    // ----------------------------------------------
    // Scroll
    // ----------------------------------------------

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

  // ==================================================
  // Jump to Reply Target
  // ==================================================

  function jumpToMessage(
    messageId
  ) {

    if (
      !messages ||
      messageId === null ||
      messageId === undefined
    ) {

      return;

    }

    const target =
      messages.querySelector(
        `[data-message-id="${CSS.escape(
          String(messageId)
        )}"]`
      );

    if (!target) {

      return;

    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

    target.classList.remove(
      "message-highlight"
    );

    // CSS animation再発火
    void target.offsetWidth;

    target.classList.add(
      "message-highlight"
    );

    setTimeout(
      () => {

        target.classList.remove(
          "message-highlight"
        );

      },
      1000
    );

  }

  // ==================================================
  // Update Message
  // ==================================================

  function updateMessageElement(
    message
  ) {

    if (!messages || !message) {
      return;
    }

    const element =
      messages.querySelector(
        `[data-message-id="${CSS.escape(
          String(message.id)
        )}"]`
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
          ".message-header, .message-meta"
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

    if (!message) {
      return;
    }

    replyToMessage =
      message;

    if (!replyPreview) {
      return;
    }

    replyPreview.classList.remove(
      "hidden"
    );

    replyPreview.innerHTML = `

      <span class="reply-preview-line"></span>

      <div class="reply-preview-content">

        <div class="reply-preview-label">
          ↩ 返信
        </div>

        <div class="reply-preview-title">
          ${escapeHtml(
            message.username ||
            "ユーザー"
          )}
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
        title="返信をキャンセル"
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
  // Send Message
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

      if (currentChatType === "dm") {
        socket.emit("dm message", {
          conversationId: currentRoomId,
          text
        });
      } else {
        socket.emit(
          "chat message",
          {
            room: currentRoomId,
            text,
            replyToId: replyToMessage ? replyToMessage.id : null
          }
        );
      }

      messageInput.value =
        "";

      clearReply();

    }
  );

  // ==================================================
  // Edit Message
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
  // Delete Message
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

  // ==================================================
  // Profile Modal（アイコン・自己紹介）
  // ==================================================

  function openProfileModal() {

    if (!profileModal || !currentUser) {
      return;
    }

    pendingAvatarDataUrl = undefined;

    if (profileNameInput) {
      profileNameInput.value = currentUser.name || "";
    }

    if (profileBioInput) {
      profileBioInput.value = currentUser.bio || "";
    }

    if (profileMessage) {
      profileMessage.textContent = "";
    }

    setProfilePreview(currentUser.avatar || null, currentUser.name);
    const count = document.getElementById("profileBioCount");
    if (count) count.textContent = `${String(currentUser.bio || "").length}/300`;

    profileModal.classList.remove("hidden");

  }

  function closeProfileModal() {
    profileModal?.classList.add("hidden");
  }

  function setProfilePreview(avatarUrl, name) {

    const letter =
      (name || "U")
        .trim()
        .charAt(0)
        .toUpperCase() || "U";

    if (profileAvatarFallback) {
      profileAvatarFallback.textContent = letter;
    }

    if (profileAvatarImage) {

      if (avatarUrl) {

        profileAvatarImage.src = avatarUrl;
        profileAvatarImage.classList.remove("hidden");

        if (profileAvatarFallback) {
          profileAvatarFallback.classList.add("hidden");
        }

        removeAvatarButton?.classList.remove("hidden");

      } else {

        profileAvatarImage.src = "";
        profileAvatarImage.classList.add("hidden");

        if (profileAvatarFallback) {
          profileAvatarFallback.classList.remove("hidden");
        }

        removeAvatarButton?.classList.add("hidden");

      }

    }

  }

  function resizeImageFile(file) {

    return new Promise((resolve, reject) => {

      const reader = new FileReader();

      reader.onerror = () => reject(new Error("画像を読み込めませんでした。"));

      reader.onload = () => {

        const img = new Image();

        img.onerror = () => reject(new Error("画像を読み込めませんでした。"));

        img.onload = () => {

          const maxSize = 256;
          let { width, height } = img;

          if (width > height) {

            if (width > maxSize) {
              height = Math.round(height * (maxSize / width));
              width = maxSize;
            }

          } else {

            if (height > maxSize) {
              width = Math.round(width * (maxSize / height));
              height = maxSize;
            }

          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL("image/jpeg", 0.85));

        };

        img.src = reader.result;

      };

      reader.readAsDataURL(file);

    });

  }

  profileAvatarButton?.addEventListener("click", () => {
    profileAvatarInput?.click();
  });

  profileAvatarInput?.addEventListener("change", async () => {

    const file = profileAvatarInput.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      if (profileMessage) profileMessage.textContent = "画像ファイルを選んでください。";
      return;
    }

    try {

      const dataUrl = await resizeImageFile(file);
      pendingAvatarDataUrl = dataUrl;
      setProfilePreview(dataUrl, profileNameInput?.value || currentUser?.name);

      if (profileMessage) profileMessage.textContent = "";

    } catch (error) {

      if (profileMessage) profileMessage.textContent = error.message || "画像を処理できませんでした。";

    } finally {

      profileAvatarInput.value = "";

    }

  });

  removeAvatarButton?.addEventListener("click", () => {

    pendingAvatarDataUrl = null;
    setProfilePreview(null, profileNameInput?.value || currentUser?.name);

  });

  profileBioInput?.addEventListener("input", () => {
    const count = document.getElementById("profileBioCount");
    if (count) count.textContent = `${String(profileBioInput.value || "").length}/300`;
  });

  saveProfileButton?.addEventListener("click", async () => {

    if (saveProfileButton.disabled) return;
    const name = String(profileNameInput?.value || "").trim();
    const bio = String(profileBioInput?.value || "");

    if (!name) {
      if (profileMessage) profileMessage.textContent = "名前を入力してください。";
      return;
    }

    const payload = { name, bio };

    if (pendingAvatarDataUrl !== undefined) {
      payload.avatar = pendingAvatarDataUrl;
    }

    try {

      if (profileMessage) profileMessage.textContent = "保存しています…";
      saveProfileButton.disabled = true;

      const data = await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      if (data?.user) {
        currentUser = data.user;
        updateUserUI();
      }

      pendingAvatarDataUrl = undefined;

      if (profileMessage) profileMessage.textContent = "保存しました。";

      setTimeout(closeProfileModal, 400);

    } catch (error) {

      if (profileMessage) profileMessage.textContent = error.message || "保存できませんでした。";

    } finally {
      saveProfileButton.disabled = false;
    }

  });

  usernameInput?.addEventListener("click", openProfileModal);

  usernameInput?.addEventListener("keydown", (event) => {

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProfileModal();
    }

  });

  userAvatarWrapper?.addEventListener("click", openProfileModal);

  closeProfileButton?.addEventListener("click", closeProfileModal);

  profileModal?.addEventListener("click", (event) => {

    if (event.target === profileModal) {
      closeProfileModal();
    }

  });

  function getThemeMode() {

    const saved = localStorage.getItem("veylo-theme");

    if (saved === "light" || saved === "gray" || saved === "dark") {
      return saved;
    }

    // 旧バージョンの保存形式も自動移行
    if (localStorage.getItem("veylo-dark-mode") === "true") return "dark";
    if (localStorage.getItem("veylo-gray-mode") === "true") return "gray";

    return "light";
  }

  function applyThemeMode(mode) {

    const safeMode =
      mode === "dark" || mode === "gray" || mode === "light"
        ? mode
        : "light";

    document.body.classList.remove("dark-mode", "gray-mode");

    if (safeMode === "dark") {
      document.body.classList.add("dark-mode");
    } else if (safeMode === "gray") {
      document.body.classList.add("gray-mode");
    }

    localStorage.setItem("veylo-theme", safeMode);
    // 旧キーも同期して、既存コードや古い端末状態との互換性を維持
    localStorage.setItem("veylo-dark-mode", String(safeMode === "dark"));
    localStorage.setItem("veylo-gray-mode", String(safeMode === "gray"));

    if (themeSelect) themeSelect.value = safeMode;
  }

  function loadSettings() {

    const theme = getThemeMode();
    applyThemeMode(theme);

    const language =
      localStorage.getItem("veylo-language") || "ja";

    if (languageSelect) {
      languageSelect.value = language;
    }

    const soundEnabled =
      localStorage.getItem("veylo-notification-sound") === "true";

    if (notificationSoundToggleButton) {
      notificationSoundToggleButton.textContent = soundEnabled ? "ON" : "OFF";
      notificationSoundToggleButton.classList.toggle("active", soundEnabled);
    }

    const desktopEnabled =
      localStorage.getItem("veylo-desktop-notifications") === "true";

    if (desktopNotificationToggleButton) {
      desktopNotificationToggleButton.textContent = desktopEnabled ? "ON" : "OFF";
      desktopNotificationToggleButton.classList.toggle("active", desktopEnabled);
    }

  }

  themeSelect?.addEventListener("change", () => {
    applyThemeMode(themeSelect.value);
  });

  // ==================================================
  // 通知音 / デスクトップ通知
  // ==================================================

  function playNotificationSound() {

    try {

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 880;

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.35);

      oscillator.onended = () => ctx.close();

    } catch (error) {

      console.error("notification sound error:", error);

    }

  }

  function showDesktopNotification(title, body) {

    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    try {

      const notification = new Notification(title, {
        body: body || "",
        icon: "/favicon.ico"
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

    } catch (error) {

      console.error("desktop notification error:", error);

    }

  }

  function notifyIncomingMessage(message) {

    if (!message || !currentUser) return;
    if (Number(message.userId) === Number(currentUser.id)) return;

    const isBackground =
      document.hidden || !document.hasFocus();

    if (!isBackground) return;

    if (localStorage.getItem("veylo-notification-sound") === "true") {
      playNotificationSound();
    }

    if (localStorage.getItem("veylo-desktop-notifications") === "true") {
      showDesktopNotification(
        message.username || "Veylo",
        message.text || "新しいメッセージ"
      );
    }

  }

  notificationSoundToggleButton?.addEventListener("click", () => {

    const enabled =
      !(localStorage.getItem("veylo-notification-sound") === "true");

    localStorage.setItem("veylo-notification-sound", String(enabled));

    notificationSoundToggleButton.textContent = enabled ? "ON" : "OFF";

    if (enabled) {
      playNotificationSound();
    }

  });

  desktopNotificationToggleButton?.addEventListener("click", async () => {

    const enabling =
      !(localStorage.getItem("veylo-desktop-notifications") === "true");

    if (enabling) {

      if (!("Notification" in window)) {
        alert("お使いのブラウザはデスクトップ通知に対応していません。");
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        alert("通知が許可されませんでした。ブラウザの設定をご確認ください。");
        return;
      }

    }

    localStorage.setItem("veylo-desktop-notifications", String(enabling));

    desktopNotificationToggleButton.textContent = enabling ? "ON" : "OFF";

  });

  // ==================================================
  // パスワード変更
  // ==================================================

  changePasswordButton?.addEventListener("click", async () => {

    const currentPassword = String(currentPasswordInput?.value || "");
    const newPassword = String(newPasswordInput?.value || "");

    if (!currentPassword || !newPassword) {
      if (passwordChangeMessage) passwordChangeMessage.textContent = "すべての項目を入力してください。";
      return;
    }

    if (newPassword.length < 8) {
      if (passwordChangeMessage) passwordChangeMessage.textContent = "新しいパスワードは8文字以上で入力してください。";
      return;
    }

    try {

      if (passwordChangeMessage) passwordChangeMessage.textContent = "変更しています…";

      await api("/api/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (passwordChangeMessage) passwordChangeMessage.textContent = "パスワードを変更しました。";

      if (currentPasswordInput) currentPasswordInput.value = "";
      if (newPasswordInput) newPasswordInput.value = "";

    } catch (error) {

      if (passwordChangeMessage) passwordChangeMessage.textContent = error.message || "変更できませんでした。";

    }

  });

  // ==================================================
  // アカウント削除
  // ==================================================

  deleteAccountButton?.addEventListener("click", async () => {

    if (deleteAccountPasswordInput?.classList.contains("hidden")) {

      deleteAccountPasswordInput.classList.remove("hidden");
      deleteAccountPasswordInput.focus();

      if (deleteAccountMessage) {
        deleteAccountMessage.textContent = "確認のためパスワードを入力し、もう一度クリックしてください。";
      }

      return;

    }

    const password = String(deleteAccountPasswordInput?.value || "");

    if (!password) {
      if (deleteAccountMessage) deleteAccountMessage.textContent = "パスワードを入力してください。";
      return;
    }

    const confirmed = window.confirm(
      "本当にアカウントを削除しますか？この操作は取り消せません。"
    );

    if (!confirmed) return;

    try {

      if (deleteAccountMessage) deleteAccountMessage.textContent = "削除しています…";

      await api("/api/account", {
        method: "DELETE",
        body: JSON.stringify({ password })
      });

      if (socket) socket.disconnect();

      window.location.reload();

    } catch (error) {

      if (deleteAccountMessage) deleteAccountMessage.textContent = error.message || "削除できませんでした。";

    }

  });

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

        dmListData = [];
        renderDMList();

        currentChatType = "room";

        currentRoomId =
          "casual";

        currentRoom = {
          id: "casual",
          name: "雑談",
          inviteCode: null,
          ownerId: null
        };

        clearReply();

        clearMessages();

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
  // Auth Navigation
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
  // Modal Outside Click
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
  // ESC
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

      clearReply();

    }
  );

  // ==================================================
  // Initialize
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

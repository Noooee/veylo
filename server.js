const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});


// ==================================================
// Express
// ==================================================

const app = express();


// ==================================================
// HTTP Server
// ==================================================

const server = http.createServer(app);


// ==================================================
// Socket.IO
// ==================================================

const io = new Server(server);


// ==================================================
// 静的ファイル
// ==================================================

app.use(express.static("public"));


// ==================================================
// ヘルスチェック
// ==================================================

app.get("/health", (req, res) => {
  res.status(200).send("Veylo is running!");
});


// ==================================================
// PostgreSQL 初期設定
// ==================================================

async function initDatabase() {

  // 部屋テーブル

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      owner TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log(
    "PostgreSQL: roomsテーブル準備完了"
  );


  // メッセージテーブル

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      room TEXT NOT NULL,
      text TEXT NOT NULL,
      username TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log(
    "PostgreSQL: messagesテーブル準備完了"
  );

}


// ==================================================
// 24時間以上経ったメッセージを削除
// ==================================================

async function deleteOldMessages() {

  try {

    const result = await pool.query(`
      DELETE FROM messages
      WHERE created_at < NOW() - INTERVAL '24 hours'
    `);

    if (result.rowCount > 0) {

      console.log(
        `24時間経過したメッセージを${result.rowCount}件削除しました`
      );

    }

  } catch (error) {

    console.error(
      "古いメッセージの削除に失敗:",
      error
    );

  }

}


// ==================================================
// ユーザー接続
// ==================================================

io.on("connection", (socket) => {

  console.log(
    "ユーザーが接続しました:",
    socket.id
  );


  // 雑談ルーム

  socket.join("casual");


  // ==================================================
  // 過去24時間のメッセージを取得
  // ==================================================

  socket.on("load messages", async (roomId) => {

    if (!roomId) {
      return;
    }

    try {

      const result = await pool.query(
        `
        SELECT
          id,
          room,
          text,
          username,
          user_id,
          created_at
        FROM messages
        WHERE room = $1
          AND created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY created_at ASC
        `,
        [roomId]
      );


      socket.emit(
        "message history",
        result.rows
      );


    } catch (error) {

      console.error(
        "メッセージ取得エラー:",
        error
      );

    }

  });


  // ==================================================
  // チャットメッセージ
  // ==================================================

  socket.on("chat message", async (msg) => {

    if (!msg) {
      return;
    }

    if (!msg.room) {
      return;
    }

    if (!msg.text) {
      return;
    }


    const message = {

      room: msg.room,

      text: msg.text,

      username:
        msg.username || "ゲスト",

      userId:
        msg.userId || socket.id

    };


    // PostgreSQLに保存

    try {

      const result = await pool.query(
        `
        INSERT INTO messages
          (room, text, username, user_id)
        VALUES
          ($1, $2, $3, $4)
        RETURNING
          id,
          room,
          text,
          username,
          user_id,
          created_at
        `,
        [
          message.room,
          message.text,
          message.username,
          message.userId
        ]
      );


      const savedMessage =
        result.rows[0];


      console.log(
        "PostgreSQLにメッセージを保存しました:",
        savedMessage.text
      );


      // その部屋にいる全員へ送信

      io.to(message.room).emit(
        "chat message",
        {
          room:
            savedMessage.room,

          text:
            savedMessage.text,

          username:
            savedMessage.username,

          userId:
            savedMessage.user_id,

          createdAt:
            savedMessage.created_at
        }
      );


    } catch (error) {

      console.error(
        "メッセージ保存エラー:",
        error
      );

    }

  });


  // ==================================================
  // 部屋作成
  // ==================================================

  socket.on("create room", async (data) => {

    if (!data || !data.name) {
      return;
    }


    const roomName =
      String(data.name).trim();


    if (!roomName) {
      return;
    }


    // 部屋ID

    const roomId =
      "room-" +
      Date.now() +
      "-" +
      Math.floor(
        Math.random() * 100000
      );


    // 招待コード

    const inviteCode =
      Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();


    // 部屋情報

    const room = {

      id: roomId,

      name: roomName,

      inviteCode:
        inviteCode,

      owner:
        socket.id

    };


    // PostgreSQLに保存

    try {

      await pool.query(
        `
        INSERT INTO rooms
          (id, name, invite_code, owner)
        VALUES
          ($1, $2, $3, $4)
        `,
        [
          room.id,
          room.name,
          room.inviteCode,
          room.owner
        ]
      );


      console.log(
        "PostgreSQLに部屋を保存しました:",
        room.name
      );


    } catch (error) {

      console.error(
        "部屋の保存に失敗しました:",
        error
      );

      return;

    }


    // 作成者も参加

    socket.join(roomId);


    console.log(
      "部屋が作成されました:",
      room
    );


    // 作成者へ通知

    socket.emit(
      "room created",
      room
    );

  });


  // ==================================================
  // 招待コードで部屋に参加
  // ==================================================

  socket.on("join room", async (data) => {

    const code =
      String(
        data?.code || ""
      )
      .trim()
      .toUpperCase();


    if (!code) {

      socket.emit(
        "join room error",
        {
          message:
            "招待コードを入力してください。"
        }
      );

      return;

    }


    try {

      const result =
        await pool.query(
          `
          SELECT
            id,
            name,
            invite_code,
            owner
          FROM rooms
          WHERE invite_code = $1
          `,
          [code]
        );


      if (result.rows.length === 0) {

        socket.emit(
          "join room error",
          {
            message:
              "招待コードが正しくありません。"
          }
        );

        return;

      }


      const dbRoom =
        result.rows[0];


      const room = {

        id:
          dbRoom.id,

        name:
          dbRoom.name,

        inviteCode:
          dbRoom.invite_code,

        owner:
          dbRoom.owner

      };


      // Socket.IOの部屋へ参加

      socket.join(room.id);


      console.log(
        "部屋に参加しました:",
        socket.id,
        room.name
      );


      // 参加した本人へ通知

      socket.emit(
        "room joined",
        room
      );


    } catch (error) {

      console.error(
        "部屋参加エラー:",
        error
      );


      socket.emit(
        "join room error",
        {
          message:
            "部屋への参加に失敗しました。"
        }
      );

    }

  });


  // ==================================================
  // 切断
  // ==================================================

  socket.on("disconnect", () => {

    console.log(
      "ユーザーが退出しました:",
      socket.id
    );

  });

});


// ==================================================
// サーバー起動
// ==================================================

const PORT =
  Number(process.env.PORT) || 3000;


async function startServer() {

  try {

    await initDatabase();


    // 起動時に一度削除

    await deleteOldMessages();


    // 1時間ごとに削除

    setInterval(
      deleteOldMessages,
      60 * 60 * 1000
    );


    server.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log(
          `Veyloサーバー起動: 0.0.0.0:${PORT}`
        );

        console.log(
          `環境: ${
            process.env.NODE_ENV ||
            "development"
          }`
        );

      }
    );


  } catch (error) {

    console.error(
      "PostgreSQLへの接続に失敗しました:",
      error
    );

    process.exit(1);

  }

}


startServer();

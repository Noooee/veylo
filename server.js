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
// publicフォルダを公開
// ==================================================

app.use(express.static("public"));


// ==================================================
// ヘルスチェック
// ==================================================

app.get("/health", (req, res) => {
  res.status(200).send("Veylo is running!");
});


// ==================================================
// 作成された部屋
// ==================================================

const rooms = {};
async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      owner TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("PostgreSQL: roomsテーブル準備完了");
}


// ==================================================
// ユーザー接続
// ==================================================

io.on("connection", (socket) => {

  console.log(
    "ユーザーが接続しました:",
    socket.id
  );
  
  // 雑談ルームに自動参加
  socket.join("casual");

  // ==================================================
  // チャットメッセージ
  // ==================================================

  socket.on("chat message", (msg) => {

    if (!msg) {
      return;
    }

    if (!msg.room) {
      return;
    }

    if (!msg.text) {
      return;
    }


    // その部屋にいるユーザーへ送信

    io.to(msg.room).emit(
      "chat message",
      {
        room: msg.room,
        text: msg.text,
        username: msg.username || "ゲスト"
      }
    );

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

      inviteCode: inviteCode,

      owner: socket.id

    };


    // 保存

    rooms[roomId] = room;
    // PostgreSQLにも保存

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

}


    // 作成者自身も参加

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


    // コードが空

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


    // 招待コードから部屋を探す

    const result = await pool.query(
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

const dbRoom = result.rows[0];

const room = {
  id: dbRoom.id,
  name: dbRoom.name,
  inviteCode: dbRoom.invite_code,
  owner: dbRoom.owner
};


    // 部屋が存在しない

    if (!room) {

      socket.emit(
        "join room error",
        {
          message:
            "招待コードが正しくありません。"
        }
      );

      return;
    }


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

// RenderではPORTが自動的に設定される
// ローカルでは3000を使用

const PORT =
  Number(process.env.PORT) || 3000;


// 0.0.0.0で待ち受ける
// → インターネットからアクセス可能

async function startServer() {

  try {

    await initDatabase();

    server.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log(
          `Veyloサーバー起動: 0.0.0.0:${PORT}`
        );

        console.log(
          `環境: ${
            process.env.NODE_ENV || "development"
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

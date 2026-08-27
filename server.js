const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Pool } = require("pg");


// ==================================================
// PostgreSQL
// ==================================================

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

  // ----------------------------------------------
  // 部屋テーブル
  // ----------------------------------------------

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      owner TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);


  // ----------------------------------------------
  // メッセージテーブル
  // ----------------------------------------------

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      room TEXT NOT NULL,
      username TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);


  console.log(
    "PostgreSQL: roomsテーブル準備完了"
  );

  console.log(
    "PostgreSQL: messagesテーブル準備完了"
  );
}


// ==================================================
// ユーザー接続
// ==================================================

io.on("connection", (socket) => {

  console.log(
    "ユーザーが接続しました:",
    socket.id
  );


  // ==================================================
  // 雑談ルームに自動参加
  // ==================================================

  socket.join("casual");


  // ==================================================
  // 雑談の過去メッセージを読み込む
  // ==================================================

  pool.query(
    `
    SELECT
      room,
      username,
      text
    FROM messages
    WHERE room = $1
    ORDER BY created_at ASC
    `,
    ["casual"]
  )
  .then((result) => {

    socket.emit(
      "room messages",
      result.rows
    );

  })
  .catch((error) => {

    console.error(
      "雑談メッセージ取得エラー:",
      error
    );

  });


  // ==================================================
  // チャットメッセージ
  // ==================================================

  socket.on(
    "chat message",
    async (msg) => {

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

        room: String(msg.room),

        text: String(msg.text),

        username:
          msg.username || "ゲスト"

      };


      try {

        // ------------------------------------------
        // PostgreSQLに保存
        // ------------------------------------------

        await pool.query(
          `
          INSERT INTO messages
            (room, username, text)
          VALUES
            ($1, $2, $3)
          `,
          [
            message.room,
            message.username,
            message.text
          ]
        );


        console.log(
          "PostgreSQLにメッセージを保存しました:",
          message.text
        );


        // ------------------------------------------
        // 同じ部屋にいる人へ送信
        // ------------------------------------------

        io.to(message.room).emit(
          "chat message",
          message
        );


      } catch (error) {

        console.error(
          "メッセージの保存に失敗しました:",
          error
        );

      }

    }
  );


  // ==================================================
  // 部屋作成
  // ==================================================

  socket.on(
    "create room",
    async (data) => {

      if (!data || !data.name) {
        return;
      }


      const roomName =
        String(data.name).trim();


      if (!roomName) {
        return;
      }


      // ----------------------------------------------
      // 部屋ID
      // ----------------------------------------------

      const roomId =
        "room-" +
        Date.now() +
        "-" +
        Math.floor(
          Math.random() * 100000
        );


      // ----------------------------------------------
      // 招待コード
      // ----------------------------------------------

      const inviteCode =
        Math.random()
          .toString(36)
          .substring(2, 10)
          .toUpperCase();


      // ----------------------------------------------
      // 部屋情報
      // ----------------------------------------------

      const room = {

        id: roomId,

        name: roomName,

        inviteCode: inviteCode,

        owner: socket.id

      };


      try {

        // ------------------------------------------
        // PostgreSQLに部屋を保存
        // ------------------------------------------

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


        // ------------------------------------------
        // Socket.IOの部屋へ参加
        // ------------------------------------------

        socket.join(roomId);


        // ------------------------------------------
        // 作成した部屋の情報を送信
        // ------------------------------------------

        socket.emit(
          "room created",
          room
        );


        console.log(
          "部屋が作成されました:",
          room
        );


      } catch (error) {

        console.error(
          "部屋の保存に失敗しました:",
          error
        );


        socket.emit(
          "create room error",
          {
            message:
              "部屋を作成できませんでした。"
          }
        );

      }

    }
  );


  // ==================================================
  // 招待コードで部屋に参加
  // ==================================================

  socket.on(
    "join room",
    async (data) => {

      const code =
        String(
          data?.code || ""
        )
        .trim()
        .toUpperCase();


      // ----------------------------------------------
      // コードが空
      // ----------------------------------------------

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

        // ------------------------------------------
        // PostgreSQLから部屋を探す
        // ------------------------------------------

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


        // ------------------------------------------
        // 部屋が見つからない
        // ------------------------------------------

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


        // ------------------------------------------
        // 部屋情報
        // ------------------------------------------

        const dbRoom =
          result.rows[0];


        const room = {

          id: dbRoom.id,

          name: dbRoom.name,

          inviteCode:
            dbRoom.invite_code,

          owner: dbRoom.owner

        };


        // ------------------------------------------
        // Socket.IOの部屋へ参加
        // ------------------------------------------

        socket.join(room.id);


        // ------------------------------------------
        // 過去のメッセージを取得
        // ------------------------------------------

        const messagesResult =
          await pool.query(
            `
            SELECT
              room,
              username,
              text
            FROM messages
            WHERE room = $1
            ORDER BY created_at ASC
            `,
            [room.id]
          );


        // ------------------------------------------
        // 過去のメッセージをブラウザへ送信
        // ------------------------------------------

        socket.emit(
          "room messages",
          messagesResult.rows
        );


        console.log(
          "部屋に参加しました:",
          socket.id,
          room.name
        );


        // ------------------------------------------
        // 参加成功
        // ------------------------------------------

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
              "部屋に参加できませんでした。"
          }
        );

      }

    }
  );


  // ==================================================
  // 切断
  // ==================================================

  socket.on(
    "disconnect",
    () => {

      console.log(
        "ユーザーが退出しました:",
        socket.id
      );

    }
  );

});


// ==================================================
// サーバー起動
// ==================================================

const PORT =
  Number(process.env.PORT) || 3000;


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

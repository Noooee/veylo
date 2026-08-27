const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Pool } = require("pg");

console.log("=================================");
console.log("VEYLO SERVER.JS START");
console.log("=================================");


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
// PostgreSQL 初期化
// ==================================================

async function initDatabase() {

  console.log("PostgreSQL 初期化開始...");


  // ==================================================
  // rooms テーブル
  // ==================================================

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      invite_code TEXT UNIQUE NOT NULL,
      owner TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);


  console.log("rooms テーブル確認完了");


  // ==================================================
  // messages テーブル
  // ==================================================

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      room_id TEXT,
      username TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);


  console.log("messages テーブル確認完了");


  // ==================================================
  // 既存messagesテーブルにroom_idを追加
  // ==================================================

  await pool.query(`
    ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS room_id TEXT
  `);


  console.log("messages.room_id 確認完了");


  // ==================================================
  // 古いコメント削除
  // ==================================================

  const result = await pool.query(`
    DELETE FROM messages
    WHERE created_at < NOW() - INTERVAL '24 hours'
  `);


  if (result.rowCount > 0) {

    console.log(
      `古いコメントを ${result.rowCount} 件削除しました`
    );

  }


  console.log("PostgreSQL: テーブル準備完了");
}


// ==================================================
// 24時間以上前のコメントを定期削除
// ==================================================

setInterval(async () => {

  try {

    const result = await pool.query(`
      DELETE FROM messages
      WHERE created_at < NOW() - INTERVAL '24 hours'
    `);


    if (result.rowCount > 0) {

      console.log(
        `24時間経過したコメントを ${result.rowCount} 件削除しました`
      );

    }

  } catch (error) {

    console.error(
      "古いコメントの削除に失敗しました:",
      error
    );

  }

}, 60 * 60 * 1000);


// ==================================================
// Socket.IO
// ==================================================

io.on("connection", (socket) => {

  console.log(
    "ユーザーが接続しました:",
    socket.id
  );


  // ==================================================
  // 雑談ルームへ自動参加
  // ==================================================

  socket.join("casual");


  console.log(
    "casualルームへ参加:",
    socket.id
  );


  // ==================================================
  // 雑談の過去コメント
  // ==================================================

  sendRoomMessages(
    socket,
    "casual"
  );


  // ==================================================
  // 部屋のコメント取得
  // ==================================================

  socket.on(
    "load room messages",
    async (roomId) => {

      try {

        if (!roomId) {
          return;
        }


        const room =
          String(roomId).trim();


        if (!room) {
          return;
        }


        // ------------------------------------------
        // Socket.IOの部屋へ参加
        // ------------------------------------------

        socket.join(room);


        console.log(
          "部屋に参加:",
          socket.id,
          room
        );


        // ------------------------------------------
        // 過去コメント取得
        // ------------------------------------------

        await sendRoomMessages(
          socket,
          room
        );


      } catch (error) {

        console.error(
          "部屋コメント読み込みエラー:",
          error
        );

      }

    }
  );


  // ==================================================
  // チャットメッセージ
  // ==================================================

  socket.on(
    "chat message",
    async (msg) => {

      console.log(
        "★★★★★ サーバーがコメントを受信しました ★★★★★"
      );

      console.log(
        "受信データ:",
        msg
      );


      try {

        // ------------------------------------------
        // データ確認
        // ------------------------------------------

        if (!msg) {

          console.log(
            "❌ msg がありません"
          );

          return;
        }


        if (!msg.room) {

          console.log(
            "❌ room がありません"
          );

          return;
        }


        if (!msg.text) {

          console.log(
            "❌ text がありません"
          );

          return;
        }


        // ------------------------------------------
        // データ整理
        // ------------------------------------------

        const roomId =
          String(msg.room).trim();


        const text =
          String(msg.text).trim();


        const username =
          String(
            msg.username || "ゲスト"
          ).trim() || "ゲスト";


        console.log(
          "チャット処理開始:",
          {
            roomId,
            text,
            username
          }
        );


        if (!roomId || !text) {

          console.log(
            "❌ roomId または text が空です"
          );

          return;
        }


        // ==================================================
        // PostgreSQL保存
        // ==================================================

        console.log(
          "PostgreSQLへ保存開始..."
        );


        const result =
          await pool.query(
            `
            INSERT INTO messages
              (room_id, username, text)
            VALUES
              ($1, $2, $3)
            RETURNING
              id,
              room_id,
              username,
              text,
              created_at
            `,
            [
              roomId,
              username,
              text
            ]
          );


        console.log(
          "PostgreSQL INSERT 完了"
        );


        const savedMessage =
          result.rows[0];


        if (!savedMessage) {

          console.error(
            "❌ 保存結果がありません"
          );

          return;
        }


        console.log(
          "PostgreSQLにメッセージを保存しました:",
          savedMessage
        );


        // ==================================================
        // クライアントへ送信
        // ==================================================

        const messageData = {

          id:
            savedMessage.id,

          room:
            savedMessage.room_id,

          text:
            savedMessage.text,

          username:
            savedMessage.username,

          createdAt:
            savedMessage.created_at,

          senderId:
            socket.id

        };


        console.log(
          "クライアントへコメント送信:",
          messageData
        );


        io.to(roomId).emit(
          "chat message",
          messageData
        );


        console.log(
          "========== チャット処理完了 =========="
        );


      } catch (error) {

        console.error(
          "❌ メッセージ保存エラー:"
        );

        console.error(
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

      try {

        if (!data || !data.name) {
          return;
        }


        const roomName =
          String(data.name).trim();


        if (!roomName) {
          return;
        }


        // ------------------------------------------
        // 部屋ID
        // ------------------------------------------

        const roomId =
          "room-" +
          Date.now() +
          "-" +
          Math.floor(
            Math.random() * 100000
          );


        // ------------------------------------------
        // 招待コード
        // ------------------------------------------

        const inviteCode =
          Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase();


        // ------------------------------------------
        // 部屋
        // ------------------------------------------

        const room = {

          id:
            roomId,

          name:
            roomName,

          inviteCode:
            inviteCode,

          owner:
            socket.id

        };


        // ------------------------------------------
        // PostgreSQL保存
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
        // Socket.IO参加
        // ------------------------------------------

        socket.join(roomId);


        // ------------------------------------------
        // 作成成功
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
          "部屋作成エラー:",
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
  // 招待コードで部屋参加
  // ==================================================

  socket.on(
    "join room",
    async (data) => {

      try {

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


        // ------------------------------------------
        // 部屋検索
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


        // ------------------------------------------
        // Socket.IO参加
        // ------------------------------------------

        socket.join(room.id);


        console.log(
          "部屋に参加しました:",
          socket.id,
          room.name
        );


        // ------------------------------------------
        // 部屋情報
        // ------------------------------------------

        socket.emit(
          "room joined",
          room
        );


        // ------------------------------------------
        // 過去コメント
        // ------------------------------------------

        await sendRoomMessages(
          socket,
          room.id
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
    (reason) => {

      console.log(
        "ユーザーが退出しました:",
        socket.id,
        reason
      );

    }
  );

});


// ==================================================
// 過去コメント取得
// ==================================================

async function sendRoomMessages(
  socket,
  roomId
) {

  try {

    console.log(
      "過去コメント取得開始:",
      roomId
    );


    const result =
      await pool.query(
        `
        SELECT
          id,
          room_id,
          username,
          text,
          created_at
        FROM messages
        WHERE room_id = $1
          AND created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY created_at ASC
        `,
        [roomId]
      );


    const messages =
      result.rows.map(
        (message) => {

          return {

            id:
              message.id,

            room:
              message.room_id,

            username:
              message.username,

            text:
              message.text,

            createdAt:
              message.created_at

          };

        }
      );


    console.log(
      "過去コメント取得完了:",
      messages.length,
      "件"
    );


    socket.emit(
      "room messages",
      messages
    );


  } catch (error) {

    console.error(
      "❌ コメント取得エラー:",
      error
    );


    socket.emit(
      "room messages",
      []
    );

  }

}


// ==================================================
// サーバー起動
// ==================================================

const PORT =
  Number(process.env.PORT) || 3000;


async function startServer() {

  try {

    // ------------------------------------------
    // DB初期化
    // ------------------------------------------

    await initDatabase();


    // ------------------------------------------
    // DB接続確認
    // ------------------------------------------

    await pool.query(
      "SELECT 1"
    );


    console.log(
      "PostgreSQL接続確認OK"
    );


    // ------------------------------------------
    // サーバー起動
    // ------------------------------------------

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
      "❌ サーバー起動失敗:"
    );

    console.error(
      error
    );


    process.exit(1);

  }

}


startServer();

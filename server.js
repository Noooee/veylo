const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Pool } = require("pg");

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
// PostgreSQL
// ==================================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});


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
// データベース準備
// ==================================================

async function prepareDatabase() {

  try {

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        room TEXT NOT NULL,
        username TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("PostgreSQL: テーブル準備完了");

  } catch (error) {

    console.error(
      "PostgreSQLテーブル準備エラー:",
      error
    );

  }

}


// ==================================================
// 24時間以上経過したコメントを削除
// ==================================================

async function deleteOldMessages() {

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
      "古いコメント削除エラー:",
      error
    );

  }

}


// ==================================================
// 起動時に古いコメントを削除
// ==================================================

prepareDatabase().then(() => {

  deleteOldMessages();

});


// ==================================================
// 1時間ごとに古いコメントを削除
// ==================================================

setInterval(
  deleteOldMessages,
  60 * 60 * 1000
);


// ==================================================
// 作成された部屋
// ==================================================

const rooms = {};


// ==================================================
// ユーザー接続
// ==================================================

io.on("connection", (socket) => {

  console.log(
    "ユーザーが接続しました:",
    socket.id
  );


  // ==================================================
  // 最初は雑談ルーム
  // ==================================================

  socket.join("casual");

  console.log(
    "casualルームへ参加:",
    socket.id
  );


  // ==================================================
  // 過去コメント取得
  // ==================================================

  async function sendRoomMessages(roomId) {

    try {

      console.log(
        "過去コメント取得開始:",
        roomId
      );


      const result = await pool.query(
        `
        SELECT
          id,
          room,
          username,
          text,
          created_at
        FROM messages
        WHERE room = $1
        AND created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY created_at ASC
        `,
        [roomId]
      );


      const messages = result.rows.map(
        (row) => ({
          id: row.id,
          room: row.room,
          username: row.username,
          text: row.text,
          createdAt: row.created_at
        })
      );


      socket.emit(
        "previous messages",
        messages
      );


      console.log(
        "過去コメント取得完了:",
        messages.length,
        "件"
      );


    } catch (error) {

      console.error(
        "過去コメント取得エラー:",
        error
      );

    }

  }


  sendRoomMessages("casual");


  // ==================================================
  // チャットメッセージ
  // ==================================================

  socket.on(
    "chat message",
    async (msg) => {

      console.log(
        "チャットメッセージ受信:",
        msg
      );


      if (!msg) {
        return;
      }


      if (!msg.room) {
        return;
      }


      if (!msg.text) {
        return;
      }


      const username =
        msg.username || "ゲスト";


      try {

        // ==================================================
        // PostgreSQLへ保存
        // ==================================================

        console.log(
          "PostgreSQLへ保存開始..."
        );


        const result =
          await pool.query(
            `
            INSERT INTO messages
              (room, username, text)
            VALUES
              ($1, $2, $3)
            RETURNING
              id,
              room,
              username,
              text,
              created_at
            `,
            [
              msg.room,
              username,
              msg.text
            ]
          );


        const saved =
          result.rows[0];


        const messageData = {

          id:
            saved.id,

          room:
            saved.room,

          username:
            saved.username,

          text:
            saved.text,

          createdAt:
            saved.created_at

        };


        console.log(
          "コメント保存成功:",
          messageData
        );


        // ==================================================
        // その部屋のユーザーへ送信
        // ==================================================

        io.to(msg.room).emit(
          "chat message",
          messageData
        );


      } catch (error) {

        console.error(
          "❌ メッセージ保存エラー:",
          error
        );

      }

    }
  );


  // ==================================================
  // 雑談ルームへ戻る
  // ==================================================

  socket.on(
    "join casual",
    async () => {

      try {

        // 現在いるSocket.IOルームから
        // 雑談以外を退出

        for (const roomName of socket.rooms) {

          if (
            roomName !== socket.id &&
            roomName !== "casual"
          ) {

            socket.leave(roomName);

          }

        }


        socket.join("casual");


        console.log(
          "雑談ルームへ戻りました:",
          socket.id
        );


        await sendRoomMessages(
          "casual"
        );


      } catch (error) {

        console.error(
          "雑談ルーム復帰エラー:",
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
    (data) => {

      if (!data || !data.name) {
        return;
      }


      const roomName =
        String(data.name).trim();


      if (!roomName) {
        return;
      }


      // ==================================================
      // 部屋ID
      // ==================================================

      const roomId =
        "room-" +
        Date.now() +
        "-" +
        Math.floor(
          Math.random() * 100000
        );


      // ==================================================
      // 招待コード
      // ==================================================

      const inviteCode =
        Math.random()
          .toString(36)
          .substring(2, 10)
          .toUpperCase();


      // ==================================================
      // 部屋情報
      // ==================================================

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


      // ==================================================
      // 保存
      // ==================================================

      rooms[roomId] =
        room;


      // ==================================================
      // 雑談から退出
      // ==================================================

      socket.leave("casual");


      // ==================================================
      // 作成した部屋へ参加
      // ==================================================

      socket.join(roomId);


      console.log(
        "部屋が作成されました:",
        room
      );


      // ==================================================
      // 作成者へ通知
      // ==================================================

      socket.emit(
        "room created",
        room
      );

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


      // ==================================================
      // コードが空
      // ==================================================

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


      // ==================================================
      // 招待コードから部屋を探す
      // ==================================================

      const room =
        Object.values(rooms).find(
          (room) =>
            room.inviteCode === code
        );


      // ==================================================
      // 部屋が存在しない
      // ==================================================

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


      // ==================================================
      // 現在の部屋から退出
      // ==================================================

      for (const roomName of socket.rooms) {

        if (
          roomName !== socket.id
        ) {

          socket.leave(roomName);

        }

      }


      // ==================================================
      // 新しい部屋へ参加
      // ==================================================

      socket.join(room.id);


      console.log(
        "部屋に参加しました:",
        socket.id,
        room.name
      );


      // ==================================================
      // 参加した本人へ通知
      // ==================================================

      socket.emit(
        "room joined",
        room
      );


      // ==================================================
      // 過去コメント取得
      // ==================================================

      await sendRoomMessages(
        room.id
      );

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

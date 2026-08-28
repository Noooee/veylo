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

  res.status(200).send(
    "Veylo is running!"
  );

});


// ==================================================
// データベース準備
// ==================================================

async function prepareDatabase() {

  try {

    // ==================================================
    // メッセージテーブル
    // ==================================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        room TEXT NOT NULL,
        username TEXT NOT NULL,
        user_id TEXT,
        text TEXT NOT NULL,
        reply_to INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      )
    `);


    // ==================================================
    // 既存DBへの追加カラム
    // ==================================================

    await pool.query(`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS user_id TEXT
    `);


    await pool.query(`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS reply_to INTEGER
    `);


    await pool.query(`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP
    `);


    console.log(
      "PostgreSQL: テーブル準備完了"
    );

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

    const result =
      await pool.query(`
        DELETE FROM messages
        WHERE created_at <
          NOW() - INTERVAL '24 hours'
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
// DB準備後に古いコメントを削除
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


      const result =
        await pool.query(
          `
          SELECT
            id,
            room,
            username,
            user_id,
            text,
            reply_to,
            created_at,
            updated_at
          FROM messages
          WHERE room = $1
          AND created_at >=
            NOW() - INTERVAL '24 hours'
          ORDER BY created_at ASC
          `,
          [roomId]
        );


      const messages =
        result.rows.map(
          (row) => ({

            id:
              row.id,

            room:
              row.room,

            username:
              row.username,

            userId:
              row.user_id,

            text:
              row.text,

            replyTo:
              row.reply_to,

            createdAt:
              row.created_at,

            updatedAt:
              row.updated_at

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


  // ==================================================
  // 接続直後に雑談のコメントを取得
  // ==================================================

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
        String(
          msg.username || "ゲスト"
        ).trim()
        .slice(0, 30);


      const userId =
        String(
          msg.userId || ""
        ).trim();


      const text =
        String(
          msg.text
        ).trim()
        .slice(0, 500);


      if (!text) {
        return;
      }


      if (!userId) {

        socket.emit(
          "message error",
          {
            message:
              "ユーザーIDが確認できませんでした。ページを再読み込みしてください。"
          }
        );

        return;

      }


      // ==================================================
      // リプライ先
      // ==================================================

      let replyTo = null;


      if (
        msg.replyTo !== null &&
        msg.replyTo !== undefined &&
        msg.replyTo !== ""
      ) {

        const parsedReplyTo =
          Number(msg.replyTo);


        if (
          Number.isInteger(
            parsedReplyTo
          )
        ) {

          replyTo =
            parsedReplyTo;

        }

      }


      try {

        // ==================================================
        // リプライ先が本当に存在するか確認
        // ==================================================

        if (replyTo !== null) {

          const replyResult =
            await pool.query(
              `
              SELECT id
              FROM messages
              WHERE id = $1
              AND room = $2
              AND created_at >=
                NOW() - INTERVAL '24 hours'
              `,
              [
                replyTo,
                msg.room
              ]
            );


          if (
            replyResult.rowCount === 0
          ) {

            replyTo = null;

          }

        }


        // ==================================================
        // PostgreSQLへ保存
        // ==================================================

        const result =
          await pool.query(
            `
            INSERT INTO messages
              (
                room,
                username,
                user_id,
                text,
                reply_to
              )
            VALUES
              ($1, $2, $3, $4, $5)
            RETURNING
              id,
              room,
              username,
              user_id,
              text,
              reply_to,
              created_at,
              updated_at
            `,
            [
              msg.room,
              username || "ゲスト",
              userId,
              text,
              replyTo
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

          userId:
            saved.user_id,

          text:
            saved.text,

          replyTo:
            saved.reply_to,

          createdAt:
            saved.created_at,

          updatedAt:
            saved.updated_at

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
  // コメント編集
  // ==================================================

  socket.on(
    "edit message",
    async (data) => {

      if (!data) {
        return;
      }


      const messageId =
        Number(data.messageId);


      const userId =
        String(
          data.userId || ""
        ).trim();


      const newText =
        String(
          data.text || ""
        ).trim()
        .slice(0, 500);


      if (
        !Number.isInteger(messageId) ||
        messageId <= 0
      ) {

        return;

      }


      if (!userId) {
        return;
      }


      if (!newText) {

        socket.emit(
          "message edit error",
          {
            messageId:
              messageId,

            message:
              "メッセージを空にはできません。"
          }
        );

        return;

      }


      try {

        // ==================================================
        // 自分のコメントだけ編集可能
        // ==================================================

        const result =
          await pool.query(
            `
            UPDATE messages
            SET
              text = $1,
              updated_at = NOW()
            WHERE
              id = $2
              AND user_id = $3
              AND created_at >=
                NOW() - INTERVAL '24 hours'
            RETURNING
              id,
              room,
              username,
              user_id,
              text,
              reply_to,
              created_at,
              updated_at
            `,
            [
              newText,
              messageId,
              userId
            ]
          );


        if (
          result.rowCount === 0
        ) {

          socket.emit(
            "message edit error",
            {
              messageId:
                messageId,

              message:
                "このコメントは編集できません。"
            }
          );

          return;

        }


        const updated =
          result.rows[0];


        const messageData = {

          id:
            updated.id,

          room:
            updated.room,

          username:
            updated.username,

          userId:
            updated.user_id,

          text:
            updated.text,

          replyTo:
            updated.reply_to,

          createdAt:
            updated.created_at,

          updatedAt:
            updated.updated_at

        };


        // ==================================================
        // 部屋全員へ編集結果を送信
        // ==================================================

        io.to(
          updated.room
        ).emit(
          "message edited",
          messageData
        );


        console.log(
          "コメント編集:",
          messageData.id
        );

      } catch (error) {

        console.error(
          "コメント編集エラー:",
          error
        );

      }

    }
  );


  // ==================================================
  // コメント削除
  // ==================================================

  socket.on(
    "delete message",
    async (data) => {

      if (!data) {
        return;
      }


      const messageId =
        Number(data.messageId);


      const userId =
        String(
          data.userId || ""
        ).trim();


      if (
        !Number.isInteger(messageId) ||
        messageId <= 0
      ) {

        return;

      }


      if (!userId) {
        return;
      }


      try {

        // ==================================================
        // 削除対象を取得
        // ==================================================

        const findResult =
          await pool.query(
            `
            SELECT
              id,
              room
            FROM messages
            WHERE
              id = $1
              AND user_id = $2
              AND created_at >=
                NOW() - INTERVAL '24 hours'
            `,
            [
              messageId,
              userId
            ]
          );


        if (
          findResult.rowCount === 0
        ) {

          socket.emit(
            "message delete error",
            {
              messageId:
                messageId,

              message:
                "このコメントは削除できません。"
            }
          );

          return;

        }


        const message =
          findResult.rows[0];


        // ==================================================
        // 削除
        // ==================================================

        await pool.query(
          `
          DELETE FROM messages
          WHERE
            id = $1
            AND user_id = $2
          `,
          [
            messageId,
            userId
          ]
        );


        // ==================================================
        // 部屋全員へ通知
        // ==================================================

        io.to(
          message.room
        ).emit(
          "message deleted",
          {
            id:
              message.id,

            room:
              message.room
          }
        );


        console.log(
          "コメント削除:",
          message.id
        );

      } catch (error) {

        console.error(
          "コメント削除エラー:",
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

        // ==================================================
        // 現在いるルームから退出
        // ==================================================

        for (
          const roomName of socket.rooms
        ) {

          if (
            roomName !== socket.id &&
            roomName !== "casual"
          ) {

            socket.leave(
              roomName
            );

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

      if (
        !data ||
        !data.name
      ) {

        return;

      }


      const roomName =
        String(
          data.name
        )
          .trim()
          .slice(0, 50);


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

      socket.leave(
        "casual"
      );


      // ==================================================
      // 作成した部屋へ参加
      // ==================================================

      socket.join(
        roomId
      );


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


      // ==================================================
      // 作成した部屋の過去コメント取得
      // ==================================================

      sendRoomMessages(
        roomId
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
        Object.values(
          rooms
        ).find(
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

      for (
        const roomName of socket.rooms
      ) {

        if (
          roomName !== socket.id
        ) {

          socket.leave(
            roomName
          );

        }

      }


      // ==================================================
      // 新しい部屋へ参加
      // ==================================================

      socket.join(
        room.id
      );


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
  Number(
    process.env.PORT
  ) || 3000;


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

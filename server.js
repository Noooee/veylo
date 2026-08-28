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

const server =
  http.createServer(app);


// ==================================================
// Socket.IO
// ==================================================

const io =
  new Server(server);


// ==================================================
// PostgreSQL
// ==================================================

const pool =
  new Pool({
    connectionString:
      process.env.DATABASE_URL,

    ssl: {
      rejectUnauthorized: false
    }
  });


// ==================================================
// 静的ファイル
// ==================================================

app.use(
  express.static("public")
);


// ==================================================
// ヘルスチェック
// ==================================================

app.get(
  "/health",
  (req, res) => {

    res
      .status(200)
      .send("Veylo is running!");

  }
);


// ==================================================
// データベース準備
// ==================================================

async function prepareDatabase() {

  try {

    // ==================================================
    // messagesテーブル
    // ==================================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        room TEXT NOT NULL,
        username TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);


    // ==================================================
    // 返信先ID
    // ==================================================

    await pool.query(`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS reply_to INTEGER
    `);


    // ==================================================
    // 編集済みフラグ
    // ==================================================

    await pool.query(`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS edited BOOLEAN
      DEFAULT FALSE
    `);


    // ==================================================
    // 投稿者識別子
    // ==================================================

    await pool.query(`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS author_id TEXT
    `);


    // ==================================================
    // インデックス
    // ==================================================

    await pool.query(`
      CREATE INDEX IF NOT EXISTS
      messages_room_created_at_idx
      ON messages(room, created_at)
    `);


    await pool.query(`
      CREATE INDEX IF NOT EXISTS
      messages_reply_to_idx
      ON messages(reply_to)
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
// 起動時にデータベース準備
// ==================================================

prepareDatabase()
  .then(() => {

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
// メッセージをJSON形式へ変換
// ==================================================

function formatMessage(row) {

  return {

    id:
      row.id,

    room:
      row.room,

    username:
      row.username,

    text:
      row.text,

    createdAt:
      row.created_at,

    replyTo:
      row.reply_to || null,

    edited:
      Boolean(row.edited)

  };

}


// ==================================================
// ユーザー接続
// ==================================================

io.on(
  "connection",
  (socket) => {

    console.log(
      "ユーザーが接続しました:",
      socket.id
    );


    // ==================================================
    // 現在の部屋
    // ==================================================

    socket.currentRoom =
      "casual";


    // ==================================================
    // ユーザー識別子
    // ==================================================

    /*
     * app.jsから送られてきたauthorIdを使用します。
     *
     * ログイン機能がない現在のVeyloでは、
     * このIDを「同じブラウザの自分」として扱います。
     */

    socket.authorId =
      null;


    // ==================================================
    // 最初は雑談ルーム
    // ==================================================

    socket.join("casual");


    console.log(
      "casualルームへ参加:",
      socket.id
    );


    // ==================================================
    // ユーザー識別子登録
    // ==================================================

    socket.on(
      "set author id",
      (authorId) => {

        if (
          typeof authorId !== "string"
        ) {

          return;

        }


        const cleanId =
          authorId.trim();


        if (
          !cleanId ||
          cleanId.length > 100
        ) {

          return;

        }


        socket.authorId =
          cleanId;


        console.log(
          "authorId設定:",
          socket.id
        );

      }
    );


    // ==================================================
    // 過去コメント取得
    // ==================================================

    async function sendRoomMessages(
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
              room,
              username,
              text,
              created_at,
              reply_to,
              edited
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
            formatMessage
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
    // 最初は雑談のコメントを取得
    // ==================================================

    sendRoomMessages(
      "casual"
    );


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


        if (!socket.authorId) {

          socket.emit(
            "message error",
            {
              message:
                "ユーザー情報を確認できませんでした。"
            }
          );

          return;

        }


        const room =
          String(msg.room)
            .trim();


        const text =
          String(msg.text)
            .trim();


        const username =
          String(
            msg.username || "ゲスト"
          )
            .trim()
            .slice(0, 30);


        if (!room || !text) {
          return;
        }


        if (text.length > 500) {
          return;
        }


        // ==================================================
        // リプライ先
        // ==================================================

        let replyTo =
          null;


        if (
          msg.replyTo !== null &&
          msg.replyTo !== undefined &&
          msg.replyTo !== ""
        ) {

          const parsed =
            Number(msg.replyTo);


          if (
            Number.isInteger(parsed) &&
            parsed > 0
          ) {

            replyTo =
              parsed;

          }

        }


        try {

          // ==================================================
          // リプライ先が存在するか確認
          // ==================================================

          if (replyTo !== null) {

            const replyResult =
              await pool.query(
                `
                SELECT
                  id,
                  room
                FROM messages
                WHERE id = $1
                AND room = $2
                AND created_at >=
                  NOW() - INTERVAL '24 hours'
                `,
                [
                  replyTo,
                  room
                ]
              );


            if (
              replyResult.rowCount === 0
            ) {

              replyTo =
                null;

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
                  text,
                  reply_to,
                  author_id
                )
              VALUES
                ($1, $2, $3, $4, $5)
              RETURNING
                id,
                room,
                username,
                text,
                created_at,
                reply_to,
                edited
              `,
              [
                room,
                username,
                text,
                replyTo,
                socket.authorId
              ]
            );


          const saved =
            result.rows[0];


          const messageData =
            formatMessage(saved);


          console.log(
            "コメント保存成功:",
            messageData
          );


          // ==================================================
          // その部屋のユーザーへ送信
          // ==================================================

          io.to(room).emit(
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
    // メッセージ編集
    // ==================================================

    socket.on(
      "edit message",
      async (data) => {

        try {

          if (!data) {
            return;
          }


          if (!socket.authorId) {
            return;
          }


          const messageId =
            Number(data.id);


          const newText =
            String(data.text || "")
              .trim();


          if (
            !Number.isInteger(messageId) ||
            messageId <= 0
          ) {

            return;

          }


          if (!newText) {
            return;
          }


          if (newText.length > 500) {
            return;
          }


          // ==================================================
          // 自分のメッセージか確認
          // ==================================================

          const result =
            await pool.query(
              `
              UPDATE messages
              SET
                text = $1,
                edited = TRUE
              WHERE
                id = $2
              AND
                author_id = $3
              AND
                created_at >=
                  NOW() - INTERVAL '24 hours'
              RETURNING
                id,
                room,
                username,
                text,
                created_at,
                reply_to,
                edited
              `,
              [
                newText,
                messageId,
                socket.authorId
              ]
            );


          if (
            result.rowCount === 0
          ) {

            socket.emit(
              "message action error",
              {
                message:
                  "このコメントは編集できません。"
              }
            );

            return;

          }


          const updated =
            formatMessage(
              result.rows[0]
            );


          console.log(
            "コメント編集:",
            updated
          );


          // ==================================================
          // 部屋全体へ通知
          // ==================================================

          io.to(
            updated.room
          ).emit(
            "message edited",
            updated
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
    // メッセージ削除
    // ==================================================

    socket.on(
      "delete message",
      async (data) => {

        try {

          if (!data) {
            return;
          }


          if (!socket.authorId) {
            return;
          }


          const messageId =
            Number(data.id);


          if (
            !Number.isInteger(messageId) ||
            messageId <= 0
          ) {

            return;

          }


          // ==================================================
          // 自分のコメントだけ削除
          // ==================================================

          const result =
            await pool.query(
              `
              DELETE FROM messages
              WHERE
                id = $1
              AND
                author_id = $2
              AND
                created_at >=
                  NOW() - INTERVAL '24 hours'
              RETURNING
                id,
                room
              `,
              [
                messageId,
                socket.authorId
              ]
            );


          if (
            result.rowCount === 0
          ) {

            socket.emit(
              "message action error",
              {
                message:
                  "このコメントは削除できません。"
              }
            );

            return;

          }


          const deleted =
            result.rows[0];


          console.log(
            "コメント削除:",
            deleted
          );


          // ==================================================
          // 部屋全体へ通知
          // ==================================================

          io.to(
            deleted.room
          ).emit(
            "message deleted",
            {
              id:
                deleted.id,

              room:
                deleted.room
            }
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
          // 現在いる部屋から退出
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


          socket.join(
            "casual"
          );


          socket.currentRoom =
            "casual";


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
          String(data.name)
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
        // 新しい部屋へ参加
        // ==================================================

        socket.join(
          roomId
        );


        socket.currentRoom =
          roomId;


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
        // 新しい部屋の過去コメント
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
          Object.values(rooms)
            .find(
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


        socket.currentRoom =
          room.id;


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

  }
);


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

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
    // messagesテーブル
    // ==================================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        room TEXT NOT NULL,
        username TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reply_to INTEGER
      )
    `);


    // ==================================================
    // 既にmessagesテーブルがある場合にも
    // reply_toカラムを追加
    // ==================================================

    await pool.query(`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS reply_to INTEGER
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
// データベース準備後に古いコメント削除
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
// メッセージ所有者
//
// {
//   "123": "socket-id"
// }
// ==================================================

const messageOwners = new Map();


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
            m.id,
            m.room,
            m.username,
            m.text,
            m.created_at,
            m.reply_to,

            r.username AS reply_username,
            r.text AS reply_text

          FROM messages m

          LEFT JOIN messages r
            ON m.reply_to = r.id

          WHERE m.room = $1

          AND m.created_at >=
            NOW() - INTERVAL '24 hours'

          ORDER BY
            m.created_at ASC
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

            text:
              row.text,

            createdAt:
              row.created_at,

            replyTo:
              row.reply_to
                ? {
                    id:
                      row.reply_to,

                    username:
                      row.reply_username ||
                      "ゲスト",

                    text:
                      row.reply_text ||
                      ""
                  }
                : null

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
  // 接続時に雑談の過去コメントを取得
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
        ).trim();


      const text =
        String(
          msg.text
        ).trim();


      if (!text) {
        return;
      }


      // ==================================================
      // 返信先
      // ==================================================

      let replyToId = null;


      if (
        msg.replyTo !== null &&
        msg.replyTo !== undefined &&
        msg.replyTo !== ""
      ) {

        const parsedReplyId =
          Number(msg.replyTo);


        if (
          Number.isInteger(
            parsedReplyId
          )
        ) {

          replyToId =
            parsedReplyId;

        }

      }


      try {

        // ==================================================
        // 返信先コメント確認
        // ==================================================

        let replyData = null;


        if (replyToId !== null) {

          const replyResult =
            await pool.query(
              `
              SELECT
                id,
                room,
                username,
                text,
                created_at

              FROM messages

              WHERE id = $1
              `,
              [replyToId]
            );


          if (
            replyResult.rows.length === 0
          ) {

            socket.emit(
              "message error",
              {
                message:
                  "返信先のコメントが見つかりません。"
              }
            );

            return;

          }


          const replyMessage =
            replyResult.rows[0];


          // ==================================================
          // 別の部屋のコメントには返信不可
          // ==================================================

          if (
            replyMessage.room !==
            msg.room
          ) {

            socket.emit(
              "message error",
              {
                message:
                  "このコメントには返信できません。"
              }
            );

            return;

          }


          // ==================================================
          // 返信先が24時間を過ぎていたら
          // 返信不可
          // ==================================================

          const replyCreatedTime =
            new Date(
              replyMessage.created_at
            ).getTime();


          if (
            !Number.isNaN(
              replyCreatedTime
            ) &&
            Date.now() -
              replyCreatedTime >=
              24 * 60 * 60 * 1000
          ) {

            socket.emit(
              "message error",
              {
                message:
                  "24時間を過ぎたコメントには返信できません。"
              }
            );

            return;

          }


          replyData = {

            id:
              replyMessage.id,

            username:
              replyMessage.username,

            text:
              replyMessage.text

          };

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
                reply_to
              )

            VALUES
              (
                $1,
                $2,
                $3,
                $4
              )

            RETURNING
              id,
              room,
              username,
              text,
              created_at,
              reply_to
            `,
            [
              msg.room,
              username,
              text,
              replyToId
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
            saved.created_at,

          replyTo:
            replyData

        };


        // ==================================================
        // コメント所有者を記録
        // ==================================================

        messageOwners.set(
          String(saved.id),
          socket.id
        );


        console.log(
          "コメント保存成功:",
          messageData
        );


        // ==================================================
        // その部屋のユーザーへ送信
        // ==================================================

        io.to(
          msg.room
        ).emit(
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


        const messageId =
          Number(data.id);


        const newText =
          String(
            data.text || ""
          ).trim();


        if (
          !Number.isInteger(
            messageId
          )
        ) {

          return;

        }


        if (!newText) {

          socket.emit(
            "message edit error",
            {
              message:
                "メッセージを入力してください。"
            }
          );

          return;

        }


        // ==================================================
        // 所有者確認
        // ==================================================

        const owner =
          messageOwners.get(
            String(messageId)
          );


        if (
          owner &&
          owner !== socket.id
        ) {

          socket.emit(
            "message edit error",
            {
              message:
                "自分のコメントだけ編集できます。"
            }
          );

          return;

        }


        // ==================================================
        // DBから取得
        // ==================================================

        const existingResult =
          await pool.query(
            `
            SELECT
              id,
              room,
              username,
              text,
              created_at,
              reply_to

            FROM messages

            WHERE id = $1
            `,
            [messageId]
          );


        if (
          existingResult.rows.length === 0
        ) {

          socket.emit(
            "message edit error",
            {
              message:
                "コメントが見つかりません。"
            }
          );

          return;

        }


        const existing =
          existingResult.rows[0];


        // ==================================================
        // 所有者情報がない場合
        // ==================================================

        if (!owner) {

          const currentUsername =
            String(
              data.username || ""
            ).trim();


          if (
            !currentUsername ||
            currentUsername !==
              existing.username
          ) {

            socket.emit(
              "message edit error",
              {
                message:
                  "自分のコメントだけ編集できます。"
              }
            );

            return;

          }


          messageOwners.set(
            String(messageId),
            socket.id
          );

        }


        // ==================================================
        // 24時間チェック
        // ==================================================

        const createdTime =
          new Date(
            existing.created_at
          ).getTime();


        if (
          !Number.isNaN(
            createdTime
          ) &&
          Date.now() -
            createdTime >=
            24 * 60 * 60 * 1000
        ) {

          socket.emit(
            "message edit error",
            {
              message:
                "24時間を過ぎたコメントは編集できません。"
            }
          );

          return;

        }


        // ==================================================
        // 更新
        // ==================================================

        const result =
          await pool.query(
            `
            UPDATE messages

            SET text = $1

            WHERE id = $2

            RETURNING
              id,
              room,
              username,
              text,
              created_at,
              reply_to
            `,
            [
              newText,
              messageId
            ]
          );


        const updated =
          result.rows[0];


        // ==================================================
        // 返信情報を取得
        // ==================================================

        let replyData = null;


        if (
          updated.reply_to
        ) {

          const replyResult =
            await pool.query(
              `
              SELECT
                id,
                username,
                text

              FROM messages

              WHERE id = $1
              `,
              [updated.reply_to]
            );


          if (
            replyResult.rows.length > 0
          ) {

            const reply =
              replyResult.rows[0];


            replyData = {

              id:
                reply.id,

              username:
                reply.username,

              text:
                reply.text

            };

          }

        }


        const messageData = {

          id:
            updated.id,

          room:
            updated.room,

          username:
            updated.username,

          text:
            updated.text,

          createdAt:
            updated.created_at,

          replyTo:
            replyData,

          edited:
            true

        };


        // ==================================================
        // 部屋全体へ通知
        // ==================================================

        io.to(
          updated.room
        ).emit(
          "message edited",
          messageData
        );


        console.log(
          "コメント編集:",
          messageData
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


        const messageId =
          Number(data.id);


        if (
          !Number.isInteger(
            messageId
          )
        ) {

          return;

        }


        // ==================================================
        // 所有者確認
        // ==================================================

        const owner =
          messageOwners.get(
            String(messageId)
          );


        if (
          owner &&
          owner !== socket.id
        ) {

          socket.emit(
            "message delete error",
            {
              message:
                "自分のコメントだけ削除できます。"
            }
          );

          return;

        }


        // ==================================================
        // DBから取得
        // ==================================================

        const existingResult =
          await pool.query(
            `
            SELECT
              id,
              room,
              username,
              created_at

            FROM messages

            WHERE id = $1
            `,
            [messageId]
          );


        if (
          existingResult.rows.length === 0
        ) {

          socket.emit(
            "message delete error",
            {
              message:
                "コメントが見つかりません。"
            }
          );

          return;

        }


        const existing =
          existingResult.rows[0];


        // ==================================================
        // 所有者情報がない場合
        // ==================================================

        if (!owner) {

          const currentUsername =
            String(
              data.username || ""
            ).trim();


          if (
            !currentUsername ||
            currentUsername !==
              existing.username
          ) {

            socket.emit(
              "message delete error",
              {
                message:
                  "自分のコメントだけ削除できます。"
              }
            );

            return;

          }


          messageOwners.set(
            String(messageId),
            socket.id
          );

        }


        // ==================================================
        // 24時間チェック
        // ==================================================

        const createdTime =
          new Date(
            existing.created_at
          ).getTime();


        if (
          !Number.isNaN(
            createdTime
          ) &&
          Date.now() -
            createdTime >=
            24 * 60 * 60 * 1000
        ) {

          socket.emit(
            "message delete error",
            {
              message:
                "24時間を過ぎたコメントは削除済みです。"
            }
          );

          return;

        }


        // ==================================================
        // DBから削除
        // ==================================================

        await pool.query(
          `
          DELETE FROM messages

          WHERE id = $1
          `,
          [messageId]
        );


        // ==================================================
        // 所有者情報削除
        // ==================================================

        messageOwners.delete(
          String(messageId)
        );


        // ==================================================
        // 部屋全体へ通知
        // ==================================================

        io.to(
          existing.room
        ).emit(
          "message deleted",
          {
            id:
              messageId,

            room:
              existing.room
          }
        );


        console.log(
          "コメント削除:",
          messageId
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
        ).trim();


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
          .substring(
            2,
            10
          )
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
      // 作成した部屋の過去コメント
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


      const room =
        Object.values(
          rooms
        ).find(
          (room) =>
            room.inviteCode ===
            code
        );


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
      // 本人へ通知
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


      // ==================================================
      // 切断したユーザーの
      // 一時的な所有者情報を削除
      // ==================================================

      for (
        const [
          messageId,
          ownerSocketId
        ] of messageOwners
      ) {

        if (
          ownerSocketId ===
          socket.id
        ) {

          messageOwners.delete(
            messageId
          );

        }

      }

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

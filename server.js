"use strict";

require("dotenv").config();

const path = require("path");
const crypto = require("crypto");

const express = require("express");
const http = require("http");
const helmet = require("helmet");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const SQLiteStoreFactory = require("connect-sqlite3");

const {
  Server
} = require("socket.io");


// ==================================================
// 基本設定
// ==================================================

const PORT =
  Number(process.env.PORT) || 3000;

const APP_URL =
  (
    process.env.APP_URL ||
    `http://localhost:${PORT}`
  ).replace(/\/$/, "");

const SESSION_SECRET =
  process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET が .env に設定されていません。"
  );
}


// ==================================================
// Express
// ==================================================

const app = express();

const server =
  http.createServer(app);


// ==================================================
// DB
// ==================================================

const dataDir =
  path.join(__dirname, "data");

const fs =
  require("fs");

fs.mkdirSync(
  dataDir,
  {
    recursive: true
  }
);

const db =
  new Database(
    path.join(
      dataDir,
      "veylo.db"
    )
  );

db.pragma(
  "journal_mode = WAL"
);

db.pragma(
  "foreign_keys = ON"
);


// ==================================================
// テーブル
// ==================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL COLLATE NOCASE UNIQUE,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT NOT NULL UNIQUE,
    owner_id INTEGER NOT NULL,
    created_at INTEGER NOT NULL,

    FOREIGN KEY (owner_id)
      REFERENCES users(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS room_members (
    room_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    joined_at INTEGER NOT NULL,

    PRIMARY KEY (
      room_id,
      user_id
    ),

    FOREIGN KEY (room_id)
      REFERENCES rooms(id)
      ON DELETE CASCADE,

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,

    room_id TEXT NOT NULL,

    user_id INTEGER NOT NULL,

    username TEXT NOT NULL,

    text TEXT NOT NULL,

    reply_to_id TEXT,

    reply_to_username TEXT,

    reply_to_text TEXT,

    created_at INTEGER NOT NULL,

    edited INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY (room_id)
      REFERENCES rooms(id)
      ON DELETE CASCADE,

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS
    idx_messages_room_created
    ON messages(room_id, created_at);

  CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    token_hash TEXT NOT NULL UNIQUE,

    expires_at INTEGER NOT NULL,

    used INTEGER NOT NULL DEFAULT 0,

    created_at INTEGER NOT NULL,

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
  );
`);


// ==================================================
// 雑談ルーム
// ==================================================

const CASUAL_ROOM_ID =
  "casual";

const casualExists =
  db.prepare(`
    SELECT id
    FROM rooms
    WHERE id = ?
  `).get(
    CASUAL_ROOM_ID
  );

if (!casualExists) {

  const now =
    Date.now();

  db.prepare(`
    INSERT INTO rooms (
      id,
      name,
      invite_code,
      owner_id,
      created_at
    )
    VALUES (
      ?,
      ?,
      ?,
      ?,
      ?
    )
  `).run(
    CASUAL_ROOM_ID,
    "雑談",
    "CASUAL",
    1,
    now
  );

}


// ==================================================
// Express middleware
// ==================================================

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(
  express.json({
    limit: "50kb"
  })
);

app.use(
  express.urlencoded({
    extended: false
  })
);


// ==================================================
// セッション
// ==================================================

const SQLiteStore =
  SQLiteStoreFactory(
    session
  );

const sessionMiddleware =
  session({
    store:
      new SQLiteStore({
        db:
          "sessions.db",

        dir:
          dataDir
      }),

    secret:
      SESSION_SECRET,

    resave:
      false,

    saveUninitialized:
      false,

    rolling:
      true,

    cookie: {

      httpOnly:
        true,

      sameSite:
        "lax",

      secure:
        process.env.NODE_ENV ===
        "production",

      maxAge:
        1000 *
        60 *
        60 *
        24 *
        365
    }
  });

app.use(
  sessionMiddleware
);


// ==================================================
// メール
// ==================================================

let transporter = null;

if (
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
) {

  transporter =
    nodemailer.createTransport({

      host:
        process.env.SMTP_HOST,

      port:
        Number(
          process.env.SMTP_PORT ||
          465
        ),

      secure:
        process.env.SMTP_SECURE !==
        "false",

      auth: {

        user:
          process.env.SMTP_USER,

        pass:
          process.env.SMTP_PASS
      }

    });

}


// ==================================================
// Rate Limit
// ==================================================

const authLimiter =
  rateLimit({

    windowMs:
      15 * 60 * 1000,

    limit:
      30,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      message:
        "試行回数が多すぎます。しばらく待ってから再試行してください。"
    }

  });


// ==================================================
// ユーティリティ
// ==================================================

function randomId(
  bytes = 18
) {

  return crypto
    .randomBytes(bytes)
    .toString("hex");

}


function createInviteCode() {

  return crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase();

}


function hashToken(
  token
) {

  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

}


function getUserById(
  id
) {

  return db.prepare(`
    SELECT
      id,
      email,
      name,
      created_at
    FROM users
    WHERE id = ?
  `).get(id);

}


function getUserFromRequest(
  req
) {

  if (
    !req.session ||
    !req.session.userId
  ) {

    return null;

  }

  return getUserById(
    req.session.userId
  );

}


function requireLogin(
  req,
  res,
  next
) {

  const user =
    getUserFromRequest(
      req
    );

  if (!user) {

    return res.status(401).json({
      message:
        "ログインしてください。"
    });

  }

  req.user =
    user;

  next();

}


// ==================================================
// 認証情報
// ==================================================

function normalizeName(
  value
) {

  return String(
    value || ""
  ).trim();

}


function normalizeEmail(
  value
) {

  return String(
    value || ""
  )
    .trim()
    .toLowerCase();

}


function validatePassword(
  password
) {

  return (
    typeof password ===
      "string" &&
    password.length >= 8 &&
    password.length <= 128
  );

}


function validateName(
  name
) {

  if (
    name.length < 1 ||
    name.length > 30
  ) {

    return false;

  }

  return true;

}


function validateEmail(
  email
) {

  if (
    email.length < 3 ||
    email.length > 254
  ) {

    return false;

  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);

}


// ==================================================
// 認証API
// ==================================================

app.post(
  "/api/register",
  authLimiter,
  async (req, res) => {

    try {

      const email =
        normalizeEmail(
          req.body.email
        );

      const password =
        req.body.password || "";

      const name =
        normalizeName(
          req.body.name
        );


      if (
        !validateEmail(email)
      ) {

        return res.status(400).json({
          message:
            "正しいメールアドレスを入力してください。"
        });

      }


      if (
        !validatePassword(
          password
        )
      ) {

        return res.status(400).json({
          message:
            "パスワードは8文字以上128文字以内で入力してください。"
        });

      }


      if (
        !validateName(name)
      ) {

        return res.status(400).json({
          message:
            "名前は1〜30文字で入力してください。"
        });

      }


      const duplicateEmail =
        db.prepare(`
          SELECT id
          FROM users
          WHERE email = ?
        `).get(email);

      if (duplicateEmail) {

        return res.status(409).json({
          message:
            "このメールアドレスはすでに登録されています。"
        });

      }


      const duplicateName =
        db.prepare(`
          SELECT id
          FROM users
          WHERE name = ? COLLATE NOCASE
        `).get(name);

      if (duplicateName) {

        return res.status(409).json({
          message:
            "その名前はすでに使用されています。別の名前を選んでください。"
        });

      }


      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );


      const now =
        Date.now();


      const result =
        db.prepare(`
          INSERT INTO users (
            email,
            password_hash,
            name,
            created_at
          )
          VALUES (
            ?,
            ?,
            ?,
            ?
          )
        `).run(
          email,
          passwordHash,
          name,
          now
        );


      req.session.userId =
        Number(
          result.lastInsertRowid
        );


      req.session.save(
        () => {

          return res.json({
            success:
              true,

            user: {
              id:
                Number(
                  result.lastInsertRowid
                ),

              name:
                name
            }
          });

        }
      );


    } catch (error) {

      console.error(
        "register error:",
        error
      );

      return res.status(500).json({
        message:
          "登録中にエラーが発生しました。"
      });

    }

  }
);


// ==================================================
// ログイン
// ==================================================

app.post(
  "/api/login",
  authLimiter,
  async (req, res) => {

    try {

      const name =
        normalizeName(
          req.body.name
        );

      const password =
        req.body.password || "";


      if (
        !name ||
        !password
      ) {

        return res.status(400).json({
          message:
            "名前とパスワードを入力してください。"
        });

      }


      const user =
        db.prepare(`
          SELECT *
          FROM users
          WHERE name = ? COLLATE NOCASE
        `).get(name);


      if (!user) {

        return res.status(401).json({
          message:
            "名前またはパスワードが正しくありません。"
        });

      }


      const valid =
        await bcrypt.compare(
          password,
          user.password_hash
        );


      if (!valid) {

        return res.status(401).json({
          message:
            "名前またはパスワードが正しくありません。"
        });

      }


      req.session.regenerate(
        (error) => {

          if (error) {

            console.error(
              error
            );

            return res.status(500).json({
              message:
                "ログインに失敗しました。"
            });

          }


          req.session.userId =
            user.id;


          req.session.save(
            (saveError) => {

              if (saveError) {

                console.error(
                  saveError
                );

                return res.status(500).json({
                  message:
                    "ログインに失敗しました。"
                });

              }


              return res.json({

                success:
                  true,

                user: {

                  id:
                    user.id,

                  name:
                    user.name
                }

              });

            }
          );

        }
      );


    } catch (error) {

      console.error(
        "login error:",
        error
      );

      return res.status(500).json({
        message:
          "ログイン中にエラーが発生しました。"
      });

    }

  }
);


// ==================================================
// 現在のログイン状態
// ==================================================

app.get(
  "/api/me",
  (req, res) => {

    const user =
      getUserFromRequest(
        req
      );


    if (!user) {

      return res.json({
        loggedIn:
          false
      });

    }


    return res.json({

      loggedIn:
        true,

      user: {

        id:
          user.id,

        name:
          user.name
      }

    });

  }
);


// ==================================================
// ログアウト
// ==================================================

app.post(
  "/api/logout",
  requireLogin,
  (req, res) => {

    req.session.destroy(
      (error) => {

        if (error) {

          console.error(
            error
          );

          return res.status(500).json({
            message:
              "ログアウトに失敗しました。"
          });

        }


        res.clearCookie(
          "connect.sid"
        );


        return res.json({
          success:
            true
        });

      }
    );

  }
);


// ==================================================
// パスワード再設定メール
// ==================================================

app.post(
  "/api/forgot-password",
  authLimiter,
  async (req, res) => {

    const email =
      normalizeEmail(
        req.body.email
      );


    // 存在するかどうかを外部に漏らさない
    const genericResponse = {
      success:
        true,

      message:
        "登録されているメールアドレスであれば、パスワード再設定メールを送信しました。"
    };


    if (
      !validateEmail(email)
    ) {

      return res.json(
        genericResponse
      );

    }


    const user =
      db.prepare(`
        SELECT *
        FROM users
        WHERE email = ?
      `).get(email);


    if (!user) {

      return res.json(
        genericResponse
      );

    }


    if (!transporter) {

      console.error(
        "SMTPが設定されていません。"
      );

      return res.status(500).json({
        message:
          "メール送信設定がまだ完了していません。"
      });

    }


    // 古い未使用トークンを無効化
    db.prepare(`
      UPDATE password_resets
      SET used = 1
      WHERE user_id = ?
        AND used = 0
    `).run(
      user.id
    );


    const token =
      randomId(32);

    const tokenHash =
      hashToken(token);

    const expiresAt =
      Date.now() +
      60 * 60 * 1000;


    db.prepare(`
      INSERT INTO password_resets (
        user_id,
        token_hash,
        expires_at,
        used,
        created_at
      )
      VALUES (
        ?,
        ?,
        ?,
        0,
        ?
      )
    `).run(
      user.id,
      tokenHash,
      expiresAt,
      Date.now()
    );


    const resetUrl =
      `${APP_URL}/reset-password.html?token=${encodeURIComponent(token)}`;


    try {

      await transporter.sendMail({

        from:
          process.env.MAIL_FROM ||
          process.env.SMTP_USER,

        to:
          user.email,

        subject:
          "Veylo パスワード再設定",

        text:
`Veyloのパスワード再設定を受け付けました。

以下のURLから新しいパスワードを設定してください。

${resetUrl}

このURLの有効期限は1時間です。

心当たりがない場合は、このメールを無視してください。`,

        html:
`
<div style="font-family: sans-serif; line-height: 1.7;">
  <h2>Veylo パスワード再設定</h2>

  <p>
    パスワード再設定のリクエストを受け付けました。
  </p>

  <p>
    以下のボタンから新しいパスワードを設定してください。
  </p>

  <p>
    <a
      href="${resetUrl}"
      style="
        display:inline-block;
        padding:12px 20px;
        background:#5865f2;
        color:#fff;
        text-decoration:none;
        border-radius:8px;
      "
    >
      パスワードを再設定する
    </a>
  </p>

  <p>
    このURLの有効期限は1時間です。
  </p>

  <p>
    心当たりがない場合は、このメールを無視してください。
  </p>
</div>
`

      });


      return res.json(
        genericResponse
      );


    } catch (error) {

      console.error(
        "mail error:",
        error
      );

      return res.status(500).json({
        message:
          "メールを送信できませんでした。"
      });

    }

  }
);


// ==================================================
// パスワード再設定
// ==================================================

app.post(
  "/api/reset-password",
  authLimiter,
  async (req, res) => {

    try {

      const token =
        String(
          req.body.token ||
          ""
        );

      const password =
        req.body.password ||
        "";


      if (
        !token ||
        !validatePassword(
          password
        )
      ) {

        return res.status(400).json({
          message:
            "有効なトークンと8文字以上のパスワードが必要です。"
        });

      }


      const tokenHash =
        hashToken(token);


      const reset =
        db.prepare(`
          SELECT *
          FROM password_resets
          WHERE token_hash = ?
            AND used = 0
            AND expires_at > ?
        `).get(
          tokenHash,
          Date.now()
        );


      if (!reset) {

        return res.status(400).json({
          message:
            "この再設定リンクは無効または期限切れです。"
        });

      }


      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );


      const transaction =
        db.transaction(
          () => {

            db.prepare(`
              UPDATE users
              SET password_hash = ?
              WHERE id = ?
            `).run(
              passwordHash,
              reset.user_id
            );


            db.prepare(`
              UPDATE password_resets
              SET used = 1
              WHERE id = ?
            `).run(
              reset.id
            );

          }
        );


      transaction();


      return res.json({
        success:
          true
      });


    } catch (error) {

      console.error(
        "reset password error:",
        error
      );

      return res.status(500).json({
        message:
          "パスワードを変更できませんでした。"
      });

    }

  }
);


// ==================================================
// ルーム権限
// ==================================================

function isRoomMember(
  roomId,
  userId
) {

  if (
    roomId ===
    CASUAL_ROOM_ID
  ) {

    return true;

  }


  return Boolean(
    db.prepare(`
      SELECT 1
      FROM room_members
      WHERE room_id = ?
        AND user_id = ?
    `).get(
      roomId,
      userId
    )
  );

}


function getRoom(
  roomId
) {

  return db.prepare(`
    SELECT *
    FROM rooms
    WHERE id = ?
  `).get(
    roomId
  );

}


// ==================================================
// ルーム作成
// ==================================================

function createRoom(
  userId,
  name
) {

  let inviteCode;
  let exists;

  do {

    inviteCode =
      createInviteCode();

    exists =
      db.prepare(`
        SELECT 1
        FROM rooms
        WHERE invite_code = ?
      `).get(
        inviteCode
      );

  } while (exists);


  const roomId =
    randomId(12);

  const now =
    Date.now();


  const transaction =
    db.transaction(
      () => {

        db.prepare(`
          INSERT INTO rooms (
            id,
            name,
            invite_code,
            owner_id,
            created_at
          )
          VALUES (
            ?,
            ?,
            ?,
            ?,
            ?
          )
        `).run(
          roomId,
          name,
          inviteCode,
          userId,
          now
        );


        db.prepare(`
          INSERT INTO room_members (
            room_id,
            user_id,
            joined_at
          )
          VALUES (
            ?,
            ?,
            ?
          )
        `).run(
          roomId,
          userId,
          now
        );

      }
    );


  transaction();


  return getRoom(
    roomId
  );

}


// ==================================================
// Socket.IO
// ==================================================

const io =
  new Server(
    server,
    {
      cors: {
        origin:
          true,

        credentials:
          true
      }
    }
  );


// Express sessionをSocket.IOでも使用
io.engine.use(
  sessionMiddleware
);


// ==================================================
// Socket認証
// ==================================================

io.use(
  (socket, next) => {

    const session =
      socket.request.session;


    if (
      !session ||
      !session.userId
    ) {

      return next(
        new Error(
          "UNAUTHORIZED"
        )
      );

    }


    const user =
      getUserById(
        session.userId
      );


    if (!user) {

      return next(
        new Error(
          "UNAUTHORIZED"
        )
      );

    }


    socket.user =
      user;


    next();

  }
);


// ==================================================
// 24時間以上のメッセージ削除
// ==================================================

function cleanupOldMessages() {

  const cutoff =
    Date.now() -
    24 * 60 * 60 * 1000;


  db.prepare(`
    DELETE FROM messages
    WHERE created_at < ?
  `).run(
    cutoff
  );

}


cleanupOldMessages();


setInterval(
  cleanupOldMessages,
  10 * 60 * 1000
);


// ==================================================
// メッセージ取得
// ==================================================

function getMessages(
  roomId
) {

  const cutoff =
    Date.now() -
    24 * 60 * 60 * 1000;


  return db.prepare(`
    SELECT
      id,
      room_id AS room,
      user_id AS userId,
      username,
      text,
      reply_to_id AS replyToId,
      reply_to_username AS replyToUsername,
      reply_to_text AS replyToText,
      created_at AS createdAt,
      edited
    FROM messages
    WHERE room_id = ?
      AND created_at >= ?
    ORDER BY created_at ASC
    LIMIT 1000
  `).all(
    roomId,
    cutoff
  );

}


// ==================================================
// Socket共通：部屋参加
// ==================================================

function joinRoomSocket(
  socket,
  roomId
) {

  socket.join(
    `room:${roomId}`
  );

}


// ==================================================
// Socket.IO 接続
// ==================================================

io.on(
  "connection",
  (socket) => {

    const user =
      socket.user;


    console.log(
      "Socket connected:",
      user.name,
      socket.id
    );


    // ==============================================
    // 初期雑談
    // ==============================================

    joinRoomSocket(
      socket,
      CASUAL_ROOM_ID
    );


    socket.emit(
      "previous messages",
      getMessages(
        CASUAL_ROOM_ID
      )
    );


    socket.emit(
      "casual joined"
    );


    // ==============================================
    // 雑談
    // ==============================================

    socket.on(
      "join casual",
      () => {

        for (
          const room of
          socket.rooms
        ) {

          if (
            room.startsWith(
              "room:"
            )
          ) {

            socket.leave(
              room
            );

          }

        }


        joinRoomSocket(
          socket,
          CASUAL_ROOM_ID
        );


        socket.emit(
          "previous messages",
          getMessages(
            CASUAL_ROOM_ID
          )
        );


        socket.emit(
          "casual joined"
        );

      }
    );


    // ==============================================
    // 部屋作成
    // ==============================================

    socket.on(
      "create room",
      (data) => {

        const name =
          String(
            data?.name ||
            ""
          ).trim();


        if (
          !name ||
          name.length > 50
        ) {

          return socket.emit(
            "message send error",
            {
              message:
                "部屋名は1〜50文字で入力してください。"
            }
          );

        }


        try {

          const room =
            createRoom(
              user.id,
              name
            );


          for (
            const currentRoom of
            socket.rooms
          ) {

            if (
              currentRoom.startsWith(
                "room:"
              )
            ) {

              socket.leave(
                currentRoom
              );

            }

          }


          joinRoomSocket(
            socket,
            room.id
          );


          socket.emit(
            "room created",
            {
              id:
                room.id,

              name:
                room.name,

              inviteCode:
                room.invite_code
            }
          );


          socket.emit(
            "previous messages",
            getMessages(
              room.id
            )
          );


        } catch (error) {

          console.error(
            error
          );

        }

      }
    );


    // ==============================================
    // 部屋参加
    // ==============================================

    socket.on(
      "join room",
      (data) => {

        const code =
          String(
            data?.code ||
            ""
          )
            .trim()
            .toUpperCase();


        if (!code) {

          return socket.emit(
            "join room error",
            {
              message:
                "招待コードを入力してください。"
            }
          );

        }


        const room =
          db.prepare(`
            SELECT *
            FROM rooms
            WHERE invite_code = ?
          `).get(
            code
          );


        if (!room) {

          return socket.emit(
            "join room error",
            {
              message:
                "招待コードが見つかりません。"
            }
          );

        }


        db.prepare(`
          INSERT OR IGNORE INTO room_members (
            room_id,
            user_id,
            joined_at
          )
          VALUES (
            ?,
            ?,
            ?
          )
        `).run(
          room.id,
          user.id,
          Date.now()
        );


        for (
          const currentRoom of
          socket.rooms
        ) {

          if (
            currentRoom.startsWith(
              "room:"
            )
          ) {

            socket.leave(
              currentRoom
            );

          }

        }


        joinRoomSocket(
          socket,
          room.id
        );


        socket.emit(
          "room joined",
          {
            id:
              room.id,

            name:
              room.name,

            inviteCode:
              room.invite_code
          }
        );


        socket.emit(
          "previous messages",
          getMessages(
            room.id
          )
        );

      }
    );


    // ==============================================
    // メッセージ送信
    // ==============================================

    socket.on(
      "chat message",
      (data) => {

        try {

          const roomId =
            String(
              data?.room ||
              ""
            );


          const text =
            String(
              data?.text ||
              ""
            ).trim();


          if (
            !roomId ||
            !text
          ) {

            return;

          }


          if (
            text.length > 2000
          ) {

            return socket.emit(
              "message send error",
              {
                message:
                  "メッセージは2000文字以内で入力してください。"
              }
            );

          }


          if (
            !isRoomMember(
              roomId,
              user.id
            )
          ) {

            return socket.emit(
              "message send error",
              {
                message:
                  "この部屋には参加していません。"
              }
            );

          }


          let replyToId =
            null;

          let replyToUsername =
            null;

          let replyToText =
            null;


          if (
            data?.replyToId
          ) {

            const reply =
              db.prepare(`
                SELECT
                  id,
                  username,
                  text
                FROM messages
                WHERE id = ?
                  AND room_id = ?
              `).get(
                String(
                  data.replyToId
                ),
                roomId
              );


            if (reply) {

              replyToId =
                reply.id;

              replyToUsername =
                reply.username;

              replyToText =
                reply.text;

            }

          }


          const id =
            randomId();


          const createdAt =
            Date.now();


          db.prepare(`
            INSERT INTO messages (
              id,
              room_id,
              user_id,
              username,
              text,
              reply_to_id,
              reply_to_username,
              reply_to_text,
              created_at,
              edited
            )
            VALUES (
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              0
            )
          `).run(
            id,
            roomId,
            user.id,
            user.name,
            text,
            replyToId,
            replyToUsername,
            replyToText,
            createdAt
          );


          const message = {

            id,

            room:
              roomId,

            userId:
              user.id,

            username:
              user.name,

            text,

            replyToId,

            replyToUsername,

            replyToText,

            createdAt,

            edited:
              0
          };


          io.to(
            `room:${roomId}`
          ).emit(
            "chat message",
            message
          );


        } catch (error) {

          console.error(
            "chat error:",
            error
          );

        }

      }
    );


    // ==============================================
    // 編集
    // ==============================================

    socket.on(
      "edit message",
      (data) => {

        try {

          const id =
            String(
              data?.id ||
              ""
            );

          const text =
            String(
              data?.text ||
              ""
            ).trim();


          if (
            !id ||
            !text ||
            text.length > 2000
          ) {

            return socket.emit(
              "message edit error",
              {
                message:
                  "メッセージが正しくありません。"
              }
            );

          }


          const message =
            db.prepare(`
              SELECT *
              FROM messages
              WHERE id = ?
            `).get(
              id
            );


          if (!message) {

            return socket.emit(
              "message edit error",
              {
                message:
                  "メッセージが見つかりません。"
              }
            );

          }


          // 名前ではなくIDで本人確認
          if (
            message.user_id !==
            user.id
          ) {

            return socket.emit(
              "message edit error",
              {
                message:
                  "自分のメッセージだけ編集できます。"
              }
            );

          }


          db.prepare(`
            UPDATE messages
            SET
              text = ?,
              edited = 1
            WHERE id = ?
          `).run(
            text,
            id
          );


          const updated =
            db.prepare(`
              SELECT
                id,
                room_id AS room,
                user_id AS userId,
                username,
                text,
                reply_to_id AS replyToId,
                reply_to_username AS replyToUsername,
                reply_to_text AS replyToText,
                created_at AS createdAt,
                edited
              FROM messages
              WHERE id = ?
            `).get(
              id
            );


          io.to(
            `room:${updated.room}`
          ).emit(
            "message edited",
            updated
          );


        } catch (error) {

          console.error(
            "edit error:",
            error
          );

        }

      }
    );


    // ==============================================
    // 削除
    // ==============================================

    socket.on(
      "delete message",
      (data) => {

        try {

          const id =
            String(
              data?.id ||
              ""
            );


          const message =
            db.prepare(`
              SELECT *
              FROM messages
              WHERE id = ?
            `).get(
              id
            );


          if (!message) {

            return socket.emit(
              "message delete error",
              {
                message:
                  "メッセージが見つかりません。"
              }
            );

          }


          if (
            message.user_id !==
            user.id
          ) {

            return socket.emit(
              "message delete error",
              {
                message:
                  "自分のメッセージだけ削除できます。"
              }
            );

          }


          db.prepare(`
            DELETE FROM messages
            WHERE id = ?
          `).run(
            id
          );


          io.to(
            `room:${message.room_id}`
          ).emit(
            "message deleted",
            {
              id:
                id,

              room:
                message.room_id
            }
          );


        } catch (error) {

          console.error(
            "delete error:",
            error
          );

        }

      }
    );


    // ==============================================
    // 切断
    // ==============================================

    socket.on(
      "disconnect",
      () => {

        console.log(
          "Socket disconnected:",
          user.name,
          socket.id
        );

      }
    );

  }
);


// ==================================================
// API: ログイン済みユーザー情報
// ==================================================

app.get(
  "/api/user",
  requireLogin,
  (req, res) => {

    res.json({
      id:
        req.user.id,

      name:
        req.user.name
    });

  }
);


// ==================================================
// 静的ファイル
// ==================================================

app.use(
  express.static(
    path.join(
      __dirname,
      "public"
    )
  )
);


// ==================================================
// 起動
// ==================================================

server.listen(
  PORT,
  () => {

    console.log(
      `Veylo running at ${APP_URL}`
    );

  }
);

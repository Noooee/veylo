"use strict";


// ==================================================
// Veylo Server
// ==================================================

const express =
  require("express");

const http =
  require("http");

const path =
  require("path");

const crypto =
  require("crypto");

const bcrypt =
  require("bcryptjs");

const session =
  require("express-session");

const pgSession =
  require("connect-pg-simple")(
    session
  );

const { Pool } =
  require("pg");

const { Server } =
  require("socket.io");

const nodemailer =
  require("nodemailer");


// ==================================================
// 環境変数
// ==================================================

const PORT =
  process.env.PORT || 10000;

const DATABASE_URL =
  process.env.DATABASE_URL;

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "veylo-development-secret";


// ==================================================
// Express
// ==================================================

const app =
  express();


if (
  process.env.NODE_ENV === "production"
) {

  app.set(
    "trust proxy",
    1
  );

}


const server =
  http.createServer(
    app
  );


// ==================================================
// PostgreSQL
// ==================================================

if (!DATABASE_URL) {

  console.error(
    "DATABASE_URL が設定されていません。"
  );

  process.exit(1);

}


const pool =
  new Pool({

    connectionString:
      DATABASE_URL,

    ssl:
      process.env.NODE_ENV === "production"
        ? {
            rejectUnauthorized: false
          }
        : false

  });


// ==================================================
// Middleware
// ==================================================

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(
  express.urlencoded({
    extended: true
  })
);


// ==================================================
// Session
// ==================================================

const sessionMiddleware =
  session({

    store:
      new pgSession({

        pool:
          pool,

        tableName:
          "user_sessions",

        createTableIfMissing:
          true

      }),

    secret:
      SESSION_SECRET,

    resave:
      false,

    saveUninitialized:
      false,

    proxy:
      process.env.NODE_ENV === "production",

    cookie: {

      httpOnly:
        true,

      secure:
        process.env.NODE_ENV === "production",

      sameSite:
        "lax",

      maxAge:
        1000 *
        60 *
        60 *
        24 *
        30

    }

  });


app.use(
  sessionMiddleware
);


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


io.engine.use(
  sessionMiddleware
);


// ==================================================
// Static
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
// DB 初期化
// ==================================================

async function initDatabase() {

  console.log(
    "データベースを初期化しています..."
  );


  // ==================================================
  // Users
  // ==================================================

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);


  /*
   * 以前のVeyloではemail UNIQUEだったため、
   * 同じメールアドレスで複数アカウントを
   * 作成できませんでした。
   *
   * 今回はメールアドレスのUNIQUE制約を削除します。
   */


  await pool.query(`
    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_email_key
  `);


  // ==================================================
  // Rooms
  // ==================================================

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      invite_code TEXT NOT NULL UNIQUE,
      owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);


  // ==================================================
  // Room Members
  // ==================================================

  await pool.query(`
    CREATE TABLE IF NOT EXISTS room_members (
      room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (room_id, user_id)
    )
  `);


  await pool.query(`
    CREATE INDEX IF NOT EXISTS room_members_user_idx
    ON room_members(user_id)
  `);


  await pool.query(`
    CREATE INDEX IF NOT EXISTS room_members_room_idx
    ON room_members(room_id)
  `);


  // ==================================================
  // Messages
  // ==================================================

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id BIGSERIAL PRIMARY KEY,
      room TEXT NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      username TEXT NOT NULL,
      text TEXT NOT NULL,
      reply_to_id BIGINT NULL,
      reply_to_username TEXT NULL,
      reply_to_text TEXT NULL,
      edited BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);


  await pool.query(`
    ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS reply_to_id BIGINT NULL
  `);


  await pool.query(`
    ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS reply_to_username TEXT NULL
  `);


  await pool.query(`
    ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS reply_to_text TEXT NULL
  `);


  await pool.query(`
    ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS edited BOOLEAN NOT NULL DEFAULT FALSE
  `);


  await pool.query(`
    CREATE INDEX IF NOT EXISTS messages_room_created_idx
    ON messages(room, created_at)
  `);


  // ==================================================
  // Password Reset
  // ==================================================

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);


  await pool.query(`
    CREATE INDEX IF NOT EXISTS password_reset_token_hash_idx
    ON password_reset_tokens(token_hash)
  `);


  // ==================================================
  // 既存の部屋を作ったユーザーを
  // room_membersにも追加
  // ==================================================

  await pool.query(`
    INSERT INTO room_members (
      room_id,
      user_id
    )
    SELECT
      id,
      owner_id
    FROM rooms
    WHERE owner_id IS NOT NULL
    ON CONFLICT (
      room_id,
      user_id
    )
    DO NOTHING
  `);


  console.log(
    "データベースの準備が完了しました。"
  );

}


// ==================================================
// 共通関数
// ==================================================

function normalizeEmail(
  email
) {

  return String(
    email || ""
  )
    .trim()
    .toLowerCase();

}


function normalizeName(
  name
) {

  return String(
    name || ""
  )
    .trim();

}


function generateRoomId() {

  return (
    "room_" +
    crypto
      .randomBytes(8)
      .toString("hex")
  );

}


function generateInviteCode() {

  return crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase();

}


function generateResetToken() {

  return crypto
    .randomBytes(32)
    .toString("hex");

}


function hashToken(
  token
) {

  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

}


function sanitizeUser(
  user
) {

  if (!user) {
    return null;
  }


  return {

    id:
      user.id,

    email:
      user.email,

    name:
      user.name

  };

}


function formatRoom(
  room
) {

  return {

    id:
      room.id,

    name:
      room.name,

    inviteCode:
      room.invite_code,

    ownerId:
      room.owner_id

  };

}


// ==================================================
// 認証 Middleware
// ==================================================

function requireLogin(
  req,
  res,
  next
) {

  if (!req.session.userId) {

    return res
      .status(401)
      .json({

        message:
          "ログインしてください。"

      });

  }


  next();

}


// ==================================================
// /api/me
// ==================================================

app.get(
  "/api/me",
  async (req, res) => {

    try {

      if (!req.session.userId) {

        return res.json({

          loggedIn:
            false

        });

      }


      const result =
        await pool.query(
          `
          SELECT
            id,
            email,
            name
          FROM users
          WHERE id = $1
          `,
          [
            req.session.userId
          ]
        );


      if (
        result.rows.length === 0
      ) {

        req.session.destroy(
          () => {}
        );

        return res.json({

          loggedIn:
            false

        });

      }


      return res.json({

        loggedIn:
          true,

        user:
          sanitizeUser(
            result.rows[0]
          )

      });

    } catch (error) {

      console.error(
        "/api/me error:",
        error
      );

      return res
        .status(500)
        .json({

          message:
            "ログイン状態を確認できませんでした。"

        });

    }

  }
);


// ==================================================
// 自分の部屋一覧
// ==================================================

app.get(
  "/api/rooms",
  requireLogin,
  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT
            r.id,
            r.name,
            r.invite_code,
            r.owner_id,
            r.created_at
          FROM rooms r
          INNER JOIN room_members rm
            ON rm.room_id = r.id
          WHERE rm.user_id = $1
          ORDER BY
            r.created_at ASC
          `,
          [
            req.session.userId
          ]
        );


      return res.json({

        rooms:
          result.rows.map(
            formatRoom
          )

      });

    } catch (error) {

      console.error(
        "/api/rooms error:",
        error
      );

      return res
        .status(500)
        .json({

          message:
            "部屋一覧を取得できませんでした。"

        });

    }

  }
);


// ==================================================
// 登録
// ==================================================

app.post(
  "/api/register",
  async (req, res) => {

    try {

      const email =
        normalizeEmail(
          req.body.email
        );

      const name =
        normalizeName(
          req.body.name
        );

      const password =
        String(
          req.body.password || ""
        );


      if (!email) {

        return res
          .status(400)
          .json({

            message:
              "メールアドレスを入力してください。"

          });

      }


      if (!name) {

        return res
          .status(400)
          .json({

            message:
              "名前を入力してください。"

          });

      }


      if (password.length < 8) {

        return res
          .status(400)
          .json({

            message:
              "パスワードは8文字以上にしてください。"

          });

      }


      /*
       * 同じメールアドレスは最大5アカウント
       */

      const emailCountResult =
        await pool.query(
          `
          SELECT COUNT(*)::integer AS count
          FROM users
          WHERE email = $1
          `,
          [
            email
          ]
        );


      const emailCount =
        Number(
          emailCountResult.rows[0].count
        );


      if (
        emailCount >= 5
      ) {

        return res
          .status(409)
          .json({

            code:
              "EMAIL_ACCOUNT_LIMIT",

            message:
              "このメールアドレスでは5個までアカウントを作成できます。新しいアカウントを作る場合は、既存のアカウントを削除してください。"

          });

      }


      /*
       * 同じ名前のログイン事故を防ぐため、
       * 名前は全体で重複させない。
       */

      const nameExists =
        await pool.query(
          `
          SELECT id
          FROM users
          WHERE name = $1
          LIMIT 1
          `,
          [
            name
          ]
        );


      if (
        nameExists.rows.length > 0
      ) {

        return res
          .status(409)
          .json({

            message:
              "この名前は既に使用されています。別の名前を入力してください。"

          });

      }


      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );


      const result =
        await pool.query(
          `
          INSERT INTO users (
            email,
            name,
            password_hash
          )
          VALUES (
            $1,
            $2,
            $3
          )
          RETURNING
            id,
            email,
            name
          `,
          [
            email,
            name,
            passwordHash
          ]
        );


      const user =
        result.rows[0];


      req.session.userId =
        user.id;


      req.session.save(
        (error) => {

          if (error) {

            console.error(
              "register session save error:",
              error
            );

            return res
              .status(500)
              .json({

                message:
                  "ログインセッションの保存に失敗しました。"

              });

          }


          return res.json({

            user:
              sanitizeUser(
                user
              )

          });

        }
      );

    } catch (error) {

      console.error(
        "/api/register error:",
        error
      );


      /*
       * PostgreSQL側で予期せぬUNIQUEエラーが
       * 発生した場合にも分かりやすく返す。
       */

      if (
        error &&
        error.code === "23505"
      ) {

        return res
          .status(409)
          .json({

            message:
              "この情報は既に使用されています。"

          });

      }


      return res
        .status(500)
        .json({

          message:
            "登録に失敗しました。"

        });

    }

  }
);


// ==================================================
// ログイン
// ==================================================

app.post(
  "/api/login",
  async (req, res) => {

    try {

      const name =
        normalizeName(
          req.body.name
        );

      const password =
        String(
          req.body.password || ""
        );


      if (!name || !password) {

        return res
          .status(400)
          .json({

            message:
              "名前とパスワードを入力してください。"

          });

      }


      const result =
        await pool.query(
          `
          SELECT
            id,
            email,
            name,
            password_hash
          FROM users
          WHERE name = $1
          LIMIT 1
          `,
          [
            name
          ]
        );


      if (
        result.rows.length === 0
      ) {

        return res
          .status(401)
          .json({

            message:
              "名前またはパスワードが正しくありません。"

          });

      }


      const user =
        result.rows[0];


      const valid =
        await bcrypt.compare(
          password,
          user.password_hash
        );


      if (!valid) {

        return res
          .status(401)
          .json({

            message:
              "名前またはパスワードが正しくありません。"

          });

      }


      req.session.regenerate(
        (error) => {

          if (error) {

            console.error(
              "session regenerate error:",
              error
            );

            return res
              .status(500)
              .json({

                message:
                  "ログインセッションの作成に失敗しました。"

              });

          }


          req.session.userId =
            user.id;


          req.session.save(
            (saveError) => {

              if (saveError) {

                console.error(
                  "session save error:",
                  saveError
                );

                return res
                  .status(500)
                  .json({

                    message:
                      "ログインセッションの保存に失敗しました。"

                  });

              }


              console.log(
                "Login successful:",
                user.name,
                "userId:",
                user.id
              );


              return res.json({

                user:
                  sanitizeUser(
                    user
                  )

              });

            }
          );

        }
      );

    } catch (error) {

      console.error(
        "/api/login error:",
        error
      );

      return res
        .status(500)
        .json({

          message:
            "ログインに失敗しました。"

        });

    }

  }
);


// ==================================================
// ログアウト
// ==================================================

app.post(
  "/api/logout",
  (req, res) => {

    req.session.destroy(
      (error) => {

        if (error) {

          console.error(
            "/api/logout error:",
            error
          );

          return res
            .status(500)
            .json({

              message:
                "ログアウトに失敗しました。"

              });

        }


        res.clearCookie(
          "connect.sid",
          {

            httpOnly:
              true,

            secure:
              process.env.NODE_ENV === "production",

            sameSite:
              "lax"

          }
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
// アカウント削除
// ==================================================

app.delete(
  "/api/account",
  requireLogin,
  async (req, res) => {

    try {

      const userId =
        Number(
          req.session.userId
        );


      const result =
        await pool.query(
          `
          DELETE FROM users
          WHERE id = $1
          RETURNING id
          `,
          [
            userId
          ]
        );


      if (
        result.rows.length === 0
      ) {

        return res
          .status(404)
          .json({

            message:
              "アカウントが見つかりません。"

          });

      }


      req.session.destroy(
        (error) => {

          if (error) {

            console.error(
              "account session destroy error:",
              error
            );

          }


          res.clearCookie(
            "connect.sid",
            {

              httpOnly:
                true,

              secure:
                process.env.NODE_ENV === "production",

              sameSite:
                "lax"

            }
          );


          return res.json({

            success:
              true,

            message:
              "アカウントを削除しました。"

          });

        }
      );

    } catch (error) {

      console.error(
        "/api/account error:",
        error
      );

      return res
        .status(500)
        .json({

          message:
            "アカウントを削除できませんでした。"

        });

    }

  }
);


// ==================================================
// パスワードリセット
// ==================================================

app.post(
  "/api/forgot-password",
  async (req, res) => {

    try {

      const email =
        normalizeEmail(
          req.body.email
        );


      if (!email) {

        return res
          .status(400)
          .json({

            message:
              "メールアドレスを入力してください。"

          });

      }


      const result =
        await pool.query(
          `
          SELECT
            id,
            email,
            name
          FROM users
          WHERE email = $1
          ORDER BY id DESC
          LIMIT 1
          `,
          [
            email
          ]
        );


      if (
        result.rows.length === 0
      ) {

        return res.json({

          message:
            "パスワード再設定の案内を送信しました。"

        });

      }


      const user =
        result.rows[0];


      await pool.query(
        `
        UPDATE password_reset_tokens
        SET used = TRUE
        WHERE user_id = $1
          AND used = FALSE
        `,
        [
          user.id
        ]
      );


      const token =
        generateResetToken();

      const tokenHash =
        hashToken(
          token
        );


      await pool.query(
        `
        INSERT INTO password_reset_tokens (
          user_id,
          token_hash,
          expires_at
        )
        VALUES (
          $1,
          $2,
          NOW() + INTERVAL '30 minutes'
        )
        `,
        [
          user.id,
          tokenHash
        ]
      );


      const baseUrl =
        process.env.BASE_URL ||
        `http://localhost:${PORT}`;


      const resetUrl =
        `${baseUrl}/reset-password.html?token=${token}`;


      console.log(
        "=========================================="
      );

      console.log(
        "PASSWORD RESET URL"
      );

      console.log(
        resetUrl
      );

      console.log(
        "=========================================="
      );


      if (
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      ) {

        const transporter =
          nodemailer.createTransport({

            host:
              process.env.SMTP_HOST,

            port:
              Number(
                process.env.SMTP_PORT ||
                587
              ),

            secure:
              String(
                process.env.SMTP_SECURE
              ) === "true",

            auth: {

              user:
                process.env.SMTP_USER,

              pass:
                process.env.SMTP_PASS

            }

          });


        await transporter.sendMail({

          from:
            process.env.MAIL_FROM ||
            process.env.SMTP_USER,

          to:
            user.email,

          subject:
            "Veylo パスワード再設定",

          text:
            [
              `${user.name}さん`,
              "",
              "Veyloのパスワード再設定を受け付けました。",
              "",
              "以下のリンクから新しいパスワードを設定してください。",
              "",
              resetUrl,
              "",
              "このリンクは30分間有効です。"
            ].join("\n")

        });

      }


      return res.json({

        message:
          "パスワード再設定の案内を送信しました。"

      });

    } catch (error) {

      console.error(
        "/api/forgot-password error:",
        error
      );

      return res
        .status(500)
        .json({

          message:
            "パスワード再設定の処理に失敗しました。"

        });

    }

  }
);


// ==================================================
// パスワード再設定API
// ==================================================

app.post(
  "/api/reset-password",
  async (req, res) => {

    try {

      const token =
        String(
          req.body.token || ""
        ).trim();

      const password =
        String(
          req.body.password || ""
        );


      if (!token) {

        return res
          .status(400)
          .json({

            message:
              "リセットトークンがありません。"

          });

      }


      if (password.length < 8) {

        return res
          .status(400)
          .json({

            message:
              "パスワードは8文字以上にしてください。"

          });

      }


      const tokenHash =
        hashToken(
          token
        );


      const result =
        await pool.query(
          `
          SELECT
            id,
            user_id
          FROM password_reset_tokens
          WHERE token_hash = $1
            AND used = FALSE
            AND expires_at > NOW()
          LIMIT 1
          `,
          [
            tokenHash
          ]
        );


      if (
        result.rows.length === 0
      ) {

        return res
          .status(400)
          .json({

            message:
              "このリセットリンクは無効または期限切れです。"

          });

      }


      const resetToken =
        result.rows[0];


      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );


      await pool.query(
        `
        UPDATE users
        SET password_hash = $1
        WHERE id = $2
        `,
        [
          passwordHash,
          resetToken.user_id
        ]
      );


      await pool.query(
        `
        UPDATE password_reset_tokens
        SET used = TRUE
        WHERE id = $1
        `,
        [
          resetToken.id
        ]
      );


      return res.json({

        success:
          true,

        message:
          "パスワードを変更しました。"

      });

    } catch (error) {

      console.error(
        "/api/reset-password error:",
        error
      );

      return res
        .status(500)
        .json({

          message:
            "パスワードの変更に失敗しました。"

        });

    }

  }
);


// ==================================================
// Socket.IO 認証
// ==================================================

io.use(
  (socket, next) => {

    const currentSession =
      socket.request.session;


    if (
      !currentSession ||
      !currentSession.userId
    ) {

      return next(
        new Error(
          "UNAUTHORIZED"
        )
      );

    }


    const userId =
      Number(
        currentSession.userId
      );


    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {

      return next(
        new Error(
          "UNAUTHORIZED"
        )
      );

    }


    socket.userId =
      userId;


    next();

  }
);


// ==================================================
// Socket.IO
// ==================================================

io.on(
  "connection",
  async (socket) => {

    console.log(
      "Socket connected:",
      socket.id,
      "user:",
      socket.userId
    );


    let userResult;


    try {

      userResult =
        await pool.query(
          `
          SELECT
            id,
            email,
            name
          FROM users
          WHERE id = $1
          `,
          [
            socket.userId
          ]
        );

    } catch (error) {

      console.error(
        "Socket user query error:",
        error
      );

      socket.disconnect();

      return;

    }


    if (
      userResult.rows.length === 0
    ) {

      socket.disconnect();

      return;

    }


    const user =
      userResult.rows[0];


    // ==================================================
    // 接続直後は雑談
    // ==================================================

    await joinCasual(
      socket
    );


    // ==================================================
    // 雑談
    // ==================================================

    socket.on(
      "join casual",
      async () => {

        await joinCasual(
          socket
        );

      }
    );


    // ==================================================
    // 自分の部屋一覧
    // ==================================================

    socket.on(
      "get my rooms",
      async () => {

        await sendMyRooms(
          socket,
          user.id
        );

      }
    );


    // ==================================================
    // メッセージ送信
    // ==================================================

    socket.on(
      "chat message",
      async (data) => {

        try {

          const room =
            String(
              data?.room || ""
            ).trim();

          const text =
            String(
              data?.text || ""
            ).trim();


          if (!room || !text) {

            return;

          }


          if (
            text.length > 5000
          ) {

            socket.emit(
              "message send error",
              {

                message:
                  "メッセージが長すぎます。"

              }
            );

            return;

          }


          const socketRooms =
            Array.from(
              socket.rooms
            );


          if (
            !socketRooms.includes(
              room
            )
          ) {

            socket.emit(
              "message send error",
              {

                message:
                  "この部屋には参加していません。"

              }
            );

            return;

          }


          /*
           * 雑談以外はDB上のメンバーかも確認
           */

          if (
            room !== "casual"
          ) {

            const membership =
              await pool.query(
                `
                SELECT 1
                FROM room_members
                WHERE room_id = $1
                  AND user_id = $2
                LIMIT 1
                `,
                [
                  room,
                  user.id
                ]
              );


            if (
              membership.rows.length === 0
            ) {

              socket.emit(
                "message send error",
                {

                  message:
                    "この部屋には参加していません。"

                }
              );

              return;

            }

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

            const replyResult =
              await pool.query(
                `
                SELECT
                  id,
                  username,
                  text
                FROM messages
                WHERE id = $1
                LIMIT 1
                `,
                [
                  data.replyToId
                ]
              );


            if (
              replyResult.rows.length > 0
            ) {

              const reply =
                replyResult.rows[0];


              replyToId =
                reply.id;

              replyToUsername =
                reply.username;

              replyToText =
                reply.text;

            }

          }


          const result =
            await pool.query(
              `
              INSERT INTO messages (
                room,
                user_id,
                username,
                text,
                reply_to_id,
                reply_to_username,
                reply_to_text
              )
              VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7
              )
              RETURNING
                id,
                room,
                user_id,
                username,
                text,
                reply_to_id,
                reply_to_username,
                reply_to_text,
                edited,
                created_at
              `,
              [
                room,
                user.id,
                user.name,
                text,
                replyToId,
                replyToUsername,
                replyToText
              ]
            );


          const message =
            formatMessage(
              result.rows[0]
            );


          io
            .to(room)
            .emit(
              "chat message",
              message
            );


        } catch (error) {

          console.error(
            "chat message error:",
            error
          );


          socket.emit(
            "message send error",
            {

              message:
                "メッセージを送信できませんでした。"

            }
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

          const name =
            String(
              data?.name || ""
            ).trim();


          if (!name) {

            socket.emit(
              "create room error",
              {

                message:
                  "部屋の名前を入力してください。"

              }
            );

            return;

          }


          if (
            name.length > 100
          ) {

            socket.emit(
              "create room error",
              {

                message:
                  "部屋の名前は100文字以内にしてください。"

              }
            );

            return;

          }


          const id =
            generateRoomId();


          let inviteCode =
            generateInviteCode();


          /*
           * 招待コードが重複しないようにする
           */

          for (;;) {

            const exists =
              await pool.query(
                `
                SELECT id
                FROM rooms
                WHERE invite_code = $1
                LIMIT 1
                `,
                [
                  inviteCode
                ]
              );


            if (
              exists.rows.length === 0
            ) {

              break;

            }


            inviteCode =
              generateInviteCode();

          }


          /*
           * 部屋作成とメンバー追加を
           * トランザクションで実行
           */

          const client =
            await pool.connect();


          try {

            await client.query(
              "BEGIN"
            );


            const roomResult =
              await client.query(
                `
                INSERT INTO rooms (
                  id,
                  name,
                  invite_code,
                  owner_id
                )
                VALUES (
                  $1,
                  $2,
                  $3,
                  $4
                )
                RETURNING
                  id,
                  name,
                  invite_code,
                  owner_id
                `,
                [
                  id,
                  name,
                  inviteCode,
                  user.id
                ]
              );


            const room =
              roomResult.rows[0];


            await client.query(
              `
              INSERT INTO room_members (
                room_id,
                user_id
              )
              VALUES (
                $1,
                $2
              )
              ON CONFLICT (
                room_id,
                user_id
              )
              DO NOTHING
              `,
              [
                room.id,
                user.id
              ]
            );


            await client.query(
              "COMMIT"
            );


            /*
             * 現在の部屋から移動
             */

            leaveCurrentRooms(
              socket
            );


            await socket.join(
              room.id
            );


            socket.emit(
              "room created",
              formatRoom(
                room
              )
            );


            await sendPreviousMessages(
              socket,
              room.id
            );


            await sendMyRooms(
              socket,
              user.id
            );


            console.log(
              "Room created:",
              room.id,
              room.name,
              "by user:",
              user.id
            );

          } catch (transactionError) {

            await client.query(
              "ROLLBACK"
            );

            throw transactionError;

          } finally {

            client.release();

          }

        } catch (error) {

          console.error(
            "create room error:",
            error
          );


          socket.emit(
            "create room error",
            {

              message:
                "部屋を作成できませんでした。もう一度お試しください。"

            }
          );

        }

      }
    );


    // ==================================================
    // 部屋参加
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


          const result =
            await pool.query(
              `
              SELECT
                id,
                name,
                invite_code,
                owner_id
              FROM rooms
              WHERE invite_code = $1
              LIMIT 1
              `,
              [
                code
              ]
            );


          if (
            result.rows.length === 0
          ) {

            socket.emit(
              "join room error",
              {

                message:
                  "部屋が見つかりません。"

              }
            );

            return;

          }


          const room =
            result.rows[0];


          /*
           * メンバーとして登録
           */

          await pool.query(
            `
            INSERT INTO room_members (
              room_id,
              user_id
            )
            VALUES (
              $1,
              $2
            )
            ON CONFLICT (
              room_id,
              user_id
            )
            DO NOTHING
            `,
            [
              room.id,
              user.id
            ]
          );


          leaveCurrentRooms(
            socket
          );


          await socket.join(
            room.id
          );


          socket.emit(
            "room joined",
            formatRoom(
              room
            )
          );


          await sendPreviousMessages(
            socket,
            room.id
          );


          await sendMyRooms(
            socket,
            user.id
          );


          console.log(
            "Room joined:",
            room.id,
            "user:",
            user.id
          );

        } catch (error) {

          console.error(
            "join room error:",
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
    // 既存部屋へ移動
    // ==================================================

    socket.on(
      "open my room",
      async (data) => {

        try {

          const roomId =
            String(
              data?.roomId || ""
            ).trim();


          if (!roomId) {

            return;

          }


          const result =
            await pool.query(
              `
              SELECT
                r.id,
                r.name,
                r.invite_code,
                r.owner_id
              FROM rooms r
              INNER JOIN room_members rm
                ON rm.room_id = r.id
              WHERE r.id = $1
                AND rm.user_id = $2
              LIMIT 1
              `,
              [
                roomId,
                user.id
              ]
            );


          if (
            result.rows.length === 0
          ) {

            socket.emit(
              "room open error",
              {

                message:
                  "この部屋には参加していません。"

              }
            );

            await sendMyRooms(
              socket,
              user.id
            );

            return;

          }


          const room =
            result.rows[0];


          leaveCurrentRooms(
            socket
          );


          await socket.join(
            room.id
          );


          socket.emit(
            "room opened",
            formatRoom(
              room
            )
          );


          await sendPreviousMessages(
            socket,
            room.id
          );

        } catch (error) {

          console.error(
            "open my room error:",
            error
          );


          socket.emit(
            "room open error",
            {

              message:
                "部屋を開けませんでした。"

            }
          );

        }

      }
    );


    // ==================================================
    // 編集
    // ==================================================

    socket.on(
      "edit message",
      async (data) => {

        try {

          const id =
            Number(
              data?.id
            );

          const text =
            String(
              data?.text || ""
            ).trim();


          if (
            !Number.isInteger(id) ||
            !text
          ) {

            return;

          }


          if (
            text.length > 5000
          ) {

            socket.emit(
              "message edit error",
              {

                message:
                  "メッセージが長すぎます。"

              }
            );

            return;

          }


          const result =
            await pool.query(
              `
              UPDATE messages
              SET
                text = $1,
                edited = TRUE
              WHERE id = $2
                AND user_id = $3
              RETURNING
                id,
                room,
                user_id,
                username,
                text,
                reply_to_id,
                reply_to_username,
                reply_to_text,
                edited,
                created_at
              `,
              [
                text,
                id,
                user.id
              ]
            );


          if (
            result.rows.length === 0
          ) {

            socket.emit(
              "message edit error",
              {

                message:
                  "このコメントを編集できません。"

              }
            );

            return;

          }


          const message =
            formatMessage(
              result.rows[0]
            );


          io
            .to(message.room)
            .emit(
              "message edited",
              message
            );


        } catch (error) {

          console.error(
            "edit message error:",
            error
          );


          socket.emit(
            "message edit error",
            {

              message:
                "コメントを編集できませんでした。"

            }
          );

        }

      }
    );


    // ==================================================
    // 削除
    // ==================================================

    socket.on(
      "delete message",
      async (data) => {

        try {

          const id =
            Number(
              data?.id
            );


          if (
            !Number.isInteger(id)
          ) {

            return;

          }


          const result =
            await pool.query(
              `
              DELETE FROM messages
              WHERE id = $1
                AND user_id = $2
              RETURNING
                id,
                room
              `,
              [
                id,
                user.id
              ]
            );


          if (
            result.rows.length === 0
          ) {

            socket.emit(
              "message delete error",
              {

                message:
                  "このコメントを削除できません。"

              }
            );

            return;

          }


          const message =
            result.rows[0];


          io
            .to(message.room)
            .emit(
              "message deleted",
              {

                id:
                  message.id,

                room:
                  message.room

              }
            );


        } catch (error) {

          console.error(
            "delete message error:",
            error
          );


          socket.emit(
            "message delete error",
            {

              message:
                "コメントを削除できませんでした。"

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
          "Socket disconnected:",
          socket.id,
          reason
        );

      }
    );

  }
);


// ==================================================
// 雑談
// ==================================================

async function joinCasual(
  socket
) {

  try {

    leaveCurrentRooms(
      socket
    );


    await socket.join(
      "casual"
    );


    socket.emit(
      "casual joined"
    );


    await sendPreviousMessages(
      socket,
      "casual"
    );

  } catch (error) {

    console.error(
      "joinCasual error:",
      error
    );

  }

}


// ==================================================
// 自分の部屋一覧送信
// ==================================================

async function sendMyRooms(
  socket,
  userId
) {

  try {

    const result =
      await pool.query(
        `
        SELECT
          r.id,
          r.name,
          r.invite_code,
          r.owner_id,
          r.created_at
        FROM rooms r
        INNER JOIN room_members rm
          ON rm.room_id = r.id
        WHERE rm.user_id = $1
        ORDER BY
          r.created_at ASC
        `,
        [
          userId
        ]
      );


    socket.emit(
      "my rooms",
      result.rows.map(
        formatRoom
      )
    );

  } catch (error) {

    console.error(
      "sendMyRooms error:",
      error
    );


    socket.emit(
      "my rooms",
      []
    );

  }

}


// ==================================================
// 現在の部屋から退出
// ==================================================

function leaveCurrentRooms(
  socket
) {

  for (
    const room of socket.rooms
  ) {

    if (
      room !== socket.id
    ) {

      socket.leave(
        room
      );

    }

  }

}


// ==================================================
// 過去メッセージ
// ==================================================

async function sendPreviousMessages(
  socket,
  room
) {

  try {

    const result =
      await pool.query(
        `
        SELECT
          id,
          room,
          user_id,
          username,
          text,
          reply_to_id,
          reply_to_username,
          reply_to_text,
          edited,
          created_at
        FROM messages
        WHERE room = $1
          AND created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY created_at ASC
        LIMIT 1000
        `,
        [
          room
        ]
      );


    socket.emit(
      "previous messages",
      result.rows.map(
        formatMessage
      )
    );

  } catch (error) {

    console.error(
      "previous messages error:",
      error
    );


    socket.emit(
      "previous messages",
      []
    );

  }

}


// ==================================================
// Message format
// ==================================================

function formatMessage(
  row
) {

  return {

    id:
      row.id,

    room:
      row.room,

    userId:
      row.user_id,

    username:
      row.username,

    text:
      row.text,

    replyToId:
      row.reply_to_id,

    replyToUsername:
      row.reply_to_username,

    replyToText:
      row.reply_to_text,

    edited:
      row.edited,

    createdAt:
      row.created_at

  };

}


// ==================================================
// 24時間以上経過したメッセージ削除
// ==================================================

async function cleanupOldMessages() {

  try {

    const result =
      await pool.query(
        `
        DELETE FROM messages
        WHERE created_at < NOW() - INTERVAL '24 hours'
        `
      );


    if (
      result.rowCount > 0
    ) {

      console.log(
        `古いメッセージを ${result.rowCount} 件削除しました。`
      );

    }

  } catch (error) {

    console.error(
      "cleanupOldMessages error:",
      error
    );

  }

}


setInterval(
  cleanupOldMessages,
  10 *
  60 *
  1000
);


// ==================================================
// Health Check
// ==================================================

app.get(
  "/health",
  async (req, res) => {

    try {

      await pool.query(
        "SELECT 1"
      );


      res.json({

        status:
          "ok",

        database:
          "connected"

      });

    } catch (error) {

      res
        .status(500)
        .json({

          status:
            "error",

          database:
            "disconnected"

        });

    }

  }
);


// ==================================================
// SPA fallback
// ==================================================

app.get(
  "*",
  (req, res) => {

    res.sendFile(
      path.join(
        __dirname,
        "public",
        "index.html"
      )
    );

  }
);


// ==================================================
// 起動
// ==================================================

async function start() {

  try {

    await initDatabase();

    await cleanupOldMessages();


    server.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log(
          "=========================================="
        );

        console.log(
          "Veylo server started."
        );

        console.log(
          `PORT: ${PORT}`
        );

        console.log(
          "=========================================="
        );

      }
    );

  } catch (error) {

    console.error(
      "Server startup failed:",
      error
    );

    process.exit(1);

  }

}


start();

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/public", express.static("public")); //이걸 미들웨어라고 하는데?
app.set("view engine", "ejs");

const methoOverride = require("method-override");
app.use(methoOverride("_method"));

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");

require("dotenv").config();

app.use(
  session({ secret: "비밀코드", resave: true, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

var db;

MongoClient.connect(process.env.DB_URL, function (err, client) {
  if (err) return console.log(err);

  db = client.db("todoapp");

  ///////
  ///////
  ///////
  ///////   홈
  ///////
  ///////
  ///////
  ///////

  app.get("/", function (req, res) {
    db.collection("post")
      .find()
      .toArray(function (err, result) {
        //console.log(result);
        res.render("home.ejs", { posts: result });
      });
  });

  app.get("/list", function (req, res) {
    db.collection("post")
      .find()
      .toArray(function (err, result) {
        //console.log(result);
        res.render("list.ejs", { posts: result });
      });
  });

  app.get("/mypage", function (req, res) {
    res.render("mypage.ejs");
  });

  app.get("/detail/:id", function (req, res) {
    db.collection("post").findOne(
      { _id: parseInt(req.params.id) },
      function (err, result) {
        if (!err) {
          console.log(result);
          res.render("detail.ejs", { data: result });
        }
      }
    );
  });

  app.delete("/delete", function (req, res) {
    //console.log(req.body);
    req.body._id = parseInt(req.body._id);
    //console.log(req.body);

    db.collection("post").deleteOne(req.body, function (err, result) {
      console.log("삭제완료");
      res.status(200).send({ message: "mission complete" });
    });
  });

  ///////
  ///////
  ///////
  ///////   게시물 추가.
  ///////
  ///////
  ///////
  ///////

  app.post("/add", function (req, res) {
    console.log(req.body);
    db.collection("counter").findOne(
      { name: "게시물개수" },
      function (err, result) {
        var total_posts_num = result.totalPost;
        console.log(total_posts_num);
        db.collection("post").insertOne(
          {
            _id: total_posts_num + 1,
            date: req.body.date,
            todo: req.body.todo,
          },
          function (err, result) {
            console.log("저장완료");
            db.collection("counter").update(
              { name: "게시물개수" },
              { $inc: { totalPost: 1 } },
              function (err, result) {
                if (err) {
                  return console.log(err);
                }
              }
            );
          }
        );
      }
    );

    res.render("home");
  });
  app.listen(8080, function () {
    console.log("server is now started");
  });
  //원하는 정보를 저장한다.

  ///////
  ///////
  ///////
  ///////   글 수정.
  ///////
  ///////
  ///////
  ///////

  app.get("/edit/:id", function (req, res) {
    db.collection("post").findOne(
      { _id: parseInt(req.params.id) }, //파라미터이용..
      function (err, result) {
        res.render("edit.ejs", { data: result }); //찾은 결과를 edit.ejs로 보냄.
      }
    );
  });

  app.put("/edit", function (req, res) {
    db.collection("post").updateOne(
      { _id: parseInt(req.body.iddd) },
      { $set: { todo: req.body.todo, date: req.body.date } },
      function (err, result) {
        console.log("수정완료");
        res.redirect("/list");
      }
    );
  });

  ///////
  ///////
  ///////
  ///////   로그인
  ///////
  ///////
  ///////
  ///////

  app.get("/login", function (req, res) {
    res.render("login.ejs");
  });

  app.post(
    "/login",
    passport.authenticate("local", {
      failureRedirect: "/fail",
    }),
    function (req, res) {
      res.redirect("/");
    }
  );

  passport.use(
    new LocalStrategy(
      {
        usernameField: "id",
        passwordField: "pw",
        session: true,
        passReqToCallback: false,
      },
      function (입력한아이디, 입력한비번, done) {
        //console.log(입력한아이디, 입력한비번);
        db.collection("login").findOne(
          { id: 입력한아이디 },
          function (에러, 결과) {
            if (에러) return done(에러);

            if (!결과)
              return done(null, false, { message: "존재하지않는 아이디요" });
            if (입력한비번 == 결과.password) {
              return done(null, 결과);
            } else {
              return done(null, false, { message: "비번틀렸어요" });
            }
          }
        );
      }
    )
  );
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (아이디, done) {
    db.collection("login").findOne({ id: 아이디 }, function (에러, 결과) {
      done(null, 결과);
    });
  });

  app.get("/mypage", 로그인했니, function (요청, 응답) {
    console.log(요청.user);
    응답.render("mypage.ejs", {});
  });

  function 로그인했니(요청, 응답, next) {
    if (요청.user) {
      next();
    } else {
      응답.send("로그인안하셨는데요?");
    }
  }

  ///////
  ///////
  ///////
  ///////   회원 가입.
  ///////
  ///////
  ///////
  ///////

  app.get("/signin", function (요청, 응답) {
    응답.render("signin.ejs");
  });

  app.post("/signin-complete", function (req, res) {
    console.log(req.body.signinID);
    console.log(req.body.signinPW);
    console.log(typeof req.body.signinID);
    console.log(typeof req.body.signinPW);

    db.collection("login").findOne(
      {
        id: String(req.body.signinID),
      },
      function (err, result) {
        if (err) {
          console.log(err);
        }
        console.log(result);
      }
    );
    db.collection("login").insertOne(
      {
        id: req.body.signinId,
        pw: req.body.signinPw,
      },
      function (err, result) {
        if (err) {
          console.log(err);
        }
        res.render("login.ejs");
        console.log(req.body.signinID);
        console.log(req.body.signinPW);
        console.log(typeof req.body.signinID);
        console.log(typeof req.body.signinPW);
      }
    );
  });
});

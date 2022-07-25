// 관련 모듈
require("dotenv").config();
const express = require("express");
const app = express();
const app2 = express();
const PORT = process.env.PORT;
const PORT2 = process.env.PORT2;
const cors = require("cors");
const connect = require("./database/database.js");
const morgan = require("morgan");
const helmet = require("helmet");
const passport = require("passport");
const session = require("express-session");
const passportConfig = require("./passport");
const cookieParser = require("cookie-parser");
//const swaggerUi = require("swagger-ui-express");
//const swaggerFile = require("./swagger-output");

// 소켓 관련 모듈
const http = require('http');
const socket = require('./socket');
connect();

//라우터
const recruitPostsRouter = require("./routes/recruitPosts");
const recruitCommentsRouter = require("./routes/recruitComments");
const placePostsRouter = require("./routes/placePosts");
const placeCommentsRouter = require("./routes/placeComments");
const reviewPostsRouter = require("./routes/reviewPosts");
const reviewCommentsRouter = require("./routes/reviewComments");
const mypagesRouter = require("./routes/mypages");
const chatRoomsRouter = require("./routes/chatRooms");
const chatMessagesRouter = require("./routes/chatMessages");
const usersRouter = require("./routes/users");
const mainRouter = require("./routes/mains")
const searchRouter = require("./routes/searchs")

passportConfig();

//미들웨어
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("tiny"));
app.use(cookieParser());
app.use(
    session({
        resave: false,
        saveUninitialized: false,
        secret: process.env.SESSION_SECRET,
        cookie: {
            httpOnly: true,
            secure: false,
        },
    })
);
app.use(passport.initialize());
app.use(passport.session());

//미들웨어2 
app2.use(express.json());
app2.use(cors());
app2.use(helmet());
app2.use(morgan("tiny"));
app2.use(cookieParser());
app2.use(
    session({
        resave: false,
        saveUninitialized: false,
        secret: process.env.SESSION_SECRET,
        cookie: {
            httpOnly: true,
            secure: false,
        },
    })
);
app2.use(passport.initialize());
app2.use(passport.session());

// 구현 완료 후 라우터 정리
app.use(
    "/api",
    express.urlencoded({ extended: false }),
    [recruitPostsRouter],
    [recruitCommentsRouter],
    [placePostsRouter],
    [placeCommentsRouter],
    [reviewPostsRouter],
    [reviewCommentsRouter],
    [chatRoomsRouter],
    [chatMessagesRouter],
    [mypagesRouter],
    [mainRouter],
    [searchRouter]
);

// 구현 완료 후 라우터 정리2
app2.use(
    "/api",
    express.urlencoded({ extended: false }),
    [recruitPostsRouter],
    [recruitCommentsRouter],
    [placePostsRouter],
    [placeCommentsRouter],
    [reviewPostsRouter],
    [reviewCommentsRouter],
    [chatRoomsRouter],
    [chatMessagesRouter],
    [mypagesRouter],
    [mainRouter],
    [searchRouter]
);

app.use("/api/users", express.urlencoded({ extended: false }), [usersRouter]);
//app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerFile)); // 스웨거 파일

app2.use("/api/users", express.urlencoded({ extended: false }), [usersRouter]);
//app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerFile)); // 스웨거 파일

app.get("/", (req, res) => {
    res.send("서버1 test");
});

app2.get("/", (req, res) => {
    res.send("서버2 test");
});

// 1없는 url로 요청한 경우
app.use((req, res, next) => {
    res.status(404).send("존재하지 않는 url주소 입니다.");
});

// 1서버 에러 핸들링
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).send("서버에 에러가 발생하였습니다.");
});

// 2없는 url로 요청한 경우
app2.use((req, res, next) => {
    res.status(404).send("존재하지 않는 url주소 입니다.");
});

// 2서버 에러 핸들링
app2.use((error, req, res, next) => {
    console.error(error);
    res.status(500).send("서버에 에러가 발생하였습니다.");
});

const server = http.createServer(app);
socket(server);

const server2 = http.createServer(app2);
socket(server2);

server.listen(PORT, () => {
    console.log(`${PORT}번 포트로 서버가 열렸습니다.`);
});
server2.listen(PORT2, () => {
    console.log(`${PORT2}번 포트로 서버가 열렸습니다.`);
});

//module.exports = app;
// 관련 모듈
require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT;
const cors = require("cors");
const connect = require("./database/database.js");
const morgan = require("morgan");
const helmet = require("helmet");
const passport = require("passport");
const session = require("express-session");
const passportConfig = require("./passport");
const cookieParser = require("cookie-parser");
const redis = require('redis')
const RedisStore = require('connect-redis')(session)
// const swaggerUi = require("swagger-ui-express");
// const swaggerFile = require("./swagger-output");

const redisClient = redis.createClient({
    url : `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    password : process.env.REDIS_PASSWORD,
})
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
        store : new RedisStore({ client : redisClient }),
    })
);
app.use(passport.initialize());
app.use(passport.session());

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
    [mainRouter]
);
app.use("/api/users", express.urlencoded({ extended: false }), [usersRouter]);
// app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerFile)); // 스웨거 파일

app.get("/", (req, res) => {
    res.send("redirect 테스트하기위한 루트 페이지입니다.");
});

// 없는 url로 요청한 경우
app.use((req, res, next) => {
    res.status(404).send("존재하지 않는 url주소 입니다.");
});

// 서버 에러 핸들링
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).send("서버에 에러가 발생하였습니다.");
});

const server = http.createServer(app);
socket(server);

server.listen(PORT, () => {
    console.log(`${PORT}번 포트로 서버가 열렸습니다.`);
});

// module.exports = app;
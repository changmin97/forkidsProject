const express = require("express");
const router = express.Router();
const chatRoomsController = require("../controller/chatRooms");
const authMiddleware = require("../middlewares/authmiddleware");

// 채팅방 생성
router.post("/chats/rooms/:recruitPostId", authMiddleware, chatRoomsController.chatRooms);

// 유저의 채팅방 목록 전체조회
router.get("/chats/rooms", authMiddleware, chatRoomsController.chatRoomsAllGet);

// 유저의 특정 채팅방 삭제
router.delete("/chats/rooms/:roomId", authMiddleware, chatRoomsController.chatRoomsDelete);

module.exports = router;
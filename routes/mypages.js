const express = require("express");
const router = express.Router();
const mypagesController = require("../controller/mypages");
const authMiddleware = require("../middlewares/authmiddleware");
const { profileUpload } = require('../middlewares/profileMulter');

// 프로필 조회
router.get("/mypage/profile/:nickname", mypagesController.profileGet);

// 북마크 전체게시글 조회
router.get("/mypage/bookmark", authMiddleware, mypagesController.myBookmark);

// 프로필 수정
router.put("/mypage/update", authMiddleware, profileUpload.single('profileUrl'), mypagesController.profileUpdate);

module.exports = router;
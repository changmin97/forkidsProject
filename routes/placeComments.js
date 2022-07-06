const express = require("express");
const router = express.Router();
const placeCommentsController = require("../controller/placeComments");
const authMiddleware = require("../middlewares/authmiddleware");

// 모집 댓글 등록
router.post("/places/:placePostId/comments"
             ,authMiddleware, placeCommentsController.placeComments);

 // 모집 댓글 삭제
router.delete("/places/:placePostId/comments/:placeCommentId"
              ,authMiddleware, placeCommentsController.placeCommentsDelete);

module.exports = router;
require("dotenv").config();
const reviewPost = require("../schemas/reviewPost");
const reviewComment = require("../schemas/reviewComment");
const reviewReComment = require("../schemas/reviewReComment");
const moment = require("moment");
const User = require("../schemas/user");
const logger = require("../logger");

// 육아용품 리뷰 댓글 등록
async function reviewComments(req, res) {
    try {
        const { nickname, profileUrl } = res.locals.user;
        const { reviewPostId } = req.params;
        const { comment } = req.body;
        const createdAt = moment().add("9", "h").format("YYYY-MM-DD HH:mm");
        let status = false;

        // 게시글 찾기
        const findPost = await reviewPost.findOne({
            reviewPostId: Number(reviewPostId),
        });
        // console.log(findPost);

        if (!findPost) {
            res.status(400).send({
                result: "false",
                message: "게시글 번호가 없습니다 ",
            });
        }

        console.log("reviewPostId:  " + findPost.reviewPostId);
        // 게시글 작성
        const reviewComments = await reviewComment.create({
            nickname: nickname,
            profileUrl,
            reviewPostId: findPost.reviewPostId,
            comment: comment,
            createdAt: createdAt,
        });
        // console.log(reviewComments);

        res.status(200).send({
            result: "true",
            message: "댓글이 성공적으로 등록되었습니다.",
        });
    } catch (err) {
        logger.error("댓글 작성 실패");
        res.status(400).send({
            result: "false",
            message: "댓글 작성 실패",
        });
    }
}

// 육아용품 리뷰 댓글 삭제
async function reviewCommentsDelete(req, res) {
    try {
        const { reviewPostId, reviewCommentId } = req.params;
        const { nickname } = res.locals.user;

        const reviewComments = await reviewComment.findOne({
            reviewPostId: reviewPostId,
            reviewCommentId: reviewCommentId,
        });

        if (!reviewComments) {
            return res.status(200).send({
                result: "false",
                message: "이미 지워진 댓글입니다.",
            });
        }

        if (!(nickname == reviewComments.nickname)) {
            return res.status(200).send({
                result: "false",
                message: "닉네임이 일치하지 않습니다",
            });
        }

        await reviewComment.deleteOne({
            reviewPostId: reviewPostId,
            reviewCommentId: reviewCommentId,
        });

        return res.status(200).send({
            result: "true",
            message: "댓글이 성공적으로 삭제되었습니다.",
        });
    } catch (err) {
        logger.error("댓글 삭제 실패");
        res.status(400).send({
            result: "false",
            message: "댓글 삭제 실패",
        });
    }
}

// async function reviewReCommentsCreate(req, res) {
//     try {
//         const { nickname, profileUrl } = res.locals.user;
//         const { reviewCommentId } = req.params;
//         const { comment } = req.body;
//         let status = false;

//         // 댓글 찾기
//         const [findComment] = await reviewComment.find({
//             reviewCommentId: reviewCommentId,
//         });

//         // console.log(findComment);

//         if (!findComment.placePostId) {
//             return res.status(400).send({
//                 result: "false",
//                 message: "게시글 번호가 없습니다",
//             });
//         }

//         // 댓글 작성
//         const reviewReComments = await reviewReComment.create({
//             nickname: nickname,
//             profileUrl,
//             reviewPostId: findComment.reviewPostId,
//             reviewCommentId: findComment.reviewCommentId,
//             comment: comment,
//         });

//         console.log(reviewReComments);

//         res.status(200).send({
//             result: "true",
//             message: "댓글이 성공적으로 등록되었습니다.",
//         });
//     } catch (err) {
//         res.status(400).send({
//             result: "false",
//             message: "댓글 작성 실패",
//         });
//     }
// }

module.exports = {
    reviewComments,
    reviewCommentsDelete,
 
};

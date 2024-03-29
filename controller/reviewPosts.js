require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;
const jwt = require("jsonwebtoken");
const reviewPost = require("../schemas/reviewPost");
const reviewComment = require("../schemas/reviewComment");
const User = require("../schemas/user");
const reviewBookmarks = require("../schemas/reviewBookmark");
const moment = require("moment");
const {
    reviewImageUpload,
    reviewImageDelete,
} = require("../middlewares/mainMulter");
const logger = require("../logger");

// 육아용품 리뷰 게시글 작성
async function reviewPosts(req, res) {
    try {
        const { nickname, profileUrl } = res.locals.user;
        const { title, content, url, productType } = req.body;
        const createdAt = moment().add("9", "h").format("YYYY-MM-DD HH:mm");
        let imageUrl = req.files;

        if (!title || !content || !url || !productType) {
            return res
                .status(400)
                .json({ result: false, message: "빈값이 존재합니다." });
        }

        if (req.files.length != 0) {
            imageUrl = [];
            for (let i = 0; i < req.files.length; i++) {
                imageUrl.push(req.files[i].transforms[0].location);
            }
        } else {
            imageUrl = [
                "https://changminbucket.s3.ap-northeast-2.amazonaws.com/modu6ahBasicProfile.png",
            ];
        }

        // 게시글 작성
        const createdPosts = await reviewPost.create({
            nickname,
            profileUrl,
            title,
            content,
            url,
            imageUrl: imageUrl,
            productType,
            createdAt: createdAt,
        });

        return res.status(200).send({
            result: "true",
            message: "게시글이 성공적으로 등록되었습니다.",
            imageUrl,
        });
    } catch (err) {
        logger.error("게시글 작성 실패");
        res.status(400).send({
            result: "false",
            message: "게시글 작성 실패",
        });
    }
}

// 육아용품 리뷰 게시글 전체조회
async function reviewAllGet(req, res) {
    try {
        const { authorization } = req.headers;
        // case1) 로그인 되어있을때 (포함되어있을경우 bookmarkStatus값만 true로 바꾸고, bookmarkUsers는 배열아닌 null로 바꿔 프론트에 전달 )
        if (authorization) {
            const [authType, authToken] = authorization.split(" ");
            const decodedToken = jwt.decode(authToken, SECRET_KEY);
            const userNickname = decodedToken.nickname;

            let reviewPosts = await reviewPost
                .find({}, { updatedAt: 0, _id: 0 })
                .sort({ reviewPostId: -1 });
            for (let i = 0; i < reviewPosts.length; i++) {
                //forEach문? 다른거?로 바꾸면 더 효율 좋나?
                if (reviewPosts[i].bookmarkUsers.includes(userNickname)) {
                    reviewPosts[i].bookmarkStatus = true;
                }
                reviewPosts[i].bookmarkUsers = null;
            }
            return res.status(200).send({
                reviewPosts,
            });
        }

        // case2) 비로그인 일때 (bookmarkUsers 제외하고 보내기)
        const reviewPosts = await reviewPost
            .find({}, { updatedAt: 0, _id: 0, bookmarkUsers: 0 })
            .sort({ reviewPostId: -1 });
        return res.status(200).send({ reviewPosts });
    } catch (err) {
        logger.error("게시글 전체조회 실패");
        res.status(400).send({
            result: "false",
            message: "게시글 전체조회 실패",
        });
    }
}

// 육아용품 리뷰 게시글 상세조회
async function reviewGet(req, res) {
    try {
        const { authorization } = req.headers;
        if (authorization) {
            const [authType, authToken] = authorization.split(" ");
            const decodedToken = jwt.decode(authToken, SECRET_KEY);
            const { nickname } = decodedToken;

            const { reviewPostId } = req.params;
            const [reviewDetails] = await reviewPost.find(
                { reviewPostId: Number(reviewPostId) },
                { _id: 0 }
            );
            const reviewComments = await reviewComment
                .find({ reviewPostId: Number(reviewPostId) }, { _id: 0 })
                .sort({ reviewCommentId: -1 });
            if (!reviewDetails) {
                return res.status(400).send({
                    result: "false",
                    message: "게시글이 존재하지 않습니다.",
                });
            }
            if (reviewDetails.bookmarkUsers.includes(nickname)) {
                reviewDetails.bookmarkStatus = true;
            }
            return res.status(200).send({ reviewDetails, reviewComments });
        }

        const { reviewPostId } = req.params;
        const [reviewDetails] = await reviewPost.find(
            { reviewPostId: Number(reviewPostId) },
            { _id: 0 }
        );
        const reviewComments = await reviewComment
            .find({ reviewPostId: Number(reviewPostId) }, { _id: 0 })
            .sort({ reviewCommentId: -1 });
        if (!reviewDetails) {
            return res.status(400).send({
                result: "false",
                message: "게시글이 존재하지 않습니다.",
            });
        }
        return res.status(200).send({ reviewDetails, reviewComments });
    } catch (err) {
        logger.error("게시글 상세조회 실패");
        res.status(400).send({
            result: "false",
            message: "게시글 상세조회 실패",
        });
    }
}

// 육아용품 리뷰 게시글 수정
async function reviewUpdate(req, res) {
    try {
        const { reviewPostId } = req.params;
        const { title, content, url, productType } = req.body;
        const { nickname } = res.locals.user;
        const reviewPosts = await reviewPost.findOne({
            reviewPostId: Number(reviewPostId),
        });

        if (nickname !== reviewPosts.nickname) {
            return res.status(400).send({
                result: "false",
                message: "게시글 수정 권한 없음",
            });
        }

        await reviewPost.updateOne(
            { reviewPostId },
            { $set: { title, content, url, productType } }
        );
        await reviewBookmarks.updateMany(
            { reviewPostId },
            { $set: { title, content, url, productType } }
        );
        return res.status(200).send({
            result: "true",
            message: "게시글이 성공적으로 수정되었습니다.",
        });
    } catch (err) {
        logger.error("게시글 수정 실패");
        res.status(400).send({
            result: "false",
            message: "게시글 수정 실패",
        });
    }
}

// 육아용품 리뷰 게시글 삭제(육아용품 리뷰 댓글도 같이 삭제)
async function reviewDelete(req, res) {
    try {
        const { reviewPostId } = req.params;
        const { nickname } = res.locals.user;
        const reviewPosts = await reviewPost.findOne({
            reviewPostId: Number(reviewPostId),
        });
        const imageUrls = reviewPosts.imageUrl;
        const objectArr = imageUrls.map((imageUrl) => {
            const splited = imageUrl.split("uploadReviewImage");
            const key = "uploadReviewImage" + splited[splited.length - 1];
            return { Key: key };
        });

        if (nickname !== reviewPosts.nickname) {
            return res.status(400).send({
                result: "false",
                message: "게시글 삭제 권한 없음",
            });
        }

        await reviewPost.deleteOne({ reviewPostId });
        await reviewComment.deleteMany({ reviewPostId });
        await reviewImageDelete(objectArr);
        return res.status(200).send({
            result: "true",
            message: "게시글이 성공적으로 삭제되었습니다.",
        });
    } catch (err) {
        logger.error("육아 게시글 삭제 실패");
        res.status(400).send({
            result: "false",
            message: "육아 게시글 삭제 실패",
        });
    }
}

// 육아용품 리뷰 게시글 북마크 표시/해제
async function reviewBookmark(req, res) {
    try {
        const { reviewPostId } = req.params;
        const { nickname } = res.locals.user;
        const bookmarkPost = await reviewPost.findOne({
            reviewPostId: Number(reviewPostId),
        });
        const user = await User.findOne({ nickname });
        if (bookmarkPost) {
            if (!bookmarkPost.bookmarkUsers.includes(nickname)) {
                await bookmarkPost.updateOne({
                    $push: { bookmarkUsers: nickname },
                });
                await user.updateOne({ $push: { bookmarkList: reviewPostId } });
                const markedAt = moment().add(9, "h");
                const addedBookmark = new reviewBookmarks({
                    reviewPostId,
                    nickname: bookmarkPost.nickname,
                    profileUrl: bookmarkPost.profileUrl,
                    title: bookmarkPost.title,
                    content: bookmarkPost.content,
                    url: bookmarkPost.url,
                    productType: bookmarkPost.productType,
                    imageUrl: bookmarkPost.imageUrl,
                    category: bookmarkPost.category,
                    createdAt: bookmarkPost.createdAt,
                    adder: nickname,
                    markedAt: markedAt,
                });
                await addedBookmark.save();
                return res.status(200).send({
                    result: "true",
                    message: "북마크가 표시되었습니다.",
                });
            } else {
                await bookmarkPost.updateOne({
                    $pull: { bookmarkUsers: nickname },
                });
                await user.updateOne({ $pull: { bookmarkList: reviewPostId } });
                await reviewBookmarks.deleteOne({
                    $and: [{ adder: nickname }, { reviewPostId }],
                });
                return res.status(200).send({
                    result: "true",
                    message: "북마크가 해제되었습니다.",
                });
            }
        } else {
            await reviewBookmarks.deleteOne({
                $and: [{ adder: nickname }, { reviewPostId }],
            });
            return res.status(200).send({
                result: "true",
                message: "북마크가 해제되었습니다.",
            });
        }
    } catch (err) {
        logger.error("육아 게시글 북마크 표시/해제 실패");
        res.status(400).send({
            result: "false",
            message: "육아 게시글 북마크 표시/해제 실패",
        });
    }
}

module.exports = {
    reviewPosts,
    reviewAllGet,
    reviewGet,
    reviewUpdate,
    reviewDelete,
    reviewBookmark,
};

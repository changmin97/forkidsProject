require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;
const jwt = require("jsonwebtoken");
const placePost = require("../schemas/placePost");
const placeComment = require("../schemas/placeComment");
const User = require("../schemas/user");
const PlaceBookmarks = require("../schemas/placeBookmark");
const moment = require("moment");
const {
    placeImageUpload,
    placeImageDelete,
} = require("../middlewares/mainMulter");
const logger = require("../logger");

// 장소추천 게시글 작성
async function placePosts(req, res) {
    try {
        const { nickname, profileUrl } = res.locals.user;
        const { title, content, region, star, location } = req.body;
        const createdAt = moment().add("9", "h").format("YYYY-MM-DD HH:mm");
        let imageUrl;

        if (!title || !content || !region || !star || !location) {
            return res.status(400).json({
                result: false,
                message: "빈값이 존재합니다.",
            });
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
        const createdPosts = await placePost.create({
            nickname,
            profileUrl,
            title,
            content,
            region,
            location,
            imageUrl: imageUrl,
            star,
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

// 장소추천 게시글 전체조회
async function placeAllGet(req, res) {
    try {
        const { authorization } = req.headers;
        if (authorization) {
            const [authType, authToken] = authorization.split(" ");
            const decodedToken = jwt.decode(authToken, SECRET_KEY);
            const userNickname = decodedToken.nickname;

            let placePosts = await placePost
                .find({}, { updatedAt: 0, _id: 0 })
                .sort({ placePostId: -1 });
            for (let i = 0; i < placePosts.length; i++) {
                if (placePosts[i].bookmarkUsers.includes(userNickname)) {
                    placePosts[i].bookmarkStatus = true;
                }
                placePosts[i].bookmarkUsers = null;
            }
            return res.send({
                placePosts,
            });
        }

        const placePosts = await placePost
            .find({}, { updatedAt: 0, _id: 0, bookmarkUsers: 0 })
            .sort({ placePostId: -1 });
        res.status(200).send({ placePosts: placePosts });
    } catch (err) {
        logger.error("게시글 전체조회 실패");
        res.status(400).send({
            result: "false",
            message: "게시글 전체조회 실패",
        });
    }
}

// 장소추천 게시글 상세조회
async function placeGet(req, res) {
    try {
        const { authorization } = req.headers;
        if (authorization) {
            const [authType, authToken] = authorization.split(" ");
            const decodedToken = jwt.decode(authToken, SECRET_KEY);
            const { nickname } = decodedToken;

            const { placePostId } = req.params;
            const [placeDetails] = await placePost.find(
                { placePostId: Number(placePostId) },
                { _id: 0 }
            );
            const placeComments = await placeComment
                .find({ placePostId: Number(placePostId) }, { _id: 0 })
                .sort({ placeCommentId: -1 });
            if (!placeDetails) {
                return res.status(400).send({
                    result: "false",
                    message: "게시글이 존재하지 않습니다.",
                });
            }
            if (placeDetails.bookmarkUsers.includes(nickname)) {
                placeDetails.bookmarkStatus = true;
            }
            return res.status(200).send({ placeDetails, placeComments });
        }

        const { placePostId } = req.params;
        const [placeDetails] = await placePost.find(
            { placePostId: Number(placePostId) },
            { _id: 0 }
        );
        const placeComments = await placeComment
            .find({ placePostId: Number(placePostId) }, { _id: 0 })
            .sort({ placeCommentId: -1 });
        if (!placeDetails) {
            return res.status(400).send({
                result: "false",
                message: "게시글이 존재하지 않습니다.",
            });
        }
        return res.status(200).send({ placeDetails, placeComments });
    } catch (err) {
        logger.error("게시글 상세조회 실패");
        res.status(400).send({
            result: "false",
            message: "게시글 상세조회 실패",
        });
    }
}

// 장소추천 게시글 수정
async function placeUpdate(req, res) {
    try {
        const { placePostId } = req.params;
        const { title, content, region, location, star } = req.body;
        const { nickname } = res.locals.user;
        const placePosts = await placePost.findOne({
            placePostId: Number(placePostId),
        });

        if (nickname !== placePosts.nickname) {
            return res.status(400).send({
                result: "false",
                message: "게시글 수정 권한 없음",
            });
        }

        await placePost.updateOne(
            { placePostId },
            { $set: { title, content, region, location, star } }
        );
        await PlaceBookmarks.updateMany(
            { placePostId },
            { $set: { title, content, region, location, star } }
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

// 장소추천 게시글 삭제(장소추천 리뷰 댓글도 같이 삭제)
async function placeDelete(req, res) {
    try {
        const { placePostId } = req.params;
        const { nickname } = res.locals.user;
        const placePosts = await placePost.findOne({
            placePostId: Number(placePostId),
        });
        const imageUrls = placePosts.imageUrl;
        const objectArr = imageUrls.map((imageUrl) => {
            const splited = imageUrl.split("uploadPlaceImage");
            const key = "uploadPlaceImage" + splited[splited.length - 1];
            return { Key: key };
        });
        if (nickname !== placePosts.nickname) {
            return res.status(400).send({
                result: "false",
                message: "게시글 삭제 권한 없음",
            });
        }
        await placePost.deleteOne({ placePostId });
        await placeComment.deleteMany({ placePostId });
        await placeImageDelete(objectArr);
        return res.status(200).send({
            result: "true",
            message: "게시글이 성공적으로 삭제되었습니다.",
        });
    } catch (err) {
        logger.error("게시글 삭제 실패");
        res.status(400).send({
            result: "false",
            message: "게시글 삭제 실패",
        });
    }
}

// 장소추천 게시글 북마크 표시/해제
async function placeBookmark(req, res) {
    try {
        const { placePostId } = req.params;
        const { nickname } = res.locals.user;
        const bookmarkPost = await placePost.findOne({
            placePostId: Number(placePostId),
        });
        const user = await User.findOne({ nickname });
        if (bookmarkPost) {
            if (!bookmarkPost.bookmarkUsers.includes(nickname)) {
                await bookmarkPost.updateOne({
                    $push: { bookmarkUsers: nickname },
                });
                await user.updateOne({ $push: { bookmarkList: placePostId } });
                const markedAt = moment().add(9, "h");
                const addedBookmark = new PlaceBookmarks({
                    placePostId,
                    nickname: bookmarkPost.nickname,
                    profileUrl: bookmarkPost.profileUrl,
                    title: bookmarkPost.title,
                    content: bookmarkPost.content,
                    region: bookmarkPost.region,
                    location: bookmarkPost.location,
                    imageUrl: bookmarkPost.imageUrl,
                    star: bookmarkPost.star,
                    category: bookmarkPost.category,
                    adder: nickname,
                    createdAt: bookmarkPost.createdAt,
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
                await user.updateOne({ $pull: { bookmarkList: placePostId } });
                await PlaceBookmarks.deleteOne({
                    $and: [{ adder: nickname }, { placePostId }],
                });
                return res.status(200).send({
                    result: "true",
                    message: "북마크가 해제되었습니다.",
                });
            }
        } else {
            await PlaceBookmarks.deleteOne({
                $and: [{ adder: nickname }, { placePostId }],
            });
            return res.status(200).send({
                result: "true",
                message: "북마크가 해제되었습니다.",
            });
        }
    } catch (err) {
        logger.error("게시글 북마크 표시/해제 실패");
        res.status(400).send({
            result: "false",
            message: "게시글 북마크 표시/해제 실패",
        });
    }
}

module.exports = {
    placePosts,
    placeAllGet,
    placeGet,
    placeUpdate,
    placeDelete,
    placeBookmark,
};

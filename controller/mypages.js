require("dotenv").config();
const recruitPost = require("../schemas/recruitPost");
const placePost = require("../schemas/placePost");
const reviewPost = require("../schemas/reviewPost");
const User = require("../schemas/user");
const recruitComment = require("../schemas/recruitComment");
const placeComment = require("../schemas/placeComment");
const reviewComment = require("../schemas/reviewComment");
const RecruitBookmark = require("../schemas/recruitBookmark");
const PlaceBookmark = require("../schemas/placeBookmark");
const ReviewBookmark = require("../schemas/reviewBookmark");
const chatRoom = require("../schemas/chatRoom");
const chatMessage = require("../schemas/chatMessage");
const { profileUpload, profileDelete } = require('../middlewares/profileMulter');
const logger = require("../logger");

// 프로필 조회 - 로그인한 사람/안한 사람
async function profileGet(req, res) {
    try {
        const { nickname } = req.params
        const mypageGet = await User.findOne({ nickname }, { _id: 0, email: 1, nickname: 1, profileUrl: 1, myComment: 1 });
        if(!mypageGet){
            return res.status(400).send({
                result: "false",
                message: "존재하지 않는 유저입니다."
            });
        }
        return res.status(200).send({ mypageGet });
    } catch (err) {
        logger.error("프로필 조회 실패")
        res.status(400).send({
            result: "false",
            message: "프로필 조회 실패"
        });
    }
};

// 북마크한 목록 전체보기
async function myBookmark(req, res) {
    try {
        const { nickname } = res.locals.user;
        const recruitBookmarkList = await RecruitBookmark.find({ adder:nickname }).sort({markedAt:-1})
        const placeBookmarkList = await PlaceBookmark.find({ adder:nickname }).sort({markedAt:-1})
        const reviewBookmarkList = await ReviewBookmark.find({ adder:nickname }).sort({markedAt:-1})

        return res.send({ 
            result : true,
            recruitBookmarkList,
            placeBookmarkList,
            reviewBookmarkList,

        });

    } catch (err) {
        logger.error("북마크 조회 실패")
        res.status(400).send({
            result: "false",
            message: "북마크 조회에 실패하였습니다."
        });
    }
};

// 프로필 수정
async function profileUpdate(req, res) {
    try {
        const { nickname } = res.locals.user;
        const { myComment } = req.body;
        const findUser = await User.findOne({ nickname });
        let profileUrl;
        let newProfileUrl = req.file;

        // req.file이 있을 때
        if (newProfileUrl) {
            await profileDelete(findUser.profileUrl);
            await User.updateMany({ nickname }, { $set: { profileUrl: newProfileUrl.transforms[0].location, myComment }});
            await recruitPost.updateMany({ nickname }, { $set: { profileUrl: newProfileUrl.transforms[0].location }});
            await placePost.updateMany({ nickname }, { $set: { profileUrl: newProfileUrl.transforms[0].location }});
            await reviewPost.updateMany({ nickname }, { $set: { profileUrl: newProfileUrl.transforms[0].location }});
            await recruitComment.updateMany({ nickname }, { $set: { profileUrl: newProfileUrl.transforms[0].location }});
            await placeComment.updateMany({ nickname }, { $set: { profileUrl: newProfileUrl.transforms[0].location }});
            await reviewComment.updateMany({ nickname }, { $set: { profileUrl: newProfileUrl.transforms[0].location}});
            await chatRoom.updateMany({  $or : [ { nickname : nickname } , { postNickname : nickname } ] }, { $set: { profileUrl: newProfileUrl.transforms[0].location }});
            await chatMessage.updateMany({ $or : [ { senderNick : nickname } , { receiverNick : nickname } ]  }, 
                                        { $set: { profileUrl: newProfileUrl.transforms[0].location,
                                                 profileUrlTwo: newProfileUrl.transforms[0].location}});
            return res.status(200).send({ result: "true", message: "프로필 수정이 완료되었습니다.", profileUrl: newProfileUrl.transforms[0].location, myComment });
        // req.file이 없을 때
        } else {
            let profileUrl = findUser.profileUrl;
            await User.updateMany({ nickname }, { $set: { myComment }});
            return res.status(200).send({ result: "true", message: "프로필 수정이 완료되었습니다.", profileUrl, myComment })
        }
        
    } catch (err) {
        logger.error("프로필 수정 실패")
        res.status(400).send({
            result: "false",
            message: "프로필 수정 실패"
        });
    }
};


module.exports = {
    profileGet,
    myBookmark,
    profileUpdate,
  };
require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;
const jwt = require("jsonwebtoken");
const placePost = require("../schemas/placePost");
const placeComment = require("../schemas/placeComment");
const User = require("../schemas/user");
const PlaceBookmarks = require("../schemas/placeBookmark");
const moment = require("moment");
const mainMiddleware = require("../middlewares/mainMulter");

// 장소추천 게시글 작성
async function placePosts(req, res) {
  try {
      // 불러올 정보 및 받아올 정보
      const { nickname, profileUrl } = res.locals.user;
      const { title, content, region, star, location } = req.body;
      const createdAt = moment().add('9','h').format('YYYY-MM-DD HH:mm');
      let imageUrl;
      if (req.files.length != 0) {
          imageUrl = [];
          for (let i = 0; i < req.files.length; i++) {
              imageUrl.push(req.files[i].transforms[0].location);
          }
      } else {
          imageUrl = [
            "https://changminbucket.s3.ap-northeast-2.amazonaws.com/basicProfile.png"
          ]
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
          location,
      });
      console.log(createdPosts)

      res.status(200).send({
          result: "true",
          message: "게시글이 성공적으로 등록되었습니다."
      });
  } catch (err) {
      res.status(400).send({
          result: "false",
          message: "게시글 작성 실패"
      });
  }
};

// 장소추천 게시글 전체조회
async function placeAllGet(req, res) {
    try {
        const { authorization } = req.headers;
        if(authorization){
            const [authType, authToken] = authorization.split(" ");
            const decodedToken = jwt.decode(authToken, SECRET_KEY);
            const userNickname = decodedToken.nickname

            let placePosts = await placePost.find({}, { updatedAt: 0, _id: 0 }).sort({placePostId:-1});
            for(let i = 0; i <placePosts.length ; i++ ){
                if( placePosts[i].bookmarkUsers.includes(userNickname) ){
                    placePosts[i].bookmarkStatus = true
                }
                placePosts[i].bookmarkUsers = null
            }
            return res.send({
                placePosts
            })
        }

        const placePosts = await placePost.find({}, { updatedAt: 0, _id: 0, bookmarkUsers:0 }).sort({placePostId:-1});
        res.status(200).send({placePosts: placePosts});
    } catch (err) {
        res.status(400).send({
            result: "false",
            message: "게시글 전체조회 실패"
        });
    }
};

// 장소추천 게시글 상세조회
async function placeGet(req, res) {
    try {
        const { authorization } = req.headers;
        const { placePostId } = req.params;
        const [placeDetails] = await placePost.find({ placePostId: Number(placePostId) }, { _id: 0 });
        const placeComments = await placeComment.find({ placePostId: Number(placePostId) }, { _id: 0 }).sort({ placeCommentId: 1 });
        if (!placeDetails) {
            return res.status(400).send({ result: "false", message: "게시글이 없습니다."});
        }
        //case1) 로그인 되어있을떄
        if(authorization){
            const [authType, authToken] = authorization.split(" ");
            const decodedToken = jwt.decode(authToken, SECRET_KEY);
            const userNickname = decodedToken.nickname

            if( placeDetails.bookmarkUsers.includes(userNickname)){
                placeDetails.bookmarkStatus = true
            }
            return res.status(200).send({ placeDetails, placeComments });
        }
        //case2) 비로그인 일떄
        return res.status(200).send({ placeDetails, placeComments });
        
    } catch (err) {
        res.status(400).send({
            result: "false",
            message: "게시글 상세조회 실패"
        });
    }
};

// 장소추천 게시글 수정
async function placeUpdate(req, res) {
    try {
        const { placePostId } = req.params;
        const { title, content, region, location, imageUrl, star } = req.body;
        const { nickname } = res.locals.user;
        const placePosts = await placePost.findOne({ placePostId: Number(placePostId) });
        if (nickname !== placePosts.nickname) {
            return res.status(400).send({
                result: "false",
                message: "게시글 수정 권한 없음"
            });
        }
        await placePost.updateOne({ placePostId }, { $set: { title, content, region, imageUrl, star }});
        await PlaceBookmarks.updateMany({ placePostId }, { $set: { title, content, region, imageUrl, star }});
        return res.status(200).send({
               result: "true",
               message: "게시글이 성공적으로 수정되었습니다."
        });
    } catch (err) {
        res.status(400).send({
            result: "false",
            message: "게시글 수정 실패"
        });
    }
};

// 장소추천 게시글 삭제(장소추천 리뷰 댓글도 같이 삭제)
async function placeDelete(req, res) {
    try {
        const { placePostId } = req.params;
        const { nickname } = res.locals.user;
        const placePosts = await placePost.findOne({ placePostId: Number(placePostId) })
        if (nickname !== placePosts.nickname) {
            return res.status(400).send({
                   result: "false",
                   message: "게시글 삭제 권한 없음"
             });
        }
        await placePost.deleteOne({ placePostId });
        await placeComment.deleteMany({ placePostId });
        // mainMiddleware.placeImageDelete(placePosts.imageUrl);
        return res.status(200).send({
                result: "true",
                message: "게시글이 성공적으로 삭제되었습니다."
        }); 
    } catch (err) {
        res.status(400).send({
            result: "false",
            message: "게시글 삭제 실패"
        });
    }
};

// 장소추천 게시글 북마크 표시/해제
async function placeBookmark(req, res) {
    try {
        const { placePostId } = req.params;
        const { nickname } = res.locals.user;
        const bookmarkPost = await placePost.findOne({ placePostId: Number(placePostId) });
        const user = await User.findOne({ nickname });
        console.log(bookmarkPost)
        if (!bookmarkPost.bookmarkUsers.includes(nickname)) {
            await bookmarkPost.updateOne({ $push: { bookmarkUsers: nickname }});
            await user.updateOne({ $push: { bookmarkList: placePostId }})
            const markedAt = moment().add('9','h').format('YYYY-MM-DD HH:mm');
            const addedBookmark = new PlaceBookmarks({
                placePostId,
                nickname : bookmarkPost.nickname,
                profileUrl : bookmarkPost.profileUrl,
                title : bookmarkPost.title,
                content : bookmarkPost.content,
                region : bookmarkPost.region,
                imageUrl : bookmarkPost.imageUrl,
                star : bookmarkPost.star,
                bookmarkUsers : bookmarkPost.bookmarkUsers,
                bookmarkStatus : bookmarkPost.bookmarkStatus,
                category :bookmarkPost.category,
                adder : nickname,
                markedAt : markedAt
            })
            await addedBookmark.save()
            res.status(200).send({
                result: "true",
                message: "북마크가 표시되었습니다."
            });
        } else {
            await bookmarkPost.updateOne({ $pull: { bookmarkUsers: nickname }});
            await user.updateOne({ $pull: { bookmarkList: placePostId }})
            await PlaceBookmarks.deleteOne({ $and: [{ nickname }, { placePostId }], })
            res.status(200).send({
                result: "true",
                message: "북마크가 해제되었습니다."
            });
        }

    } catch (err) {
        res.status(400).send({
            result: "false",
            message: "게시글 북마크 표시/해제 실패"
        });
    }
}

module.exports = {
    placePosts,
    placeAllGet,
    placeGet,
    placeUpdate,
    placeDelete,
    placeBookmark
  };
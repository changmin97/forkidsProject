require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;
const jwt = require("jsonwebtoken");
const recruitPost = require("../schemas/recruitPost");
const placePost = require("../schemas/placePost");
const reviewPost = require("../schemas/reviewPost");

// 메인 페이지 조회
async function mainPostGet(req, res) {
    try{
        const { authorization } = req.headers;

        //case1) 로그인 되어있을떄(포함되어있을경우 bookmarkStatus값만 true로 바꾸고, bookmarkUsers는 배열아닌 null로 바꿔 프론트에 전달 )
        if(authorization){
            // console.log('로그인유저 로직시작')
            const [authType, authToken] = authorization.split(" ");
            const decodedToken = jwt.decode(authToken, SECRET_KEY);
            const userNickname = decodedToken.nickname


            //TODO       전략: 먼저 recruitPosts 먼저 만들고 나중에 truePosts도 푸시하는걸로
            //TODO      status:false + limit(8)만족하는게시글 검색 => bookmarkStatus 작업 => remainNum 저장 => 
            //TODO      => status:true + limit(remainNum)만족하는게시글 검색 =>bookmarkStatus 작업 => 반복문이용해서 배열에 push
            // #1 모집 게시글 조회
            let recruitPosts = await recruitPost.find({ status: false },{ updatedAt: 0, _id: 0 }).limit(6).sort({ recruitPostId: -1,})
            for(let i = 0; i <recruitPosts.length ; i++ ){
                if( recruitPosts[i].bookmarkUsers.includes(userNickname) ){
                    recruitPosts[i].bookmarkStatus = true
                }
                recruitPosts[i].bookmarkUsers = null
            }
            // console.log("recruitPosts기본",recruitPosts)
            let remainNum;
            if( recruitPosts.length !==6 ){
                remainNum = 6 - recruitPosts.length
            }
            const truePosts = await recruitPost.find({ status: true }).limit(remainNum).sort({ recruitPostId: -1 })
            for(let i = 0; i <truePosts.length ; i++ ){ 
                if( truePosts[i].bookmarkUsers.includes(userNickname) ){
                    truePosts[i].bookmarkStatus = true
                }
                truePosts[i].bookmarkUsers = null
            }
            // console.log("truePostss정보다",recruitPosts)
            for(let i = 0 ; i < remainNum ; i++){
                recruitPosts.push(truePosts[i])
            }
            // console.log("ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ")
            // console.log('최종 recruit포스트들',)
            //#2 장소추천 게시글 조회
            let placePosts = await placePost.find({}, { updatedAt: 0, _id: 0 }).limit(2).sort({ star: -1,  placePostId: -1 })
            for(let i = 0; i <placePosts.length ; i++ ){
                if( placePosts[i].bookmarkUsers.includes(userNickname) ){
                    placePosts[i].bookmarkStatus = true
                }
                placePosts[i].bookmarkUsers = null
            }
            //#3 리뷰 게시글 조회
            let reviewPosts = await reviewPost.find({}, { updatedAt: 0, _id: 0 }).limit(2).sort({reviewPostId:-1})
            for(let i = 0; i <reviewPosts.length ; i++ ){        
            if( reviewPosts[i].bookmarkUsers.includes(userNickname) ){
                reviewPosts[i].bookmarkStatus = true
            }
            reviewPosts[i].bookmarkUsers = null
        }
        // console.log('로그인유저 로직끝')
            return res.status(200).send({
                result : true,
                recruitPosts,
                placePosts,
                reviewPosts
            })
        }

        // console.log('비로그인유저 로직시작')
        //case2) 비로그인 일떄 (bookmarkUsers 제외하고 보내기)
        const recruitPosts = await recruitPost.find({ status: false },{ updatedAt: 0, _id: 0, bookmarkUsers:0 }).limit(6).sort({ recruitPostId: -1 })
        let remainNum;
        if( recruitPosts.length < 6 ){
            remainNum = 6 - recruitPosts.length
        }
        const truePosts = await recruitPost.find({ status: true },{ updatedAt: 0, _id: 0, bookmarkUsers:0 }).limit(remainNum).sort({ recruitPostId: -1 })
        for(let i = 0 ; i < remainNum ; i++){
            recruitPosts.push(truePosts[i])
        }
      
        //장소추천게시글
        const placePosts = await placePost.find({},{ updatedAt: 0, _id: 0, bookmarkUsers:0 }).sort({ star: -1,  placePostId: -1 }).limit(2);
        // 리뷰 조회
        const reviewPosts = await reviewPost.find({},{ updatedAt: 0, _id: 0, bookmarkUsers:0 }).sort({reviewPostId:-1}).limit(2);
        
        // console.log('recruitPosts정보다',recruitPosts)
        // console.log('ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ')
        // console.log('truePosts정보다',truePosts)
        // console.log('비로그인유저 로직끝')
        return res.json({
            result:true,
            recruitPosts,
            placePosts, 
            reviewPosts
        })

    } catch (err) {
      res.status(400).send({
          result: "false",
          message: "메인페이지 조회 실패",
      });
  }
};

module.exports = {
    mainPostGet
};
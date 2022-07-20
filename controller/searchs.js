require("dotenv").config();
const recruitPost = require("../schemas/recruitPost");
const placePost = require("../schemas/placePost");
const reviewPost = require("../schemas/reviewPost");

// 전체 카테고리에서 검색
async function searchAll(req, res) {
        options = [
            { title: new RegExp(req.body.keyword) },
            { content: new RegExp(req.body.keyword) },
        ]
        const resultsInRecruit = await recruitPost.find({ $or: options },{ bookmarkUsers : 0, bookmarkStatus : 0 }).sort({createdAt:-1})
        const resultsInPlace = await placePost.find({ $or: options },{ bookmarkUsers : 0, bookmarkStatus : 0 }).sort({createdAt:-1})
        const resultsInReview = await reviewPost.find({ $or: options },{ bookmarkUsers : 0, bookmarkStatus : 0 }).sort({createdAt:-1})
        
        return res.json({
            resultsInRecruit,
            resultsInPlace,
            resultsInReview,
        })
};

// 모집게시글 카테고리에서 검색
async function searchRecruit(req, res) {
    if(!req.body.keyword){
        return res.json({
            result : false,
            message : "검색할 키워드를 입력해 주세요"
        })
    }

    options = [
        { title: new RegExp(req.body.keyword) },
        { content: new RegExp(req.body.keyword) },
    ]
    const resultsInRecruit = await recruitPost.find({ $or: options },{ bookmarkUsers : 0, bookmarkStatus : 0 }).sort({createdAt:-1})
    return res.json({
        resultsInRecruit,
    })
};



module.exports = {
    searchAll,
    searchRecruit
  };
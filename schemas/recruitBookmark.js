const mongoose = require("mongoose");

const { Schema } = mongoose;
const RecruitBookmarkSchema = new Schema({
    recruitPostId: { type: Number, unique: true },
    nickname: { type: String }, 
    profileUrl: { type: String },
    title: { type: String, required: true }, 
    content: { type: String, required: true }, 
    age: { type: String, required: true }, 
    date: { type: String, required: true }, 
    time: { type: String, required: true },
    place: { type: String, required: true },
    status: { type: Boolean },
    bookmarkUsers: { type: Array, default: [] },
    bookmarkStatus: {type : Boolean , default : false },
    category: { type: Number, default: 1 },
    adder : { type : String, required: true },
    markedAt : { type : Date, required: true },
});

module.exports = mongoose.model("RecruitBookmark", RecruitBookmarkSchema);
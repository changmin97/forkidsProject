const mongoose = require("mongoose");

const { Schema } = mongoose;
const ReviewBookmarkSchema = new Schema({
    reviewPostId: { type: Number }, 
    nickname: { type: String },
    profileUrl: { type: String },
    title: { type: String, required: true },
    content: { type: String, required: true },
    url: { type: String },
    productType: { type: String, required: true },
    imageUrl: { type: Array, required: true },
    bookmarkStatus: {type : Boolean , default : true },
    category: { type: Number, default: 3 },
    createdAt: { type: String, required: true },
    adder : { type : String, required: true },
    markedAt : { type : Date, required: true },
});

module.exports = mongoose.model("ReviewBookmark", ReviewBookmarkSchema);

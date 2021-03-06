const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const { Schema } = mongoose;

const placeReCommentSchema = new Schema(
    {   
        placeReCommentId: { type: Number }, // 댓글 번호
        placeCommentId: { type: Number }, // 댓글 번호
        placePostId: { type: Number }, // 댓글 단 게시글 번호
        nickname: { type: String }, // 댓글 작성자
        profileUrl: { type: String }, // 댓글 작성자 프로필 이미지
        comment: { type: String, required: true }, // 댓글 내용
    },
    { timestamps: true } // 댓글 생성 및 수정날짜
);

placeReCommentSchema.plugin(AutoIncrement, { inc_field: "placeReCommentId" });

module.exports = mongoose.model("PlaceReComment", placeReCommentSchema);
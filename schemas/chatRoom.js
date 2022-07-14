const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const { Schema } = mongoose;

const chatRoomSchema = new Schema(
    {
        roomId: { type: Number, unique: true},
        recruitPostId: { type: Number },
        nickname: { type: String },
        postNickname: { type: String },
        postTitle: { type: String },
        // lastChat: { type: mongoose.Schema.Types.ObjectId, ref: 'chatMessage' },
        outUsers: { type: Array, default: [] },
        profileUrl: { type: String }, // nickname의 profileUrl
        createdAt: { type: String }
    },
    // { timestamps: true }
);

chatRoomSchema.plugin(AutoIncrement, { inc_field: "roomId" });

module.exports = mongoose.model("chatRoom", chatRoomSchema);
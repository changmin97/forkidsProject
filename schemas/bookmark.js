const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const { Schema } = mongoose;

const bookmarkSchema = new Schema(
    {
        bookmarkId: { type: Number, unique: true},
        recruitPostId: { type: Number },
        nickname: { type: String },
    },
    { timestamps: true }
);

bookmarkSchema.plugin(AutoIncrement, { inc_field: "bookmarkId" });
module.exports = mongoose.model("chatMessage", chatMessageSchema);
const chatMessage = require("../schemas/chatMessage");
const chatRoom = require("../schemas/chatRoom");
const User = require("../schemas/user");
const moment = require("moment");

// 해당 채팅방 채팅내용 조회(by roomId)
async function chatMessagesGet(req, res) {
    try{
        const { roomId } = req.params;
        const chatMessageList = await chatMessage.find({ roomId: Number(roomId) });
        const titleRoom = await chatRoom.findOne({roomId:Number(roomId)})
        // console.log(chatMessageList);
        
        if (!chatMessageList[0]) {
            return res.status(400).send({ result: "false", message: "해당 채팅방의 메시지가 존재하지 않습니다.",
                                         titleRoom : titleRoom.postTitle});
        } else {
            return res.status(200).send({ 
                chatMessageList: chatMessageList, 
                titleRoom : titleRoom.postTitle
            });
        }
    } catch (err) {
        return res.status(400).send({
            result: "false",
            message: "채팅내용 전체조회 실패"
        });
    };
};

module.exports = {
    chatMessagesGet
};
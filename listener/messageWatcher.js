import Message from '../models/Message';
import ChatRoom from '../models/ChatRoom';
import { sendPush } from '../services/notifications/fcm';
import { queueEmailIfStillUnread } from '../services/notifications/email';

Message.watch().on('change', async (chg) => {
  if (chg.operationType !== 'insert') return;
  const m = chg.fullDocument;
  const room = await ChatRoom.findById(m.chatId).lean();
  if (!room) return;

  const receiverId = room.participants.find(
    (p) => p.toString() !== m.senderId.toString()
  );

  sendPush(receiverId, {
    title: 'New message',
    body: m.text?.slice(0, 80) || 'Attachment',
    data: { chatId: m.chatId.toString() },
  });

  queueEmailIfStillUnread(receiverId, m.chatId);
});

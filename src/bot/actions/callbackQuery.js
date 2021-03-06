import parseAction from '../utils/parseAction';

const callbackQuery = async context => {
  const {
    message: { message_id, chat: { id: chatId } },
    data: action,
  } = context.event.callbackQuery;

  const { languageCode } = context.user;
  const { text, options } = await parseAction(action, languageCode);

  if (text.indexOf(':') > -1) {
    await context.client.editMessageText(text, {
      chat_id: chatId,
      message_id,
      ...options,
    });
  } else {
    context.sendMessageContent.push({
      text,
      options,
    });
  }
};

export default callbackQuery;

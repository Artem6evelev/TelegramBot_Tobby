//! Telegram Bot API for NodeJS https://www.npmjs.com/package/node-telegram-bot-api
const TelegramBot = require('node-telegram-bot-api');
//! To save this library to database should use npm: https://www.npmjs.com/package/sqlite-sync
var sqlite = require('sqlite-sync');//requiring

//Connecting - if the file does not exist it will be created
sqlite.connect('library.db'); 

//* -----SQLite DATABASE START----- 
// Create table
//Creating table - you can run any command
sqlite.run(`CREATE TABLE IF NOT EXISTS messages(
    id  INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    from_id INTEGER NOT NULL,
    message_id INTEGER NOT NULL
  );`, function(res) {
    if (res.error)
      throw res.error;
  });

  console.log(sqlite.run('SELECT * FROM messages'));

// insert keys to table
// Inserting - this function can be sync to, look the wiki
// sqlite.insert("messages", {
//     key: "test",
//     from_id: 672742595, 
//     message_id: 8
// });

// sqlite.insert("messages", {
//     key:"hello",
//     from_id: 672742595,
//     message_id: 10
// });

console.log(sqlite.run('SELECT * FROM messages')); //* Check, Show everything what is in db


//* -----SQLite DATABASE FINISH-----

// replace the value below with the Telegram token you receive from @BotFather
//? How to put tokken in configuration
const token = '1875682167:AAE_6IVQig888Jmy3xk1iZ_t_cLU1-OncJ4';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

//* Starting Description
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'This bot "Tobby" allows you to bookmark messages.\n'
    + 'To add message use command:\n'
    + '`/add key`\n'
    + 'To list messages use command:\n'
    + '`/list`\n'
    + 'To remove message use command:\n'
    + '`/remove key`\n'
    , {parse_mode: 'markdown'});
});


//* Hold the data 
// const library = {
//     "test": {from_id: 672742595, id: 8}, //* from_id-my user id in telegram | id: - message id
//     "hello": {from_id: 672742595, id: 10},
// };

//* GET message from database
bot.onText(/\/get ([^;'\"]+)/, (msg, match)  => { //([^;'/"]))/ - limit key for symbols for better security | (.+)/
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
  const key = match[1]; // the captured "whatever"
  const message = getMessage(key);
  //* Cheking if the key exist in the library
  if (message.exists) {
    //    const message = library[key]; //* get an Object
    bot.forwardMessage(msg.chat.id, message.from_id, message.message_id); 
  }
  // send back the matched "whatever" to the chat
});

//* GET LIST of messages for current user
//TODO: 29.05.21 --DONE--  view the list only for admin |   if (msg.from.id !== 672742595) return;
//TODO: 29.05.21 --DONE--  view the list only for user
bot.onText(/\/list/, (msg)  => {
  const chatId = msg.chat.id;
  const fromId = msg.from.id;
  const data = sqlite.run("SELECT `key` FROM messages WHERE `from_id` = ?", [fromId]); //only get column key from table messages //! --Done-- select key because we need to add key not all
  if (data.length == 0) { //check if the user write something or nor, if not send a message
    bot.sendMessage(chatId, 'You did not add anything.');
    return;
  }
  // adding text
  var text = ''; //display it in a row
  var lines = []; // to add some comma
  data.forEach(function(element) {
    lines.push(text += '`' + element.key + '`');
     //'`'  markdown //! --Done-- doesnt work something wrong with select 
  });
  bot.sendMessage(chatId, lines.join(', '), {parse_mod: 'markdown'});
  
});

//*DELETE function
//TODO: 29.05.21 --DONE-- need to check can user delet or not, if user add he can delete, if not user add message he can't delete message | need make a function that will check a user from_id
bot.onText(/\/remove ([^;'\"]+)/, (msg, match) => {
    // const chatId = msg.chat.id;
    const key = match[1];
    const message = getMessage(key);

    if (!message.exists) return; //if there is no messsage from user ---> exit
    if(message.from_id !== msg.from.id) return;
    // if there is message with the key, we need to check. that message that user send now need equals to the message from db
    sqlite.delete('messages', {'key': key}, function(res) { //Check if there is an err
      if (!res.error) {
        bot.sendMessage(msg.chat.id, 'Your message was delete'); // will get what was send to the function  bot.on
    }
  }); //? delete messages from key where message = msg.from.id, not working ---> need to check
});

//* ADD message to database
//* /add + hi(key)
// add text [gif, audio, text, sticker]
// TODO 1: 28.05.21 --DONE-- Check is key consist in database or not? 
// TODO 2: 28.05.21 --DONE-- add message from user to database 
const addMode = {}; //holding chatID and status
bot.onText(/\/add ([^;'\"]+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const key = match[1];
    //! addMode.chatID = {key: key, from: msg.from.id}; --NOT WORKING--

    var text = '';
    // Cheking if the key exist in database or not
    if (isMessageExists(key)) {
         text = 'Sorry, your message with this key already exists.'
    } else {
        addMode[chatId] = {key: key, from: msg.from.id};
        text = 'Please send a message that you want to save, ' + 
        'or send /cancel for cancel.'
    }
    bot.sendMessage(chatId, text);
  });

  //* CANCEL 
  //! --DONE-- Your message is saved in telegram ---> need to fix it
  // bot.onText(/\/cancel/, (msg)  => {
  //   delete addMode[msg.chat.id];
  // });

// Listen for any kind of message. There are different kinds of
// messages.
//TODO 3: 28.05.21 --DONE--  write id statement for add mode if in addmode there is no chat, just exit method but if add mode is is working for chat so it should save message to database 
//TODO 3: 28.05.21 --DONE--  find the correct operator for if statement to check consist or not (IN in SWITCH statement not good)
//TODO 3: 28.05.21 --DONE-- Need to try if statement with in operator --DONE-- !WORKING!
//TODO 3: 28.05.21 --DONE-- if add mode is in the chat need to add message to the database
//*Send message
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  if (!(chatId in addMode)) { //! Debugging: problem with a key check line 81 chatID
    return;
  }
//*CANCEL line 146
  if (typeof(msg.text) !== 'undefined' && msg.text.toLowerCase() == "/cancel") {
    delete addMode[msg.chat.id];
    return
  }

//* Insert to database
  const row = addMode[chatId];
  sqlite.insert("messages", {
    key : row.key,
    from_id: row.from,
    message_id: msg.message_id //? --DONE-- where  message_id comes from - 1.Line79-NO| Line82-YES (because row = addMode[chatID])
  }, function(res) { //Check if there is an err
    if (res.error) {
      bot.sendMessage(chatId, 'Unable to bookmark message. Please, try again later.');
    throw res.error;
  }
  bot.sendMessage(chatId, 'Your message is saved'); // will get what was send to the function  bot.on
});
  // console.log('Success', addMode[chatId]); //check keys and values
  delete addMode[chatId]; //delete an onject from chatId

  // send a message to the chat acknowledging receipt of their message
  // bot.sendMessage(chatId, JSON.stringify(msg)); // will get what was send to the function  bot.on
});

//* Function to Check if the key in the library,
//? will try later to put in a one function --DONE--
function isMessageExists(key) {
    //sql request
    return sqlite.run("SELECT COUNT(*) as cnt FROM messages WHERE `key` = ?", [key])[0].cnt !== 0; //cnt = alias, amount of messages cant be = 0
}

//* Get message by it's own key
function getMessage(key) {
    //sql request
    const data = sqlite.run("SELECT * FROM messages WHERE `key` = ? LIMIT 1", [key]); //cnt = alias, amount of messages cant be = 0
    if (data.length == 0) {
        return {exists: false};
    }
    data[0].exists = true; 
    return data[0]; 
}

//? Others:
//? Telegram bot npm: https://www.npmjs.com/package/node-telegram-bot-api
//? How to debug un vs code: https://www.youtube.com/watch?v=6cOsxaNC06c&t=257s
//? node.js package for database connection with SQLite , and execute SQL commands synchronously or asynchronously: https://www.npmjs.com/package/sqlite-sync
//? SQLite commands: https://www.sqlitetutorial.net/sqlite-commands/


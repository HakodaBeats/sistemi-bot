require('dotenv').config()

const TelegramBot = require('node-telegram-bot-api')
const token = process.env.TOKEN
const bot = new TelegramBot(token, {polling: true})
const {databaseQuery} = require('./database')

let adminChatIDs = [
  1032941924,
  210039308,
  1362468778
]

bot.onText(/\/start/, (msg, match) => {
  const chatID = msg.chat.id

  bot.sendMessage(chatID, "Benvenuto!")
})

bot.onText(RegExp(/\/newPoll (.+)/), async (msg, match) => {
  console.log(msg.chat.id)

  const chatID = msg.chat.id
  const pollName = match[1];

  let response = "Errore: non sei un amministratore!"

  const duplicateCheckQuery = await databaseQuery(`SELECT * FROM Polls WHERE Name = '${pollName}'`)

  if (adminChatIDs.includes(chatID)) {
    if (duplicateCheckQuery.length == 0) {
      databaseQuery(`INSERT INTO Polls (Name) VALUES ('${pollName}');`)
      response = "Sondaggio creato con successo!"
    } else {
      response = "Esiste già un sondaggio con questo nome!"
    }
  }

  bot.sendMessage(chatID, response)
});

bot.onText(/\/vote (.+) (.+)/, async (msg, match) => {
  const chatID = msg.chat.id
  const pollName = match[1]
  const pollAnswer = match[2]

  if (pollAnswer < 0 || pollAnswer > 10) {
    bot.sendMessage(chatID, "Perfavore, inserire un voto tra 0 e 10")
    return
  }
  
  const poll = await databaseQuery(`SELECT * FROM Polls WHERE Name='${pollName}';`)
  console.log(poll)

  if (poll.length == 0) {
    bot.sendMessage(chatID, "Il sondaggio selezionato non esiste")
    return
  } 

  const answersNumber = poll[0].Answers + 1
  const pollID = poll[0].PollID

  const pollAnswers = await databaseQuery(`SELECT * FROM Answers WHERE PollID = '${pollID}'`)

  let average = 0
  for (answer of pollAnswers)
    average += answer.Answer
  average /= answersNumber

  databaseQuery(`INSERT INTO Answers (UserChatID, PollID, Answer) VALUES ('${chatID}', '${pollID}', '${pollAnswer}');`)
  databaseQuery(`UPDATE Polls SET Answers = '${answersNumber}', Average = '${average}' WHERE PollID = '${pollID}';`)
})

bot.on('message', (msg) => {
  const chatID = msg.chat.id
})

bot.on('polling_error', console.log)
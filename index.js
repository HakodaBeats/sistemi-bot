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

let commands = 
  `Questa è la lista dei comandi:\n\n` +
  `1. Comando: /newPoll nomesondaggio\n` +
  `Descrizione: serve a creare nuovi sondaggi\n` + 
  `Esempio: /newPoll uborc\n\n` +
  `2. /vote nomesondaggio voto\n` + 
  `Descrizione: serve a votare un sondaggio\n` + 
  `Esempio: /vote uborc 8\n\n` +
  `3. /pollsList\n` +
  `Descrizione: serve a visualizzare la lista dei sondaggi\n\n` +
  `4. /viewPoll nomesondaggio\n` +
  `Descrizione: serve a visualizzare i dettagli di un sondaggio\n` + 
  `Esempio: /viewPoll uborc\n\n` + 
  `5. /commands\n` + 
  `Descrizione: serve a visualizzare la lista dei comandi del bot\n\n` +
  `6. /requestAdmin\n` + 
  `Descrizione: serve a richiedere i poteri di amministrazione\n\n` +
  `Questo è tutto! Per avere altre informazioni o in caso di perpresittà` +
  `contatta il mitico creatore di questo meraviglioso bot: @ThatsHakoda`

bot.onText(/\/start/, (msg, match) => {
  const chatID = msg.chat.id
  const nomeUtente = msg.from.first_name
  const message = `Benvenuto ${nomeUtente}!\n` + commands

  console.log(`Nuovo accesso da ${chatID} - Username: ${nomeUtente}`)

  bot.sendMessage(chatID, message)
})

bot.onText(/\/requestAdmin/, (msg, match) => {
  const chatID = msg.chat.id
  const nomeUtente = msg.from.first_name

  const message = 
    `L'utente ${nomeUtente} ha fatto richiesta di diventare amministratore\n\n` + 
    `ID Utente: ${chatID}`

  console.log(`Richiesta di amministrazione da ${chatID} - Username: ${nomeUtente}`)

  bot.sendMessage(chatID, "La richiesta è appena stata inviata a @ThatsHakdoa")
  bot.sendMessage(adminChatIDs[0], message)
})

bot.onText(/\/commands/, (msg, match) => {
  const chatID = msg.chat.id

  bot.sendMessage(chatID, commands)
})

bot.onText(/\/newPoll (.+)/, async (msg, match) => {
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

  console.log(`Tentativo di creazione di sondaggio da ${chatID} - Username: ${nomeUtente}`)

  bot.sendMessage(chatID, response)
});

bot.onText(/\/vote (.+) (.+)/, async (msg, match) => {
  const chatID = msg.chat.id
  const pollName = match[1]
  const pollVote = parseInt(match[2])

  const previousVotes = await databaseQuery(`SELECT * FROM Answers WHERE UserChatID = '${chatID}' AND PollName = '${pollName}';`)

  console.log(previousVotes)

  if (previousVotes.length != 0) {
    bot.sendMessage(chatID, "Hai già votato questo sondaggio!")
    return
  }

  if (pollVote < 0 || pollVote > 10) {
    bot.sendMessage(chatID, "Perfavore, inserire un voto tra 0 e 10")
    return
  }
  
  const poll = await databaseQuery(`SELECT * FROM Polls WHERE Name='${pollName}';`)

  if (poll.length == 0) {
    bot.sendMessage(chatID, "Il sondaggio selezionato non esiste")
    return
  }

  databaseQuery(`INSERT INTO Answers (UserChatID, PollName, Answer) VALUES ('${chatID}', '${pollName}', '${pollVote}');`)

  let newAverage = ((poll[0].Average * poll[0].Answers) + pollVote) / (poll[0].Answers + 1)
  let answersNumber = poll[0].Answers + 1

  databaseQuery(`UPDATE Polls SET Answers = '${answersNumber}', Average = '${newAverage}' WHERE Name = '${pollName}';`)
  
  console.log(`Tentativo di voto da ${chatID} - Username: ${nomeUtente}`)

  bot.sendMessage(chatID, "Hai votato con successo!")
})

bot.onText(/\/pollsList/, async (msg, match) => {
  const chatID = msg.chat.id

  let polls = await databaseQuery('SELECT * FROM Polls;')

  let message = "Ecco la lista dei sondaggi creati:\n\n"
  polls.forEach(poll => {
    message += `${poll.PollID}. ${poll.Name}\n`
  })
  message += "\nPer visualizzare più informazioni su un sondaggio, digita il comando seguente comando:\n\n/viewPoll nomesondaggio"

  console.log(`Visualizzazione della lista sondaggi da ${chatID} - Username: ${nomeUtente}`)

  bot.sendMessage(chatID, message)
})

bot.onText(/\/viewPoll (.+)/, async (msg, match) => {
  const chatID = msg.chat.id
  const pollName = match[1]

  const poll = await databaseQuery(`SELECT * FROM Polls WHERE Name = '${pollName}'`)

  if(poll.length == 0) {
    bot.sendMessage(chatID, "Il sondaggio richiesto non esiste")
    return
  }

  let message = 
    `Ecco le informazioni del sondaggio selezionato:\n\n` +
    `Nome del sondaggio: ${poll[0].Name}\n` +
    `Numero di risposte: ${poll[0].Answers}\n` +
    `Media delle risposte: ${poll[0].Average.toFixed(2)}\n\n` +
    `Per visualizzare la lista dei sondaggi, digita il seguente comando:\n\n/pollsList`

  console.log(`Visualizzazione statistiche sondaggio da ${chatID} - Username: ${nomeUtente}`)

  bot.sendMessage(chatID, message)
})

bot.on('polling_error', console.log) // Non ho la più pallida idea di come funzioni
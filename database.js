const mariadb = require('mariadb')  

const pool = mariadb.createPool({
  host: `${process.env.DATABASE_HOST}`,
  user: `${process.env.DATABASE_USER}`,
  password: `${process.env.DATABASE_PASSWORD}`,
  connectionLimit: 5
})

async function databaseQuery(queryCommand) {
  let connection;
  let result

  try {
    connection = await pool.getConnection();
    await connection.query("USE SistemiBot;")
    result = await connection.query(queryCommand)

    if(connection)
      connection.end()

  } catch (error) {
	  throw error
  }

  return result
}

module.exports.databaseQuery = databaseQuery
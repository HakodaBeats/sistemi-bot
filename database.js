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

  } catch (error) {
	  throw error
  } finally {
    if(connection) 
      connection.end()
  }

  return result 
}

module.exports.databaseQuery = databaseQuery
/** User class for message.ly */
const db = require("../db");
const ExpressError = require("../expressError");
const bcrypt = require("bcrypt")
const {BCRYPT_WORK_FACTOR} = require("../config")

/** User of the site. */

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  // static async checkValidUser(username) {
  //   const results = await db.query(`SELECT username FROM users WHERE username=$1`,[username]);
  //   if (results.rows[0] === 0) {
  //     return false;
  //   }
  //   return true;
  // }

  static async register(username, password, first_name, last_name, phone) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    let joinAt = new Date()
    //save to db
    const results = await db.query(`INSERT INTO users (username, password, first_name, last_name, phone, join_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING username, password, first_name, last_name, phone`, [username, hashedPassword, first_name, last_name, phone, joinAt]);
    return results.rows[0];
   }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
      const results = await db.query(`SELECT username, password FROM users WHERE username=$1`, [username]);
          if (results.rows[0]) {
            return (await bcrypt.compare(password, results.rows[0].password))
          }
    }

//   /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
      const currDate = new Date();
      const user = await db.query(`UPDATE users SET last_login_at=$2 WHERE username=$1`, [username, currDate]);
  }

//   /** All: basic info on all users:
//    * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
      const results = await db.query(`SELECT username, first_name, last_name, phone FROM users`);
      console.log(results.rows)
      return results.rows
   }

//   /** Get: get user by username
//    *
//    * returns {username,
//    *          first_name,
//    *          last_name,
//    *          phone,
//    *          join_at,
//    *          last_login_at } */

  static async get(username) {
    const results = await db.query(`SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users WHERE username = $1`,[username]);
    if (results.rows.length == 0){
      return new ExpressError(`Username ${username} is not found.`, 404);
    }
    const { usrname, first_name, last_name, phone, join_at, last_login_at } = results.rows[0];
    return {usrname, first_name, last_name, phone, join_at, last_login_at};
   }

//   /** Return messages from this user.
//    *
//    * [{id, to_user, body, sent_at, read_at}]
//    *
//    * where to_user is
//    *   {username, first_name, last_name, phone}
//    */

  static async messagesFrom(username) {
    const user = await db.query(`SELECT username FROM users WHERE username=$1`, [username]);  
    const results = await db.query(`SELECT id, to_username, body, sent_at, read_at FROM messages WHERE from_username=$1`, [username]);
    if (user.rows.length == 0){
      return new ExpressError(`Username ${username} is not found.`, 404);
    }
    return results.rows;
   }

//   /** Return messages to this user.
//    *
//    * [{id, from_user, body, sent_at, read_at}]
//    *
//    * where from_user is
//    *   {username, first_name, last_name, phone}
//    */

  static async messagesTo(username) {
    const user = await db.query(`SELECT username FROM users WHERE username=$1`, [username]); 
    const results = await db.query(`SELECT id, from_username, body, sent_at, read_at FROM messages WHERE to_username=$1`,[username]);
    console.log(user)
    if (user.rows.length == 0){
      return new ExpressError(`Username ${username} is not found.`, 404);
    }
    return results.rows.map(r=> {r.id, r.from_username, r.body, r.sent_at, r.read_at});
   }
}


module.exports = User;
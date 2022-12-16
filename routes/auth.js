const express = require("express");
const router = new express.Router();
const jwt = require("jsonwebtoken")
const User = require("../models/user")

const ExpressError = require("../expressError");
const db = require("../db");
const bcrypt = require("bcrypt");
const {BCRYPT_WORK_FACTOR, SECRET_KEY} = require("../config")
const { ensureLoggedIn, ensureCorrectUser, authenticateJWT } = require("../middleware/auth")


/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post('/login', async (req, res, next)=>{
    const {username, password} = req.body;
    try {
        if (!username || !password) {
            throw new ExpressError("Username & Password required!", 400);
        }
        const results = await User.authenticate(username, password);
        if (results) {
            User.updateLoginTimestamp(username);
            const token = jwt.sign({username}, SECRET_KEY);
            return res.json({_token: token});
        } else {
            throw new ExpressError("Invalid Username & Password!", 400);
        }
    } catch(e) {
        return next(e);
    }
})

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post('/register', async (req, res, next)=>{
    const { username, password, first_name, last_name, phone } = req.body;
    try {
        if (!username || !password || !first_name || !last_name || !phone) {
            throw new ExpressError("Request must have username, password, first_name, last_name & phone", 400);}
        const registeredUser = await User.register(username, password, first_name, last_name, phone);
        if (registeredUser) {
        const logIn = await User.authenticate(username, password);
        if (logIn) {
            User.updateLoginTimestamp(username);
            let user = registeredUser.username;
            const token = jwt.sign({user}, SECRET_KEY);
            return res.json({_token: token});
        }
        }
    } catch (e) {
        if (e.code === '23505'){
            return next(new ExpressError("Username taken. Please pick another!", 400));
          }
        return next(e);
    }
    
})

module.exports = router;
const express = require("express");
const router = new express.Router();
const jwt = require("jsonwebtoken")
const User = require("../models/user")

const ExpressError = require("../expressError");
const db = require("../db");
const bcrypt = require("bcrypt");
const {BCRYPT_WORK_FACTOR, SECRET_KEY} = require("../config")
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth")

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/

router.get('/', ensureLoggedIn, async (req,res,next)=>{
    const results = await User.all();
    return res.json({Users: results})
})


/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/

router.get('/:username', ensureLoggedIn, ensureCorrectUser, async (req,res,next)=>{
    try {
        const username = req.params.username;
        const results = await User.get(username);
        return res.json({user: results})
    } catch(e) {
        return next(e);
    }
})

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get('/:username/to', ensureLoggedIn, ensureCorrectUser, async (req, res, next)=>{
    const username = req.params.username;
    const results = await User.messagesTo(username);
    return res.json({messages: results})
})


/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get('/:username/from', ensureLoggedIn, async (req, res,next)=>{
    const username = req.params.username;
    const results = await User.messagesFrom(username);
    console.log(results);
    return res.json({messages: results})
})

module.exports = router;
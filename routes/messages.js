const express = require("express");
const router = new express.Router();
const jwt = require("jsonwebtoken")
const Message = require("../models/message")

const ExpressError = require("../expressError");
const db = require("../db");
const bcrypt = require("bcrypt");
const {BCRYPT_WORK_FACTOR, SECRET_KEY} = require("../config")
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth")

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id', ensureLoggedIn, async(req,res,next)=>{
    try {
        const msgId = req.params.id;
        const result = await Message.get(msgId);
        if (req.user.username == result.from_user.username || req.user.username == result.to_user.username) {
            return res.json({message: result});
        } else {
            throw new ExpressError("Only sender or recipient may view this message.", 401);
        }
        
    } catch(e) {
        return next(e);
    }
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', ensureLoggedIn, async(req,res,next)=>{
    const {to_username, body} = req.body;
    const message = await Message.create(req.user.username, to_username, body);
    return res.json({message: message});
})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id', ensureLoggedIn, async(req,res,next)=>{
    try {
        const msgId = req.params.id;
        const msg = await Message.get(msgId);
        if (req.user.username == msg.to_user.username) {
            await Message.markRead(msgId);
            return res.json({message: {id: msg.id, read_at: msg.read_at}});
        } else {
        throw new ExpressError("Cannot mark another users messages as read!", 401);
        }
    } catch(e) {
        return next(e)
    }
})

module.exports = router;


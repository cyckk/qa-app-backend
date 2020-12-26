const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const admin_schema = require('../DataBase/admin_user');
const { json } = require('body-parser');

router.post('/login', async (req, res) => {
  try {
    const email = req.body.email;
    let password = req.body.password;
    const data = await admin_schema.findOne({
      email: email,
    });
    const payload = { emai: email, password: password };
    if (data == null) {
      res.json({ err: 1, data: data, msg: 'Email Not found' });
    } else {
      const match = await bcrypt.compare(password, data.password);
      if (!match) {
        res.json({ err: 1, msg: 'PassWord Not match', data: data });
      } else {
        const token = jwt.sign(payload, process.env.AccessTokenSecret);
        res.json({ err: 0, msg: 'Login Success', data: data, token: token });
      }
    }
  } catch (error) {
    res.json({ err: 1, err: error, msg: 'Somethig Wrong' });
  }
});

// Add member Route
router.post('/create', async (req, res) => {
  try {
    const newemail = req.body.email;
    let password = req.body.password;
    password = await bcrypt.hash(password, 10);
    const token = req.header('Authorization').split('Bearer')[1];
    const author_email = req.query.email;
    const verify = await jwt.verify(token, process.env.AccessTokenSecret);
    if (author_email == 'dixitjhinkwan@yahoo.com') {
      const savedata = new admin_schema({
        email: newemail,
        password: password,
      });
      const data = await savedata.save();
      res.json({ err: 0, data: data });
    } else {
      res.json({ err: 1, msg: 'You dont not have Access Denied' });
    }
  } catch (error) {
    if (error.name == 'MongoError') {
      res.json({ err: 1, msg: 'email already found' });
    } else if (error.name == 'JsonWebTokenError') {
      res.json({ err: 1, msg: 'Your Token is not Verified' });
    } else {
      res.json({ err: 1, msg: 'something Wrong', errmsg: error });
    }
  }
});

module.exports = router;

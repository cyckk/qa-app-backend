import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import auth from './middlewares/auth';

// import jwt-decode from 'jwt-decode';

import { User, Role, Permission } from '../models/user';

const router = express.Router();

router.get('/', () => {
  console.log('route handler');
});

router.post('/login', async (req, res) => {
  console.log('login');
  try {
    const email = req.body.email;
    let password = req.body.password;
    const user = await User.findOne({
      email: email,
    });

    console.log('user', user);

    if (user == null) {
      res.json({ err: 1, data: user, msg: 'Email Not found' });
    } else {
      const passVerified = await bcrypt.compare(password, user.password);
      if (!passVerified) {
        res.json({ err: 1, msg: 'Email or password is incorrect', user });
      } else {
        const payload = { email: user.email, permissions: user.permissions };
        console.log('payload', payload);
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: '2h',
        });
        const response = {
          email: user.email,
          name: user.name,
          active: user.active,
          role: user.role,
        };
        res.status(200).json({
          err: 0,
          msg: 'Login Success',
          user: response,
          token: token,
        });
      }
    }
  } catch (error) {
    console.log(error);
    res.json({ err: 1, err: error, msg: 'Something Wrong' });
  }
});

// Add member Route
router.post('/addUser', auth, async (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    let password = req.body.password;
    const role = req.body.role;
    let permissions = ['viewMy'];

    console.log('password ', password);

    if (role == 'admin') {
      permissions = ['admin', 'viewAll', 'add', 'edit'];
    }
    password = await bcrypt.hash(password, 10);

    let token = req.header('Authorization').split('Bearer')[1];

    let currentUser = jwt.decode(token);

    // currentUser = await User.findOne({ email: currentUser.email });

    if (currentUser.permissions.includes('admin')) {
      let newUser = {
        name: name,
        email: email,
        password: password,
        role: role,
        permissions,
        active: true,
      };
      newUser = await User.create(newUser);
      res.json({ err: 0, user: newUser });
    } else {
      res.json({ err: 1, msg: 'Access denied' });
    }
  } catch (error) {
    if (error.name == 'MongoError') {
      res.json({ err: 1, msg: 'email already found' });
    } else if (error.name == 'JsonWebTokenError') {
      res.json({ err: 1, msg: 'Your Token is not Verified' });
    } else {
      console.log('error ', error);
      res.json({ err: 1, msg: 'something Wrong', errmsg: error });
    }
  }
});

router.post('/addRole', auth, async (req, res) => {
  try {
    const role = req.body.role;

    let currentUser = jwt.decode(token);

    currentUser = await User.findOne({ email: currentUser.email });

    if (user.permissions.includes('admin')) {
      let newRole = new Role({
        name: role,
      });

      newRole = await newRole.save();
      res.json({ err: 0, role: newRole });
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

router.get('/init/:ps', async (req, res) => {
  try {
    const secret = req.params.ps;
    console.log('secret', req.params);
    if (secret == '1o1') {
      const password = await bcrypt.hash('admin123', 10);
      const newUser = {
        name: 'Admin',
        email: 'admin@datatrained.com',
        password,
        role: 'admin',
        permissions: ['admin', 'viewAll', 'edit', 'add'],
        active: true,
      };
      const user = await User.create(newUser);

      let permissions = [
        'admin',
        'viewAll',
        'viewMy',
        'viewTl',
        'viewSm',
        'edit',
        'add',
      ];

      permissions.forEach(async (permission) => {
        await Permission.create({
          name: permission,
        });
      });

      if (user) {
        console.log('done', user);
        res.json({ err: 0, msg: 'App Initailized with a admin user' });
      } else {
        res.send('Something failed');
      }
    } else {
      res.json({ err: 1, msg: 'Access denied' });
    }
  } catch (err) {
    console.log('error ', err.message);
    res.json({ err: 1, msg: err.message });
  }
});

router.get('/get-user/:userID', auth, async (req, res) => {
  const userID = req.params.userID;
  try {
    const data = await User.findById({ _id: userID });
    res.json({ err: 0, data: data });
  } catch (error) {
    res.status(404).json({ err: 1, message: 'User Not Found' });
  }
});

router.get('/allUser', auth, async (req, res) => {
  try {
    let token = req.header('Authorization').split('Bearer')[1];
    console.log(token);

    let currentUser = await jwt.decode(token);
    const data = await User.findOne({ email: currentUser.email });
    const has_permission = data.permissions.includes('admin');

    if (has_permission) {
      let allUser = await User.find();
      allUser = allUser.map((user) => {
        return {
          permissions: user.permissions,
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
        };
      });
      res.json({ err: 0, data: allUser });
    } else {
      res.json({ err: 404, msg: 'Access Denied' });
    }
  } catch (error) {
    res.json({ err: 1, error: error.message });
  }
});

router.put('/updateUser', auth, async (req, res) => {
  const Token = req.header('Authorization').split('Bearer')[1];
  const currentUser = await jwt.decode(Token);
  const have_updatePermission = currentUser.permissions.includes('admin');

  try {
    if (have_updatePermission) {
      const data = req.body;
      data.password = await bcrypt.hash(data.password, 10);
      let updateUser = await User.findByIdAndUpdate(
        data._id,
        {
          $set: data,
        },
        { new: true }
      );
      res.status(200).json({ update: updateUser });
    } else {
      res.status(401).json({ err: 0, msg: 'Auth fail' });
    }
  } catch (error) {
    res.json({ err: 1, msg: 'Something Went Wrong', error: error.message });
  }
});

export default router;

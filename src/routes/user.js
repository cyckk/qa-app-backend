import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import _ from 'lodash';

import auth from './middlewares/auth';

// import jwt-decode from 'jwt-decode';

import { User, Role, Permission } from '../models/user';

const router = express.Router();

router.post('/checkAuth', auth, (req, res) => {
  console.log('route handler');
  res.status(200).send(true);
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
        const payload = {
          id: user._id,
          email: user.email,
          permissions: user.permissions,
          name: user.name,
        };
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

// Add role
router.post('/addRole', auth, async (req, res) => {
  try {
    const role = req.body.role;
    let currentUser = jwt.decode(req.token);

    currentUser = await User.findOne({ email: currentUser.email });

    if (currentUser.permissions.includes('admin')) {
      let newRole = new Role({
        name: role,
      });
      newRole = await newRole.save();
      res.json({ err: 0, role: newRole, msg: 'New Role Added' });
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

// Get role
router.get('/getRoles', auth, async (req, res) => {
  try {
    const role = req.body.role;
    let currentUser = jwt.decode(req.token);

    if (currentUser.permissions.includes('admin')) {
      const roles = await Role.find({});
      res.json({ err: 0, roles, msg: 'Roles' });
    } else {
      res.json({ err: 1, msg: 'Access Denied' });
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

//
router.get('/init/:ps', async (req, res) => {
  try {
    const secret = req.params.ps;
    console.log('secret', req.params);
    if (secret == '1o1') {
      let permissions = [
        'admin',
        'viewAll',
        'viewMy',
        'viewTl',
        'viewSm',
        'edit',
        'add',
        'editUser',
      ];

      permissions.forEach(async permission => {
        await Permission.create({
          name: permission,
        });
      });

      let dashboardView = [
        'clock',
        'auditDone',
        'recentAudits',
        'targetAudits',
        'auditChart',
        'auditChartCounsellor',
        'auditChartCounsellorTl',
      ];

      const password = await bcrypt.hash('admin123', 10);
      const newUser = {
        name: 'Admin',
        email: 'admin@datatrained.com',
        password,
        role: 'admin',
        permissions: ['admin', 'viewAll', 'edit', 'add', 'editUser'],
        active: true,
        dashboardView,
      };
      const user = await User.create(newUser);

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

// Get user Info
router.get('/getUser/:userID', auth, async (req, res) => {
  console.log('req params ', req.params);
  const userID = req.params.userID;
  try {
    let user = await User.findById({ _id: userID });

    user = {
      permissions: user.permissions,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      dashboardView: user.dashboardView,
      todaysTarget: user.todaysTarget,
    };
    res.json({ err: 0, user });
  } catch (error) {
    console.log('error ', error);
    res.status(404).json({ err: 1, message: 'User Not Found' });
  }
});

// Get All User
router.get('/allUser', auth, async (req, res) => {
  try {
    let token = req.header('Authorization').split('Bearer')[1];
    console.log(token);

    let currentUser = await jwt.decode(token);
    const has_permission = currentUser.permissions.includes('admin');

    if (has_permission) {
      let allUser = await User.find();
      allUser = allUser.map(user => {
        return {
          permissions: user.permissions,
          id: user._id,
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

// Get All Users name and role
router.get('/allUsersRole', auth, async (req, res) => {
  try {
    let allUser = await User.find();
    allUser = allUser.map(user => {
      return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
    });
    res.json({ err: 0, users: allUser });
  } catch (error) {
    res.json({ err: 1, error: error.message });
  }
});

// Update Any User
router.put('/updateUser', auth, async (req, res) => {
  const Token = req.header('Authorization').split('Bearer')[1];
  const currentUser = await jwt.decode(Token);
  const have_updatePermission = currentUser.permissions.includes('editUser');

  try {
    if (have_updatePermission) {
      const data = req.body.user;
      // data.password = await bcrypt.hash(data.password, 10);
      let updatedUser = await User.findByIdAndUpdate(
        data.id,
        {
          $set: data,
        },
        { new: true }
      );
      updatedUser = {
        permissions: updatedUser.permissions,
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        active: updatedUser.active,
        dashboardView: updatedUser.dashboardView,
        todaysTarget: updatedUser.todaysTarget,
      };
      res.status(200).json({ err: 0, update: updatedUser });
    } else {
      res.status(401).json({ err: 0, msg: 'Access Denied' });
    }
  } catch (error) {
    res.json({ err: 1, msg: 'Something Went Wrong', error: error.message });
  }
});

// Toggle user account status route
router.put('/toggleStatus', auth, async (req, res) => {
  const token = req.token;

  console.log('req body ', req.body);

  try {
    const currentUser = await jwt.decode(token);
    const have_updatePermission = currentUser.permissions.includes('admin');
    if (have_updatePermission) {
      const id = req.body.payload.id;
      const active = req.body.payload.active;
      const toggledStatus = !active;
      // data.password = await bcrypt.hash(data.password, 10);
      // const user = await User.findById(id);
      let updatedUser = await User.findByIdAndUpdate(
        id,
        {
          $set: {
            active: toggledStatus,
          },
        },
        { new: true }
      );

      updatedUser = {
        permissions: updatedUser.permissions,
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        active: updatedUser.active,
        dashboardView: updatedUser.dashboardView,
      };
      console.log('updatedUser ', updatedUser);
      res.status(200).json({ err: 0, user: updatedUser });
    } else {
      res.status(401).json({ err: 0, msg: 'Access Denied' });
    }
  } catch (error) {
    res.json({ err: 1, msg: 'Something Went Wrong', error: error.message });
  }
});

router.post('/addPermission', auth, async (req, res) => {
  const Token = req.header('Authorization').split('Bearer')[1];
  const currentUser = await jwt.decode(Token);

  try {
    const have_addPermission = currentUser.permissions.includes('admin');
    if (have_addPermission) {
      const permission = await Permission.create(req.body);
      res.json({ err: 0, msg: 'Permission Created', data: permission });
    } else {
      res.status(401).json({ err: 1, msg: 'Auth Fail' });
    }
  } catch (error) {
    res.json({ err: 1, msg: 'Some Went Wrong', error: error.message });
  }
});

router.get('/permissions', auth, async (req, res) => {
  const token = req.token;

  try {
    const currentUser = await jwt.decode(token);
    if (currentUser.permissions.includes('admin')) {
      const permissions = await Permission.find();

      res.json({ err: 0, msg: 'Permissions fetched', permissions });
    } else {
      res.status(401).json({ err: 1, msg: 'Access Denied' });
    }
  } catch (error) {
    res.json({ err: 1, msg: 'Some Went Wrong', error: error.message });
  }
});

router.put('/setDashboard', auth, async (req, res) => {
  const token = req.token;
  const user = req.body.user;

  try {
    const currentUser = jwt.decode(token);

    if (currentUser.permissions.includes('admin')) {
      const userToBeUpdated = await User.findById(user.id);
      let dashboardView = userToBeUpdated.dashboardView;

      if (user.operation == 'add') {
        dashboardView = _.union(dashboardView, [user.dashboardItem]);
      }
      if (user.operation == 'delete') {
        dashboardView = _.remove(
          dashboardView,
          item => item != user.dashboardItem
        );
      }
      let updatedUser = await User.findByIdAndUpdate(
        user.id,
        {
          $set: {
            dashboardView: dashboardView,
          },
        },
        {
          new: true,
        }
      );
      updatedUser = {
        permissions: updatedUser.permissions,
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        active: updatedUser.active,
        dashboardView: updatedUser.dashboardView,
      };
      res.status(200).json({ err: 0, user: updatedUser });
    } else {
      res.status(401).json({ err: 1, msg: 'Access Denied' });
    }
  } catch (error) {
    res.json({ err: 1, msg: 'Some Went Wrong', error: error.message });
  }
});

export default router;

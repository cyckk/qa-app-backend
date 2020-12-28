import jwt from 'jsonwebtoken';

const auth = async (req, res, next) => {
  // console.log('heaadr ', req.headers);
  if (!req.header('Authorization')) {
    console.log('no auth header');
    res.json({ err: 1, msg: 'You are not logged in' });
  } else {
    // console.log('header ', req.header('Authorization').split('Bearer'));
    let token = req.header('Authorization').split('Bearer')[1];
    let verify = false;
    try {
      verify = await jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.log('errror in auth ', err);
    }

    if (verify) {
      req.token = token;

      next();
    } else {
      res.status(401).json({ err: 1, msg: 'Session expired' });
    }
  }
};

export default auth;

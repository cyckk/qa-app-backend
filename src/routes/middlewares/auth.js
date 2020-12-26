import jwt from 'jsonwebtoken';

const auth = async (req, res, next) => {
  console.log('header ', req.header('Authorization').split('Bearer'));
  let token = req.header('Authorization').split('Bearer')[1];
  // const author_email = req.query.email;
  const verify = await jwt.verify(token, process.env.JWT_SECRET);

  if (verify) {
    next();
  } else {
    res.json({ err: 1, msg: 'You are not logged in' });
  }
};

export default auth;

const {findUserById} = require('../db/user');

const userAuth = (req, res, next) => {
  const userId = req.cookies['user_id'];

  const user = findUserById(userId);

  if (!user) {
    return res.status(403).redirect('/login');
  }

  req.user = user;
  return next();
};

module.exports = {
  userAuth,
};

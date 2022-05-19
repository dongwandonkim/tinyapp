const {findUserById} = require('../db/user');

const userAuth = (req, res, next) => {
  const userId = req.session.user_id;

  const user = findUserById(userId);

  if (!user) {
    return res.status(403).render('urls_error', {
      message: 'Please login/register',
      useButton: false,
      user,
    });
  }

  req.user = user;
  return next();
};

module.exports = {
  userAuth,
};

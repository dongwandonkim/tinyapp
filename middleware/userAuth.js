const {findUserById} = require('../db/user');

/** check if user is logged in */
const userAuth = (req, res, next) => {
  const userId = req.session.userId; // check if cookie is passed in through request

  const user = findUserById(userId); // check if found userId exists in userDB

  if (!user) {
    // if user not exists in userDB render relevant msg through HTML
    return res.status(403).render('urls_error', {
      message: 'Please login/register',
      useButton: false,
      user,
    });
  }

  req.user = user; // put found user on to req as a property
  return next();
};

module.exports = {
  userAuth,
};

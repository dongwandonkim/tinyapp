const urlDatabase = {
  b2xVn2: {
    longURL: 'http://www.lighthouselabs.ca',
    userId: 'abcde1',
  },
  '9sm5xK': {
    longURL: 'http://www.google.com',
    userId: '1abcde',
  },
};

const findUrlsByUserId = (userId) => {
  const tempObj = {};
  for (const key in urlDatabase) {
    if (urlDatabase[key].userId === userId) {
      tempObj[key] = urlDatabase[key];
    }
  }
  return tempObj;
};

const getUserByEmail = (email) => {};

module.exports = {urlDatabase, findUrlsByUserId};

const urlDatabase = {
  b2xVn2: {
    longURL: 'http://www.lighthouselabs.ca',
    userId: 'user01',
    createdAt: '',
    visits: 0,
  },
  '9sm5xK': {
    longURL: 'http://www.google.com',
    userId: 'user02',
  },
  awefji: {
    longURL: 'http://www.espn.com',
    userId: 'user01',
  },
  '4fj3xK': {
    longURL: 'http://www.cbc.ca',
    userId: 'user01',
  },
  a89gjh: {
    longURL: 'http://www.netflix.com',
    userId: 'user02',
  },
};

/** find all urls related to user */
const findUrlsByUserId = (userId) => {
  const tempObj = {};
  for (const key in urlDatabase) {
    if (urlDatabase[key].userId === userId) {
      tempObj[key] = urlDatabase[key];
    }
  }
  return tempObj;
};

module.exports = {urlDatabase, findUrlsByUserId};

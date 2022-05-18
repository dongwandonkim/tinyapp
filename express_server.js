const express = require('express');
const app = express();
const bp = require('body-parser');
const cookieParser = require('cookie-parser');
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

app.use(bp.urlencoded({extended: true}));
app.use(cookieParser());

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
const users = {};

const validURL = (str) => {
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$',
    'i'
  ); // fragment locator
  return !!pattern.test(str);
};

const generateRandomString = () => {
  let r = (Math.random() + 1).toString(36).substring(2, 8);

  return r;
};

const findUserByEmail = (dbObj, emailToCheck) => {
  for (const key in dbObj) {
    if (users[key].email === emailToCheck) {
      return users[key];
    }
  }
  return false;
};

const findUserById = (id) => {
  for (const key in users) {
    if (users[key].id === id) {
      return users[key];
    }
  }
  return false;
};

const userPerm = (req, res, next) => {
  const userId = req.cookies['user_id'];

  const user = findUserById(userId);

  if (user.id === userId) {
    req.user = user;
    return next();
  }

  return res
    .status(403)
    .send({message: 'should be logged in to create new shorten link'});
};

app.get('/', (req, res) => {
  res.send('Hello!');
});

/** User Auth */
app.post('/login', (req, res) => {
  const {email, password} = req.body;

  const user = findUserByEmail(users, email);

  if (user && user.password === password) {
    res.cookie('user_id', user.id);
    return res.redirect('/urls');
  }

  res.status(403).send({message: 'invalid credentials'});
});

app.get('/login', (req, res) => {
  const userId = req.cookies['user_id'];
  const templateVars = {
    username: users[userId],
  };
  res.render('urls_login', templateVars);
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const userId = req.cookies['user_id'];
  const templateVars = {
    username: users[userId],
  };

  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  const {email, password} = req.body;
  if (!email.length || !password.length) {
    return res.status(400).send({message: 'invalid email or password'});
  }
  const user = findUserByEmail(users, email);

  if (user) {
    return res.status(400).send({message: 'email already in use'});
  }

  const userId = generateRandomString();
  users[userId] = {id: userId, email, password};

  res.cookie('user_id', userId);
  res.redirect('/urls');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  const userId = req.cookies['user_id'];
  const templateVars = {
    username: users[userId],
    urls: urlDatabase,
  };

  res.render('urls_index', templateVars);
});

app.post('/urls', userPerm, (req, res) => {
  const {longURL} = req.body;

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {longURL, userId: req.user.id};

  console.log(urlDatabase);

  res.redirect(`/urls/${shortURL}`);
});

app.get('/urls/new', (req, res) => {
  const userId = req.cookies['user_id'];
  const templateVars = {
    username: users[userId],
  };

  res.render('urls_new', templateVars);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const {shortURL} = req.params;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

app.get('/u/:shortURL', (req, res) => {
  const {shortURL} = req.params;

  if (!urlDatabase.hasOwnProperty(shortURL)) {
    return res.status(400).send(`<h2>${shortURL}</h2> not exist`);
  }

  const longURL = urlDatabase[shortURL].longURL;

  if (validURL(longURL)) {
    return res.redirect(longURL);
  }
  res.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:id', (req, res) => {
  const editedLongUrl = req.body.id;
  const shortUrl = req.params.id;
  urlDatabase[shortUrl].longURL = editedLongUrl;

  res.redirect('/urls');
});

app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params;
  const userId = req.cookies['user_id'];

  let templateVars = {};
  if (urlDatabase.hasOwnProperty(shortURL)) {
    templateVars = {
      shortURL,
      longURL: urlDatabase[shortURL].longURL,
      username: users[userId],
    };
    return res.render('urls_show', templateVars);
  }

  res.status(400).send({message: 'url is invalid'});
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

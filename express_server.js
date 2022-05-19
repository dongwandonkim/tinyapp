const express = require('express');
const app = express();
const bp = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const PORT = 8080; // default port 8080

/* local imports */
const {users} = require('./db/user');
const {urlDatabase, findUrlsByUserId} = require('./db/urls');
const {findUserByEmail, generateRandomString, validURL} = require('./helpers');
const {userAuth} = require('./middleware/userAuth');

app.set('view engine', 'ejs');

app.use(bp.urlencoded({extended: true}));
app.use(
  cookieSession({
    name: 'session',
    keys: ['lhl-tinyapp'],
    maxAge: 24 * 60 * 60 * 1000,
  })
);
/** root */
app.get('/', (req, res) => {
  const userId = req.session.userId;

  if (userId === undefined || !userId) {
    return res.redirect('/login');
  }
  res.redirect('/urls');
});

/** User Auth */
app.post('/login', (req, res) => {
  const {email, password} = req.body;

  const user = findUserByEmail(email, users);

  if (!user) {
    return res.status(403).render('urls_error', {
      message: 'invalid credentials',
      useButton: false,
      user: null,
    });
  }

  const passwordCheck = bcrypt.compareSync(password, user.password);

  if (!passwordCheck) {
    return res.status(403).render('urls_error', {
      message: 'invalid credentials',
      useButton: false,
      user: null,
    });
  }

  req.session.userId = user.id;
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  const userId = req.session.userId;

  if (userId) {
    return res.redirect('/urls');
  }

  res.render('urls_login', {user: null});
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const userId = req.session.userId;

  if (userId) {
    return res.redirect('/urls');
  }

  const templateVars = {
    user: null,
  };

  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  const {email, password} = req.body;
  if (!email.length || !password.length) {
    return res.status(400).send({message: 'invalid email or password'});
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const user = findUserByEmail(email, users);

  // if user already exist in userdb, then e  rror page
  if (user) {
    return res.status(400).render('urls_error', {
      message: 'email already in use',
      useButton: false,
      user: null,
    });
  }

  const userId = generateRandomString();
  users[userId] = {id: userId, email, password: hashedPassword};

  req.session.userId = userId;
  res.redirect('/urls');
});

/** get urls data in json format */
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

/** URLs */
app.get('/urls', userAuth, (req, res) => {
  const userId = req.user.id;

  const urls = findUrlsByUserId(userId);
  const templateVars = {
    user: users[userId],
    urls,
  };
  res.render('urls_index', templateVars);
});

app.post('/urls', userAuth, (req, res) => {
  const {longURL} = req.body;

  if (!validURL(longURL)) {
    return res.status(400).render('urls_erroor', {
      message: 'invalid link info',
      useButton: false,
      user: users[req.user.id],
    });
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {longURL, userId: req.user.id};
  res.redirect(`/urls/${shortURL}`);
});

app.get('/urls/new', userAuth, (req, res) => {
  const userId = req.user.id;
  const templateVars = {
    user: users[userId],
  };

  res.render('urls_new', templateVars);
});

app.post('/urls/:shortURL/delete', userAuth, (req, res) => {
  const userId = req.user.id;
  const {shortURL} = req.params;

  if (urlDatabase[shortURL].userId !== userId) {
    return res.status(400).send({message: 'this is not your shorten url'});
  }
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

// edit url
app.post('/urls/:id', userAuth, (req, res) => {
  const userId = req.user.id;
  const editedLongUrl = req.body.id;
  const shortUrl = req.params.id;

  if (urlDatabase[shortUrl].userId !== userId) {
    return res.status(400).send({message: 'you are not allowed to Edit'});
  }

  urlDatabase[shortUrl].longURL = editedLongUrl;

  res.redirect('/urls');
});

app.get('/urls/:shortURL', userAuth, (req, res) => {
  const {shortURL} = req.params;
  if (urlDatabase[shortURL].userId !== req.user.id)
    return res.status(400).render('urls_error', {
      message: 'you are not allowed access',
      useButton: false,
      user: req.user,
    });

  if (urlDatabase[shortURL].userId !== req.user.id) {
    return res.render('urls_error', {
      message: 'you are not the owner of this short url',
      user: req.user,
    });
  }

  let templateVars = {};
  if (urlDatabase.hasOwnProperty(shortURL)) {
    templateVars = {
      shortURL,
      longURL: urlDatabase[shortURL].longURL,
      user: req.user,
    };
    return res.render('urls_show', templateVars);
  }

  res.status(400).send({message: 'url is invalid'});
});

app.get('/u/:shortURL', (req, res) => {
  const userId = req.session.userId;
  const user = users[userId];
  const {shortURL} = req.params;

  if (!urlDatabase.hasOwnProperty(shortURL)) {
    return res
      .status(400)
      .render('urls_error', {message: 'Invalid link', useButton: true, user});
  }

  const longURL = urlDatabase[shortURL].longURL;

  if (validURL(longURL)) {
    return res.redirect(longURL);
  }
  res.redirect(`/urls/${shortURL}`);
});

app.get('*', (req, res) => {
  res.status(404).render('urls_404');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

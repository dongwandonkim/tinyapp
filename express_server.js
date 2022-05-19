const express = require('express');
const app = express();
const bp = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const PORT = 8080; // default port 8080

/* local imports */
const {users, findUserByEmail} = require('./db/user');
const {urlDatabase, findUrlsByUserId} = require('./db/urls');
const {userAuth} = require('./middleware/userAuth');

app.set('view engine', 'ejs');

app.use(bp.urlencoded({extended: true}));
app.use(cookieParser());

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

app.get('/', (req, res) => {
  const userId = req.cookies['user_id'];

  if (userId === undefined || !userId) {
    return res.redirect('/login');
  }
  res.redirect('/urls');
});

/** User Auth */
app.post('/login', (req, res) => {
  const {email, password} = req.body;

  const user = findUserByEmail(email);

  if (user && bcrypt.compareSync(password, user.password)) {
    res.cookie('user_id', user.id);
    return res.redirect('/urls');
  }

  res.status(403).render('urls_error', {
    message: 'invalid credentials',
    useButton: false,
    user,
  });
});

app.get('/login', (req, res) => {
  const userId = req.cookies['user_id'];

  const templateVars = {
    user: users[userId],
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
    user: users[userId],
  };

  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  const {email, password} = req.body;
  if (!email.length || !password.length) {
    return res.status(400).send({message: 'invalid email or password'});
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const user = findUserByEmail(email);

  if (user) {
    return res.status(400).send({message: 'email already in use'});
  }

  const userId = generateRandomString();
  users[userId] = {id: userId, email, password: hashedPassword};

  res.cookie('user_id', userId);
  res.redirect('/urls');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

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
    return res.status(400).send({message: 'invalid link info'});
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

app.get('/u/:shortURL', (req, res) => {
  const userId = req.cookies['user_id'];
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

  // const userId = req.user.id;
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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

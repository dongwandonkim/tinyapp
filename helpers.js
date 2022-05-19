const findUserByEmail = (email, db) => {
  for (const key in db) {
    if (db[key].email === email) {
      return db[key];
    }
  }
  return false;
};

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

module.exports = {
  findUserByEmail,
  validURL,
  generateRandomString,
};

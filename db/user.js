const users = {};

//methods
const findUserById = (id) => {
  for (const key in users) {
    if (users[key].id === id) {
      return users[key];
    }
  }
  return false;
};

module.exports = {users, findUserById};

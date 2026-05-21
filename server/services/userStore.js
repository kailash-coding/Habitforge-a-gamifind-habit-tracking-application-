const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');

const dataPath = path.join(__dirname, '..', 'data');
const usersFile = path.join(dataPath, 'users.json');

const useMongo = () => mongoose.connection.readyState === 1;

const ensureUsersFile = async () => {
  try {
    await fs.access(usersFile);
  } catch {
    await fs.mkdir(dataPath, { recursive: true });
    await fs.writeFile(usersFile, JSON.stringify([], null, 2), 'utf8');
  }
};

const loadUsers = async () => {
  await ensureUsersFile();
  const raw = await fs.readFile(usersFile, 'utf8');
  return JSON.parse(raw || '[]');
};

const saveUsers = async (users) => {
  await ensureUsersFile();
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), 'utf8');
};

const toFileUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  password: user.password || '',
  passwordHash: user.passwordHash || null,
  emailVerified: Boolean(user.emailVerified),
});

const findUserByEmail = async (email) => {
  if (useMongo()) {
    const doc = await User.findOne({ email }).lean();
    if (!doc) return null;
    return {
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      password: doc.password || '',
      passwordHash: doc.passwordHash || null,
      emailVerified: doc.emailVerified,
    };
  }
  const users = await loadUsers();
  return users.find((user) => user.email === email) || null;
};

const findUserById = async (id) => {
  if (useMongo()) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await User.findById(id).lean();
    if (!doc) return null;
    return {
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      password: doc.password || '',
      passwordHash: doc.passwordHash || null,
      emailVerified: doc.emailVerified,
    };
  }
  const users = await loadUsers();
  return users.find((user) => user.id === id) || null;
};

const createUser = async ({ name, email, password = '', passwordHash = null, emailVerified = false }) => {
  const payload = { name, email, password, passwordHash, emailVerified };

  if (useMongo()) {
    const doc = await User.create(payload);
    const user = {
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      password: doc.password,
      passwordHash: doc.passwordHash,
      emailVerified: doc.emailVerified,
    };
    const users = await loadUsers();
    users.push(toFileUser(user));
    await saveUsers(users);
    return user;
  }

  const users = await loadUsers();
  const user = {
    id: `user_${Date.now()}`,
    ...payload,
  };
  users.push(user);
  await saveUsers(users);
  return user;
};

const updateUser = async (updatedUser) => {
  if (useMongo()) {
    await User.findByIdAndUpdate(updatedUser.id, {
      name: updatedUser.name,
      email: updatedUser.email,
      password: updatedUser.password,
      passwordHash: updatedUser.passwordHash,
      emailVerified: updatedUser.emailVerified,
    });
  }

  const users = await loadUsers();
  const index = users.findIndex((user) => user.id === updatedUser.id);
  if (index === -1) {
    users.push(toFileUser(updatedUser));
  } else {
    users[index] = toFileUser(updatedUser);
  }
  await saveUsers(users);
  return updatedUser;
};

const upsertUserByEmail = async ({ name, email, password, passwordHash, emailVerified = true }) => {
  let user = await findUserByEmail(email);
  if (!user) {
    return createUser({ name, email, password, passwordHash, emailVerified });
  }
  user.name = name || user.name;
  user.password = password;
  user.passwordHash = passwordHash;
  user.emailVerified = emailVerified;
  return updateUser(user);
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  upsertUserByEmail,
};

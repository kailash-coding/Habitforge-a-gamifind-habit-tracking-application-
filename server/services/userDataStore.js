const fs = require('fs').promises;
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data');
const userDataFile = path.join(dataPath, 'userData.json');

const ensureUserDataFile = async () => {
  try {
    await fs.access(userDataFile);
  } catch {
    await fs.mkdir(dataPath, { recursive: true });
    await fs.writeFile(userDataFile, JSON.stringify({}, null, 2), 'utf8');
  }
};

const loadAllUserData = async () => {
  await ensureUserDataFile();
  const raw = await fs.readFile(userDataFile, 'utf8');
  return JSON.parse(raw || '{}');
};

const saveAllUserData = async (data) => {
  await ensureUserDataFile();
  await fs.writeFile(userDataFile, JSON.stringify(data, null, 2), 'utf8');
};

const getUserData = async (userId) => {
  const allData = await loadAllUserData();
  return allData[userId] || null;
};

const setUserData = async (userId, data) => {
  const allData = await loadAllUserData();
  allData[userId] = data;
  await saveAllUserData(allData);
  return allData[userId];
};

const clearUserData = async (userId) => {
  const allData = await loadAllUserData();
  if (userId) {
    delete allData[userId];
  } else {
    for (const key of Object.keys(allData)) {
      delete allData[key];
    }
  }
  await saveAllUserData(allData);
};

module.exports = {
  getUserData,
  setUserData,
  clearUserData,
};

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const app = express()

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/habitforge'
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error))

app.use(cors())
app.use(express.json())

app.use('/api/habits', require('./routes/habitroutes'))
app.use('/api/auth', require('./routes/authroutes'))

app.get('/', (req, res) => {
  res.send('HabitForge API Running')
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

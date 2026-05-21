require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./db')

const app = express()
connectDB()

app.use(cors())
app.use(express.json())

app.use('/api/habits', require('./routes/habitroutes'))
app.use('/api/auth', require('./routes/authroutes'))
app.use('/api/userdata', require('./routes/userdata'))

app.get('/', (req, res) => {
  res.send('HabitForge API Running')
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

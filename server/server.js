const express = require('express')
const cors = require('cors')

const app = express()

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

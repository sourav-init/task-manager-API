const express = require('express')
require('./db/mongoose')

const app = express()
const userRouter = require('./routers/users')
const taskRouter = require('./routers/tasks')

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

const port = process.env.PORT 

app.listen(port, () => {
    console.log(port)
})
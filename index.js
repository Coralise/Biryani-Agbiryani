import express from 'express'
import bodyParser from 'body-parser'
import firebase from './firebase.js'
const port = 3000

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json({ extended: true }))
app.use(express.static('public'))
app.set('view engine', 'pug')

app.get('/', (req, res) => {
    res.render('index')
})

app.listen(port, () => {
    console.log("Listening on port", port)
})
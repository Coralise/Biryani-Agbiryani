import express from 'express'
import bodyParser from 'body-parser'
import firebase from './firebase.js'
const port = 3000

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json({ extended: true }))
app.use(express.static('public'))
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('index')
})

app.post('/api/getdishes', async (req, res) => {
    let dishDocs = await firebase.getDishes(req.body)
    let promises = []
    for (const dish of dishDocs) {
        promises.push(firebase.getImageUrl(dish.ImageURL).then(url => dish["StorageURL"] = url))
    }
    await Promise.all(promises)
    res.send(dishDocs)
})

app.listen(port, () => {
    console.log("Listening on port", port)
})
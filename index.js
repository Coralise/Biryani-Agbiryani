// import express from 'express'
// import bodyParser from 'body-parser'
// import firebase from './firebase.js'
const express = require('express')
const bodyParser = require('body-parser')
const firebase = require('./firebase.js')
const port = process.env.PORT || 3000

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json({ extended: true }))
app.use(express.static('public'))
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('index', { User: firebase.getUser() })
})

app.get('/cart', (req, res) => {
    res.render('view_cart', { User: firebase.getUser() })
})

app.get('/login', (req, res) => {
    res.render('login', { User: firebase.getUser() })
})

app.get('/signup', (req, res) => {
    res.render('signup', { User: firebase.getUser() })
})

app.get('/profile', (req, res) => {
    res.render(firebase.getUser() !== undefined ? 'profile' : 'login', { User: firebase.getUser() })
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

app.post('/api/getcartdishes', async (req, res) => {
    let dishes = await firebase.getCartDishes(req.body)
    let promises = []
    for (const dish of dishes) {
        promises.push(firebase.getImageUrl(dish.ImageURL).then(url => dish["StorageURL"] = url))
    }
    await Promise.all(promises)
    res.send(dishes)
})

app.post('/api/checkcode', async (req, res) => {
    let codeDetails = await firebase.checkVoucherCode(req.body.Code)
    res.send(codeDetails)
})

app.post('/api/validatevouchers', async (req, res) => {
    let codeDetails = await firebase.validateVouchers(req.body)
    res.send(codeDetails)
})

app.post('/api/login', async (req, res) => {
    let userCreds = await firebase.login(req.body.Email, req.body.Password)
    res.send(userCreds)
})

app.post('/api/signup', async (req, res) => {
    let userCreds = await firebase.signup(req.body.Email, req.body.Password, req.body.Nickname)
    res.send(userCreds)
})

app.get('/api/getuser', async (req, res) => {
    res.send(firebase.getUser())
})

app.get('/api/logout', async (req, res) => {
    res.send((await firebase.logout()))
})

app.post('/api/usevouchers', async (req, res) => {
    await firebase.useVouchers(req.body)
    res.send("Done")
})

app.post('/api/checkout', async (req, res) => {
    await firebase.checkOut(req.body.currentDishes, req.body.usedVouchers, req.body.delivery)
    res.send("Done")
})

app.post('/api/addpurchase', async (req, res) => {
    await firebase.addPurchase(req.body)
    res.send("Done")
})

app.listen(port, () => {
    console.log("Listening on port", port)
})
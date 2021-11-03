const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


//MiddleWare
app.use(cors());
app.use(express.json());


//Database String
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.luy9u.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });






app.get('/', (req, res) => {
     res.send('Hello Doctors Servers !')
});

app.listen(port, ()=>{
     console.log('Listening port ', port);
});
const express = require('express');
const { MongoClient } = require('mongodb');
const admin = require("firebase-admin");
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


//MiddleWare
app.use(cors());
app.use(express.json());



const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



//Database String
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.luy9u.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next){
     if(req.headers?.authorization?.startsWith('Bearer ')){
          const token = req.headers.authorization.split(' ')[1];

          try{
               const decodedUser = await admin.auth().verifyIdToken(token)
               req.decodedEmail = decodedUser.email;
          }
          catch{

          }
     }
     next()
}

async function run(){

     try{
          await client.connect()
          const database = client.db('doctors_portal');
          const appiontmentsCollection = database.collection('appiontments');
          const usersCollection = database.collection('users')

          //Get Api with email
          app.get('/appiontments',verifyToken, async(req, res)=>{
               const email = req.query.email;
               const date = new Date(req.query.date).toLocaleDateString();
               
               const query = {email:email , date:date};
               const cursor = appiontmentsCollection.find(query);
               const appiontments = await cursor.toArray();
               res.json(appiontments)
          })
          //Post Api
          app.post('/appiontments' , async(req, res)=>{
               const appiontment = req.body;
               const result = await appiontmentsCollection.insertOne(appiontment)
               
               res.json(result)
          });

          //Save user database
          app.post('/users', async(req, res)=>{
               const user = req.body;
               const result = await usersCollection.insertOne(user);
               res.json(result)
          });

          //Upsert google login
          app.put('/users', async(req, res) =>{
               const user = req.body;
               const filter = {email: user.email};
               const options= { upsert: true};
               const updateDoc = {$set: user};
               const result = await usersCollection.updateOne(filter, updateDoc, options);
               res.json(result)
          });
       

          //Make Admin role
          app.put('/users/admin',verifyToken, async(req, res)=>{
               const user = req.body;
               const requester = req.decodedEmail;
               if(requester){
                    const requesterAccount = await usersCollection.findOne({email : requester});
                    if (requesterAccount.role === 'admin') {
                         const filter = {email: user.email};
                         const updateDoc = {$set: {role: 'admin'}};
                         const result = await usersCollection.updateOne(filter, updateDoc);
                         res.json(result)
                    }
               }
               else{
                    res.status(403).json({message : 'You do not have access to make admin'})
               }

          })

             //Admin check for private
             app.get('/users/:email', async(req, res)=>{
               const email = req.params.email;
               const query = {email : email};
               const user = await usersCollection.findOne(query);
               let isAdmin = false;
               if(user?.role === 'admin'){
                    isAdmin = true;
               }
               res.json({admin : isAdmin});
          })
     }
     finally{
          // await client.close()
     }

}
run().catch(console.dir)


app.get('/', (req, res) => {
     res.send('Hello Doctors Servers !')
});

app.listen(port, ()=>{
     console.log('Listening port ', port);
});
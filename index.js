
const express = require('express')
require('dotenv').config();
var jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express()
const port = process.env.PORT || 5000;


// middleware
const corsOptions = {
  origin: "*",
  optionsSuccessStatus : 200,
}
app.use(cors(corsOptions));
app.use(express.json());




const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.n2defbf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



//verify jwt
const verifyJWT = (req, res, next) =>{
  console.log('hitting verify JWT');
  console.log(req.headers.authorization);
  const authorization = req.headers.authorization;
  if(!authorization){
    res.status(401).send({error: true, message: 'unauthorized access'})
  }
  const token = authorization.split(' ')[1];
  // console.log('token get',token)
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded)=>{
    if(error){
      return res.status(401).send({error:true, message: 'unauthorized access'})
    }
    req.decoded = decoded;
    next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();


    const postsCollection = client.db('assignmentDB').collection('posts');
    const usersCollection = client.db('assignmentDB').collection('users');


    //jwt
    app.post('/jwt', (req, res)=>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
      res.send({token})
    })

// //posts related apis
// app.get('/posts',verifyJWT, async(req, res)=> {
//     const result = await postsCollection.find().toArray();
//     res.send(result)
//   })


  // ****//
//get some data
app.get('/posts', verifyJWT, async(req, res)=>{
  const decoded = req.decoded;
  // console.log('came back after varify', decoded);
  if(decoded.email !== req.query.email){
    return res.status(403).send({error: 1, message: 'forbidden access'})
  }
    let query = {};
    if(req.query?.email){
        query = {email: req.query.email}
    }
    const result = await postsCollection.find().toArray();
    res.send(result)
})







  // users related apis
  app.post('/users', async(req, res)=>{
    const usersdata = req.body;
    console.log(req.body)
    const result = await usersCollection.insertOne(usersdata);
    res.send(result)
  });


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

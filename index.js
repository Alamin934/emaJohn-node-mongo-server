const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
var admin = require("firebase-admin");
const cors = require('cors');


//Firebase admin initialization
var serviceAccount = require("./simple-ema-john-c08e5-firebase-adminsdk-cxei1-de5531f5b9.json");



const app = express();
const port = process.env.PORT || 5000;

//Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ogrrwih.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearar ')) {
        const idToken = req.headers.authorization.split('Bearar ')[1];
        try {
            const decodedUser = await admin.auth().verifyIdToken(idToken);
            req.decodedUserEmail = decodedUser.email;
        } catch {

        }
    }

    next();
}

async function run() {
    try {
        await client.connect();
        const database = client.db('online_shop');
        const productsCollection = database.collection('products');
        const orderCollection = database.collection('orders');

        //Get API method for get product api
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({});
            const currentPage = req.query.currentPage;
            const size = parseInt(req.query.size);
            const count = await productsCollection.countDocuments();
            let products;
            if (currentPage) {
                products = await cursor.skip(currentPage * size).limit(size).toArray();
            } else {
                products = await cursor.toArray();
            }
            res.send({
                products,
                count
            });
        });


        //Use Post method for get
        app.post('/products/byKeys', async (req, res) => {
            const keys = req.body;
            const query = { key: { $in: keys } };
            const products = await productsCollection.find(query).toArray();
            res.json(products);
        });

        //Order Get Method
        app.get('/orders', verifyToken, async (req, res) => {
            const email = req.query.email;
            if (req.decodedUserEmail === email) {
                const query = { email: email };
                const cursor = orderCollection.find(query);
                const result = await cursor.toArray();
                res.send(result);
            }
            else {
                res.status(401).json({ message: 'User not Authorized' })
            }
        })
        //Order post method
        app.post('/orders', async (req, res) => {
            const orders = req.body;
            orders.cratedAt = new Date();
            const result = await orderCollection.insertOne(orders);
            res.json(result);
        })



    } finally {
        // await client.close();
    }
}
run().catch(console.dir);








app.get('/', (req, res) => {
    res.send('Crud Server running succesfully');
});



app.listen(port, () => {
    console.log('Server running on port', port);
});


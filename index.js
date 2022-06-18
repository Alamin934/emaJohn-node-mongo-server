const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const cors = require('cors');
const { initializeApp } = require('firebase-admin/app');

const app = express();
const port = process.env.PORT || 5000;

//Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ogrrwih.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function verifyToken(req, res, next) {
    if (req.headers.authorization.startsWith('Bearar ')) {
        const token = req.headers.authorization.split('Bearar')[1];
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
        app.get('/orders', async (req, res) => {
            let query = {};
            const email = req.query.email;
            if (email) {
                query = { email: email }
            }
            const cursor = orderCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
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


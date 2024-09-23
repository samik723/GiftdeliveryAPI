const express = require('express');
var cors = require('cors');
const app = express();
const port = 3000;

// These lines will be explained in detail later in the unit
app.use(express.json());// process json
app.use(express.urlencoded({ extended: true }));
app.use(cors());
// These lines will be explained in detail later in the unit

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://samiknj34:samik123@cluster0.ww15q.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// Global for general use
var userCollection;
var orderCollection;

// Connecting to MongoDB Atlas
client.connect(err => {
    if (err) {
        console.log("Error connecting to MongoDB: ", err);
        return;
    }
    userCollection = client.db("giftdelivery").collection("users");
    orderCollection = client.db("giftdelivery").collection("orders");
    console.log('Database connection established!\n');
});

app.get('/', (req, res) => {
    res.send('<h3>Welcome to Gift Delivery server app!</h3>');
    console.log('GET / - Welcome message sent');
});


app.get('/', (req, res) => {
    res.send('<h3>Welcome to Gift Delivery server app!</h3>')
})


app.get('/getUserDataTest', (req, res) => {

    console.log("GET request received\n");

    userCollection.find({}, { projection: { _id: 0 } }).toArray(function (err, docs) {
        if (err) {
            console.log("Some error.. " + err + "\n");
            res.send(err);
        } else {
            console.log(JSON.stringify(docs) + " have been retrieved.\n");
            res.status(200).send("<h1>" + JSON.stringify(docs) + "</h1>");
        }

    });

});


app.get('/getOrderDataTest', (req, res) => {

    console.log("GET request received\n");

    orderCollection.find({}, { projection: { _id: 0 } }).toArray(function (err, docs) {
        if (err) {
            console.log("Some error.. " + err + "\n");
            res.send(err);
        } else {
            console.log(JSON.stringify(docs) + " have been retrieved.\n");
            res.status(200).send("<h1>" + JSON.stringify(docs) + "</h1>");
        }

    });

});


// POST endpoint to verify user login credentials
app.post('/verifyUser', (req, res) => {
    const loginData = req.body;

    console.log(`POST /verifyUser - Attempting login for email: ${loginData.email}`);

    userCollection.findOne({ email: loginData.email, password: loginData.password }, { projection: { _id: 0 } }, (err, user) => {
        if (err) {
            console.error("Error during login verification: ", err);
            res.status(500).send("Error during login verification.");
        } else if (!user) {
            console.log("Login failed for email:", loginData.email);
            res.status(401).send("Incorrect email or password.");
        } else {
            console.log(`User verified: ${user.email}`);
            res.status(200).send([user]);
        }
    });
});

// POST endpoint to register a new user
app.post('/registerUser', (req, res) => {
    const userData = req.body;

    console.log(`POST /registerUser - Attempting to register new user: ${userData.email}`);

    userCollection.findOne({ email: userData.email }, (err, existingUser) => {
        if (err) {
            console.error("Error checking existing user: ", err);
            res.status(500).send("Error checking existing user.");
        } else if (existingUser) {
            console.log(`Registration failed: Email ${userData.email} already exists.`);
            res.status(409).send("Email already exists.");
        } else {
            userCollection.insertOne(userData, (err, result) => {
                if (err) {
                    console.error("Error registering user: ", err);
                    res.status(500).send("Error registering user.");
                } else {
                    console.log(`User registered successfully with ID: ${result.insertedId}`);
                    res.status(200).send("User registered successfully.");
                }
            });
        }
    });
});


// POST endpoint to place a new order
app.post('/placeOrder', (req, res) => {
    const newOrder = req.body;

    console.log(`POST /placeOrder - Placing new order for user: ${newOrder.customerEmail}`);

    orderCollection.insertOne(newOrder, (err, result) => {
        if (err) {
            console.error("Error placing order: ", err);
            res.status(500).send("Error placing the order.");
        } else {
            console.log(`Order placed successfully with ID: ${result.insertedId}`);
            res.status(200).send("Order placed successfully.");
        }
    });
});
// POST endpoint to retrieve past orders for the logged-in user
app.post('/getUserOrders', (req, res) => {
    const userEmail = req.body.email;

    console.log(`POST /getUserOrders - Retrieving orders for user: ${userEmail}`);

    orderCollection.find({ customerEmail: userEmail }, { projection: { _id: 0 } }).toArray((err, orders) => {
        if (err) {
            console.error("Error retrieving past orders: ", err);
            res.status(500).send("Error retrieving past orders.");
        } else {
            console.log(`Orders retrieved for ${userEmail}: ${orders.length} orders found.`);
            res.status(200).send(orders);
        }
    });
});
// DELETE endpoint to delete selected orders for the user
app.delete('/deleteUserOrders', (req, res) => {
    const orderIds = req.body.orderIds;

    console.log(`DELETE /deleteUserOrders - Deleting orders with IDs: ${orderIds.join(", ")}`);

    orderCollection.deleteMany({ orderNo: { $in: orderIds } }, (err, result) => {
        if (err) {
            console.error("Error deleting orders: ", err);
            res.status(500).send("Error deleting orders.");
        } else {
            console.log(`${result.deletedCount} orders deleted for order numbers: ${orderIds.join(", ")}`);
            res.status(200).send({ deletedCount: result.deletedCount });
        }
    });
});
// POST endpoint to insert a new order into the orders collection
app.post('/postOrderData', (req, res) => {
    console.log("POST /postOrderData - Received new order data: " + JSON.stringify(req.body));

    orderCollection.insertOne(req.body, function (err, result) {
        if (err) {
            console.error("Error inserting order: ", err);
            res.status(500).send("Error inserting order.");
        } else {
            console.log("Order record with ID " + result.insertedId + " has been inserted.");
            res.status(200).send(result);
        }
    });
});
// POST endpoint to get the last placed order by the user
app.post('/getLastOrder', (req, res) => {
    const userEmail = req.body.email;
    
    console.log(`POST /getLastOrder - Retrieving last order for user: ${userEmail}`);

    // Find the latest order for the user sorted by orderNo (or by creation time if available)
    orderCollection.find({ customerEmail: userEmail })
        .sort({ orderNo: -1 })  // Adjust this sorting if you use timestamps for sorting
        .limit(1)
        .toArray((err, orders) => {
            if (err) {
                console.error("Error retrieving last order: ", err);
                res.status(500).send("Error retrieving last order.");
            } else if (orders.length > 0) {
                console.log(`Last order retrieved for ${userEmail}: ${JSON.stringify(orders[0])}`);
                res.status(200).send(orders[0]);
            } else {
                res.status(404).send("No orders found for the user.");
            }
        });
});


app.listen(port, () => {
    console.log(`Gift Delivery server app listening at http://localhost:${port}`)
});

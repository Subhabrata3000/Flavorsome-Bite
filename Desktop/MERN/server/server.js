const express = require("express");
const { MongoClient } = require("mongodb");
const bodyParser = require("body-parser");
const cors = require("cors"); // ✅ Import CORS

const app = express();
const PORT = 3003;

// ============================
// ⚙️ Middleware
// ============================
app.use(cors()); // ✅ Enable CORS for all routes to allow your React app to connect
app.use(express.json());
app.use(bodyParser.json());

// ============================
// ⚙️ MongoDB Configuration
// ============================
const url = "mongodb://localhost:27017/";
const dbName = "menu";
const client = new MongoClient(url);

// =======================================================================
// ✅ API Routes (These remain unchanged from your original file)
// =======================================================================

// API: Get Food Items
app.get("/food", async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const foodItems = await db.collection("food").find().toArray();
    res.json(foodItems);
  } catch (err) {
    console.error("Error fetching food:", err);
    res.status(500).send("Error fetching food data");
  }
});

// API: Get Reservation Places
app.get("/reservations", async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const reservations = await db.collection("reservations").find().toArray();
    res.json(reservations);
  } catch (err) {
    console.error("Error fetching reservations:", err);
    res.status(500).send("Error fetching reservation data");
  }
});

// API: Save New Reservation
app.post("/save-booking", async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    await db.collection("orders").insertOne(req.body);
    res.status(200).send("Booking saved");
  } catch (err) {
    console.error("Booking save failed:", err);
    res.status(500).send("Booking failed");
  }
});

// API: Get All Reservation Orders
app.get("/orders", async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const orders = await db.collection("orders").find().toArray();
    res.json(orders);
  } catch (err) {
    console.error("Error fetching reservation orders:", err);
    res.status(500).send("Error fetching reservation data");
  }
});

// API: Place Food Order
app.post("/place-order", async (req, res) => {
  const { username, orders } = req.body;
  try {
    const orderDoc = {
      username,
      items: orders,
      placedAt: new Date()
    };
    await client.connect();
    const db = client.db(dbName);
    await db.collection("food_order").insertOne(orderDoc);
    res.status(200).send("Order placed successfully!");
  } catch (err) {
    console.error("Food Order Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

// API: Get All Food Orders with Total Price
app.get("/food-orders", async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);

    const foodItems = await db.collection("food").find().toArray();
    const priceMap = foodItems.reduce((map, item) => {
      map[item.name] = item.price;
      return map;
    }, {});

    const orders = await db.collection("food_order").find().toArray();

    const ordersWithTotal = orders.map(order => {
      const total = order.items.reduce((sum, currentItem) => {
        const itemPrice = priceMap[currentItem.name] || 0;
        return sum + (itemPrice * currentItem.quantity);
      }, 0);
      
      return { ...order, totalPrice: total };
    });

    res.json(ordersWithTotal);

  } catch (err) {
    console.error("Fetch Food Orders Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

// AUTH: Signup
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    await client.connect();
    const db = client.db(dbName);
    const existing = await db.collection("user").findOne({ email });
    if (existing) {
      return res.status(409).send("⚠️ User already exists.");
    }
    await db.collection("user").insertOne({ name, email, password });
    res.status(200).send("✅ User registered successfully.");
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).send("❌ Internal Server Error");
  }
});

// AUTH: Login
app.post("/login", async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const { email, password } = req.body;
    const user = await db.collection("user").findOne({ email, password });
    if (user) {
      res.status(200).json({ success: true, username: user.name });
    } else {
      res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// ============================
// ❌ HTML Page Routes (REMOVED)
// React Router now handles all page navigation on the client-side.
// ============================

// ============================
// 🚀 Start Server
// ============================
app.listen(PORT, () => {
  console.log(`✅ API Server running at http://localhost:${PORT}`);
});
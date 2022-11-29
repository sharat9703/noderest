import express from "express";
import { createWriteStream } from "fs";
import { config } from "dotenv";
import pkg from "body-parser";
const { urlencoded, json } = pkg;
import morgan from "morgan";
import cors from "cors";
import { MongoClient as _MongoClient, ObjectId } from "mongodb";

let app = express();
config();
let MongoClient = _MongoClient;
let port = process.env.PORT || 9800;
let mongoURL = process.env.MongoLive;

let db;
// middleware
app.use(morgan("short", { stream: createWriteStream("./app.logs") }));
app.use(cors());
app.use(urlencoded({ extended: true }));
app.use(json());

//API//
app.get("/", (req, res) => {
  res.send("Amazon Clone Site!");
});

//connecting to mongodb
MongoClient.connect(mongoURL, (err, client) => {
  if (err) console.log("error while connecting!");
  db = client.db("my_app_data");
  app.listen(port, () => {
    console.log(`listening to ${port}`);
  });
});

//api to get list of categories
app.get("/categories", (req, res) => {
  db.collection("categories")
    .find()
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

//api to get all items of any category=>

app.get("/categories/:category_name", (req, res) => {
  let category_name = req.params.category_name;
  db.collection(category_name)
    .find()
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

// api to get items from subcategory(fashion)=>

app.get("/fashion/:id", (req, res) => {
  let id = Number(req.params.id);
  db.collection("fashion")
    .find({ sub_category_id: id })
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

// api to get items from subcategory(electronics)=>

app.get("/electronics/:id", (req, res) => {
  let id = Number(req.params.id);
  db.collection("electronics")
    .find({ sub_category_id: id })
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

//api to get details of a product

app.get("/product/:product_name", (req, res) => {
  let product_name = req.params.product_name;
  let item_id = Number(req.query.item_id);
  let query = {};
  if (item_id) {
    query = { item_id: item_id };
  }
  db.collection(product_name)
    .find(query)
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

//filtered api based on popularity

app.get("/filter/by-stars/:product", (req, res) => {
  let product_name = req.params.product;
  let query = { stars: { $gt: 4.2 } };
  db.collection(product_name)
    .find(query)
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

// filtered api wrt cost

app.get("/filter/by-price/:product", (req, res) => {
  let product_name = req.params.product;
  let lcost = Number(req.query.lcost);
  let hcost = Number(req.query.hcost);
  let query = { new_price: { $gt: 40 } };
  let sort = { new_price: 1 };
  if (lcost && hcost) {
    query = { new_price: { $lt: hcost, $gt: lcost } };
  } else if (!lcost && hcost) {
    query = { new_price: { $lt: hcost, $gt: 40 } };
  } else if (lcost && !hcost) {
    query = { new_price: { $gt: lcost } };
  }

  if (req.query.sort) {
    sort = { new_price: Number(req.query.sort) };
  }
  db.collection(product_name)
    .find(query)
    .sort(sort)
    .toArray((err, result) => {
      if (err) throw err;
      res.send(result);
    });
});

//filter by discount
app.get('/filter/by-discount/:product/:discount',(req,res)=>{
  let product_name = req.params.product;
  let discount = req.params.discount;
let query={discount:{$gt:Number(discount)}};
console.log(discount);
db.collection(product_name).find(query).toArray((err,result)=>{
  if(err) throw err;
  res.send(result);
});
});

//placing the order
app.post('/placeOrder',(req,res)=>{
  console.log(req.body);
  db.collection('orders').insert(req.body,(err,result)=>{
    if(err) throw err;
    
  });
  res.send("Order is placed!");
});

//api to get orders

app.get('/orders',(req,res)=>{
  let email = req.query.email;
  let query={};
  if(email){
    query= {email:email};
    //query={email};
  }
db.collection('orders').find(query).toArray((err,result)=>{
  if(err) throw err;
  res.send(result);
});
});

//api to update orders
app.put('/updateOrder/:id',(req,res)=>{
  let orderId = Number(req.params.id);
  db.collection('orders').updateOne({orderId:orderId},
    {
      $set:{
"status":req.body.status,
"bank_name":req.body.bank_name,
"date":req.body.date
      }
    },(err,result)=>{
if(err) throw err;
res.send(`Order Updated!`);
    });
});

//API to delete orders
app.delete('/deleteOrder/:id',(req,res)=>{
  let _id = ObjectId(req.params.id);
  db.collection('orders').deleteOne({_id},(err,result)=>{
    if(err) throw err;
    res.send("Order Deleted!");
  });
});  
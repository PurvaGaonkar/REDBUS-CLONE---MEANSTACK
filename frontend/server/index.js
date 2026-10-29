
require("dotenv").config();
const express=require('express')
const bodyparser=require('body-parser')
const cors =require('cors')
const mongoose=require('mongoose')

const app=express();

app.use(cors());
app.use(bodyparser.json())
const customerroutes=require("./routes/customer");
const routesroute=require("./routes/route");
const bookingroute=require("./routes/booking");
app.use(express.json());
app.use("/api/community", require("./routes/community"));
app.use("/api/notifications", require("./routes/notification"));
app.use("/api/booking", require("./routes/booking"));
app.use("/api/routes", require("./routes/route"));
app.use("/api/customers", require("./routes/customer"));
const DBURL="mongodb+srv://Purva:tedbus12345@tedbus.en0zc0f.mongodb.net/"
mongoose.connect(DBURL)
.then(()=> console.log("Mongodb connected"))
.catch(err=> console.error('Mongodb connection error:' ,err))

app.get('/',(req,res)=>{
    res.send('Hello , Ted bus is working')
})

const PORT= 5000
app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`)
})

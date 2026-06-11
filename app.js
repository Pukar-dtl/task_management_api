require('dotenv').config();
const express = require('express');
const session = require('express-session');
const {RedisStore} = require('connect-redis');
const helmet = require('helmet');
const cors = require('cors')
require('dotenv').config();

console.log(process.env.MONGO_URL);

const connectMongo = require('./config/mongo');
const{client:redisClient, connect:connectRedis} = require('./config/redis');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoute');
const analyticRoutes = require('./routes/analyticsRoute');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();

connectMongo();
connectRedis();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

const redisStoreIns = new RedisStore({
    client: redisClient,
    prefix: "session:"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
})

app.use(session({
    store:redisStoreIns,
    secret: process.env.SECRET_KEY || 'pukar71296',
    resave:false,
    saveUninitialized:false,
    cookie:{
        secure:process.env.NODE_ENV === 'production',
        httpOnly:true,
        maxAge:parseInt(process.env.SESSION_EXPIRY || 1200)*1000
    }
}))

app.use(rateLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticRoutes);
app.use('/api/tasks', taskRoutes);

//health?

//
app.use((err,req,res,next)=>{
    console.log('Error', err.message);
    res.status(500).json({
        error:"SOmething went wrong",
        message:err.message
    })
})

const PORT = process.env.PORT||3000;
app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`);
})

module.exports = app;
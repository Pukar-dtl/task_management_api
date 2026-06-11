const bcrypt = require('bcrypt');

const User = require('../models/users.js');
const {client: redisClient} = require('../config/redis');
const{validateRegistration, validateLogin} = require('../utils/validation');

const trackFailedLogin = async (identifier) => {
    const key = `failed_login:${identifier}`;
    const attempts = await redisClient.incr(key);
    
    //expiry
    if (attempts === 1) {
        await redisClient.expire(key, 15 * 60); 
    }
    
    // block after 5
    if (attempts >= 5) {
        const blockKey = `blocked:${identifier}`;
        await redisClient.setEx(blockKey, 15 * 60, 'true'); 
    }
    
    return attempts;
};

const isBlocked = async (identifier) => {
    const blockKey = `blocked:${identifier}`;
    const blocked = await redisClient.get(blockKey);
    return blocked !== null;
};

const clearFailedAttempts = async (identifier) => {
    const key = `failed_login:${identifier}`;
    const blockKey = `blocked:${identifier}`;
    await redisClient.del(key);
    await redisClient.del(blockKey);
};

const register = async(req,res)=>{
    try{
        const {error} = validateRegistration(req.body)
        if(error){
            return res.status(400).json({error:error.details[0].message});
        }
        const {fullName,email,password} = req.body;

        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({error:"Email already registered"});
        }
        const hashedPassword = await bcrypt.hash(password, 11);

        if (!hashedPassword) {
            return res.status(500).json({ error: 'Error hashing password' });
        }

        const user = new User({
            fullName:fullName,
            password:hashedPassword,
            email:email
        })

        await user.save();

        res.status(201).json({
            message: "User registered successfully",
            userId: user._id
        })
    }
    catch(error){
        res.status(500).json({
            error: error.message
        })
    }
}

const login = async(req,res)=>{
    try{
        const {error} = validateLogin(req.body)
        if(error){
            return res.status(500).json({error:error.details[0].message}) // ← Added return
        }

        const {email,password} = req.body;
        
        const identifier = `${req.ip}:${email}`;
        const blocked = await isBlocked(identifier);
        if (blocked) {
            return res.status(403).json({ 
                error: 'Too many failed attempts. Please try again after 15 minutes.' 
            });
        }
      
        const user = await User.findOne({email});

        if(!user){
            const attempts = await trackFailedLogin(identifier);
            const remaining = 5 - attempts;
            return res.status(401).json({
                error: "Invalid credentials",
                remainingAttempts: remaining > 0 ? remaining : 0,
                message: remaining > 0 ? `${remaining} attempts remaining` : 'Account temporarily blocked for 15 minutes'
            });
        }

        const checkPassword = await bcrypt.compare(password, user.password);

        if(!checkPassword){
            const attempts = await trackFailedLogin(identifier);
            const remaining = 5 - attempts;
            return res.status(401).json({
                error: "Invalid credentials",
                remainingAttempts: remaining > 0 ? remaining : 0,
                message: remaining > 0 ? `${remaining} attempts remaining` : 'Account temporarily blocked for 15 minutes'
            });
        }

        await clearFailedAttempts(identifier);

        req.session.userId = user._id;
        req.session.loginTime = new Date().toISOString();

        await redisClient.incr('analytics:totalLogins');

        res.json({
            message: 'Login successful',
            userId:user._id,
            sessionId:req.sessionID
        });
    }
    catch(error){
        console.log(error)
        res.status(500).json({
            error:error.message
        })
    }
}

const logout = (req,res)=>{
    req.session.destroy((err)=>{
        if(err){
            res.status(500).json({error:"could not logout"})
        }
        return res.json({message : "Logged out"})
    })
}

const getSessionInfo=async (req,res)=>{
    try{
        if(!req.session.sessionID){
            res.status(401).json({
                error: "session not found"
            })
        }
        const user = await User.findById(req.session.userId).select('-password');

        res.json({
            sessionId:req.sessionID,
            userId:req.session.userId,
            loginTime:req.session.loginTime,
            user:user
        })
    }
    catch(error){
        res.status(500).json({error:error.message});
    }
}

module.exports = {
    register,
    login,
    logout,
    getSessionInfo
};
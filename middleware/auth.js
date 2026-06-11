const authMiddleware = (req,res,next)=>{
    if(!req.session || !req.session.userId){
        return res.status(401).json({error: "unauthorized. Please login"});
    }

    req.userId = req.session.userId;
    next();
};

module.exports = authMiddleware;
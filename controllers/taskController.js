const Task = require('../models/tasks');

const {client:redisClient} = require('../config/redis');
const {validateTask} = require('../utils/validation');

const getCacheKey = (userId)=>{
    return `tasks:${userId}`
};

const invalidateTaskCache = async (userId)=>{
    await redisClient.del(getCacheKey(userId))
};

const createTask = async(req,res)=>{
    try{
        const{error} = validateTask(req.body);
        if(error){
            return res.status(400).json({error:error.details[0].message});
        }
        const {title,description,priority} = req.body;
        const task = new Task({
            title:title,
            description:description,
            priority:priority,
            userId:req.userId
        })

        await task.save();
        await invalidateTaskCache(req.userId);
        await redisClient.incr('analytics:tasksCreated');

        res.status(201).json(task);
    }
    catch(error){
        res.status(500).json({error:error.message})
        console.log(error)
    }
}

const getTasks = async(req,res)=>{
    try{
        const cacheKey = getCacheKey(req.userId);
        const cachedTasks  = await redisClient.get(cacheKey)

        if(cachedTasks){
            return res.json(JSON.parse(cachedTasks))
        }

        const task = await Task.find({userId:req.userId});
        await redisClient.setEx(cacheKey, 900, JSON.stringify(task));

        res.json(task);
    }catch(error){
        res.status(500).json({error:error.message});
    }
}


const updateTasks = async(req,res)=>{
    try{
        const {id} = req.params;
        const {title,description,priority} = req.body;

        const task = await Task.findOne({_id:id , userId:req.userId})
        if(!task){
            res.status(404).json({error:"Task not found"})
        }
        if(title){
            task.title = title;
        }
        if(description){
            task.description = description;
        }
        if(priority){
            task.priority = priority;
        }

        await task.save();
        await invalidateTaskCache(req.userId);
        await redisClient.incr("analytics:taskUpdated")

        res.json(task);
    }catch(error){
        res.status(500).json({
            error:error.message
        })
    }
}

const deleteTask=async (req,res)=>{
    try{
        const {id} = req.params;
        const task = await Task.findOneAndDelete({_id:id, userId:req.userId})
        
        if(!task){
           return res.status(400).json({error: "Task not found"});
        }
        await invalidateTaskCache(req.userId);

        await redisClient.incr("analytics:taskDeleted");
        res.json("Task deleted successfully");

    }catch(error){
        res.status(500).json({
            error:error.message
        })
    }
}

module.exports={
    deleteTask,
    updateTasks,
    getTasks,
    createTask
};
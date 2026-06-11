const {client:redisClient} = require('../config/redis');

const getAnalytics = async(req,res)=>{
    try{
        console.log("REACHED SERVICE LAYER.")
        const totalLogins = await redisClient.get("analytics:totalLogins");
        const deletions = await redisClient.get('analytics:taskDeleted');
        const taskUpdated = await redisClient.get('analytics:taskUpdated');
        const taskCreated = await redisClient.get('analytics:taskCreated');

        let resString = `TotalLogins: ${totalLogins}, 
        deletions:${deletions.then}, taskUpdated; ${taskUpdated}, taskCreated: ${taskCreated}`
        console.log(resString);
        
        res.json({
            taskCreated:parseInt(taskCreated)||0,
            totalLogins:parseInt(totalLogins) || 0,
            taskDeleted:parseInt(deletions) || 0,
            taskUpdated:parseInt(taskUpdated)||0
        })
    }catch(error){
        res.status(500).json({error:error.message})
    }
}

module.exports = {getAnalytics};
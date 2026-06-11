const redis = require('redis')

const client = redis.createClient({
    url: process.env.REDIS_URL
});

async function connect(){
    await client.connect();
    console.log("Redis connected");
}

client.on('error', (err)=>console.log("Redis threw error", err))

module.exports = {
    client,
    connect
}
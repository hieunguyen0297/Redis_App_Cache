const express = require('express');
const redis = require('redis');
const fetch = require('node-fetch')

const app = express();

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.PORT || 6379;

const client = redis.createClient(REDIS_PORT);
app.listen(PORT, () => console.log(`Server running on ${PORT}`))


app.get('/repos/:username', cache, getRepos);

//Set response
function setResponse(username, repos){
    return  `<h2>${username} has ${repos} Github repos</h2>`
}



//Make request to github for data 

async function getRepos(req, res, next){
    try{
        console.log('Fetching data...')

        const { username } = req.params; //pull the value of param username out from the repos

        const response = await fetch(`https://api.github.com/users/${username}`);
        const data = await response.json()

        const repos = data.public_repos;

        //Set data to REDIS
        client.setex(username, 3600, repos) //setex take in (key, time expiration, data)

        res.send(setResponse(username, repos));

    }catch (err){
        console.log(err)
    }
}

//Cache middleware //middleware is the function run in between req and res cycle
function cache(req, res, next){
    const { username } = req.params;

    client.get(username, (err, data) => {
        if(err) throw err;
        if(data !== null){
            res.send(setResponse(username, data));
        }else{
            next()
        }
    })
}
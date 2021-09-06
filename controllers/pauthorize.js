const fetch = require("node-fetch");

module.exports = {
    verifyAuth: async function (req, res, next) {
    // Get auth header value
        const token = req.headers['x-access-token'];
        const user_Id = String(req.params.user_id);
        // if(token.length<=5) next()
        // Check if token is undefined
        if (typeof token !== 'undefined') {
            const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
            const user = await response.json();
            //console.log(user)
            if ([user.error]=='invalid_token'){res.sendStatus(403);return;}
            const userid = user.user_id;
            //console.log(userid)
            dbo.collection('users').findOne({'Id': userid },(err,result)=>{if(result==null) {res.send('User Not Found');return}
                //console.log(user_Id)
                //console.log(result.Id)
                if(result.Id == user_Id && result.Id){ 
                    //console.log(result.Id);
                    next(); }
                else if(err) {res.sendStatus(403);}
            })
        }
        else res.sendStatus(403)
    },

    verifyToken: async function (req, res, next) {
    // Get auth header value
        const token = req.headers['x-access-token'];
        //const user_id = String(req.params.user_id);
        // Check if bearer is undefined
        if (typeof token !== 'undefined') {
            const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
            const user = await response.json();
            //console.log(user.error)
            if ([user.error]=='invalid_token'){res.sendStatus(403);return;}
            const userid = user.user_id;
            //console.log(user.user_id)
            dbo.collection('users').findOne({'Id': userid },(err,result)=>{if(result==null) {res.send('User Not Found');return}
                //console.log(result)
                if(result.Id == userid){ 
                    //console.log(result.Id); 
                    next(); }

                else if(err) {    
                    res.sendStatus(403);}
            })
        }},


    validate_user: function (token,user_obj){
        //return jwt.verify(token)
        return true
    },
}

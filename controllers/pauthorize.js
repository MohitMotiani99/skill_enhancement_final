const fetch = require("node-fetch");

module.exports = {
    verifyAuth: async function (req, res, next) {
        // Get auth header value
        const token = req.headers['x-access-token'];
        const user_Id = String(req.params.user_id);
        if (token == undefined || token == null || token.length <5) {
            next();
        }
        // Check if token is undefined
        else if (typeof token !== 'undefined') {
            const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
            const user = await response.json();
            if ([user.error]=='invalid_token'){res.sendStatus(403);return;}
            const userid = user.user_id;
            dbo.collection('users').findOne({'Id': userid },(err,result)=>{if(result==null) {res.send('User Not Found');return}
                if(result.Id == user_Id && result.Id){ 
                    next(); }
                else if(err) {res.sendStatus(403);}
            })
        }
        else res.sendStatus(403)
    },

    verifyToken: async function (req, res, next) {
    // Get auth header value
        const token = req.headers['x-access-token'];
        // Check if bearer is undefined
        if (typeof token !== 'undefined') {
            const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
            const user = await response.json();
            if ([user.error]=='invalid_token'){res.sendStatus(403);return;}
            const userid = user.user_id;
            dbo.collection('users').findOne({'Id': userid },(err,result)=>{if(result==null) {res.send('User Not Found');return}
                if(result.Id == userid){ 
                    next(); }

                else if(err) {    
                    res.sendStatus(403);}
            })
        }},


    validate_user: function (token,user_obj){
        return true
    },
}

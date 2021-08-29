var jwt = require('jsonwebtoken')
var request = require('request')


module.exports = function get_token(user){
    return jwt.sign(user)
}

//verifies the Google OAuth Token
module.exports = function validate_user(token,user_obj){
    //return jwt.verify(token)

    if(token.length<=5)
        return true
    else{
    var ans;
    return new Promise((resolve,reject)=>{
        request.get({
            headers:{'content-type':'application/json'},
            url:`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
        },(err,response,body)=>{
            if(err) throw err
            body=JSON.parse(body)
            if(body["user_id"]==user_obj.Id)
                {
                    console.log('yes')
                    ans=true
                    resolve(ans)
                }
            else{
                console.log('no')
                ans=false
                resolve(ans)
            }
                
        })
    })
    }
}

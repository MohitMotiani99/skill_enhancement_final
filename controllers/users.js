var express = require('express')
var bodyParser = require('body-parser')
var express=require('express')
var app = express()
var bodyParser = require("body-parser")
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))
//var cors = require('cors')
//var app = express()
const { verifyAuth } = require('./pauthorize')
const { verifyToken } = require('./pauthorize')

app.use(bodyParser.urlencoded({
    extended:true
}));
// var server = app.listen(5050,()=>{
//     console.log(' Server Started')
// })

var MongoClient = require('mongodb').MongoClient
//var url = 'mongodb://127.0.0.1:27017'
var url = 'mongodb+srv://pradyumnakedilaya:secret123%23@cluster0.vlavb.mongodb.net/skillenhancement?retryWrites=true&w=majority'
var db_name = 'skillenhancement'
var col_name_q = 'questionAnswer'
var col_name_u = 'users'

//var validate_user = require('./authorize')
const { request } = require('express')

MongoClient.connect(url,(err,db)=>{
    if(err)throw err
    dbo = db.db(db_name)

    //console.log('Database Connected')

    var u_counter;
    var initial_u_counter;

    dbo.collection('globals').find({}).toArray((err,result)=>{
        //console.log(result)
        u_counter = result[0].userid
        initial_u_counter = u_counter

        //console.log(u_counter)

    function cleanup(){
        dbo.collection('globals').updateOne({'userid':initial_u_counter},{$set:{'userid':u_counter}},(err,result)=>{
            //console.log('Server Closed')
            process.exit(1)

        })
    }

    process.on('exit',cleanup)
    process.on('SIGINT',cleanup)

    //get complete user details from id
    app.get('/users/:user_id',verifyAuth, async (req,res)=>{
        
        //fetch user id
        var user_id = String(req.params.user_id)
        console.log(user_id)
        // console.log(typeof user_id)

        //find the user is database
        dbo.collection('users').find({'Id':user_id}).toArray((err,result)=>{
            // console.log(result)
            // console.log(result.length)
            if(result.length == 1)
                {
                    res.send(result[0])
                }
            else
                {
                    res.send('Invalid User')
                   //res.send('UnAuthorised User, Login And Continue')
                }
        })
    })

    // app.get('/signup',(req,res)=>{
    //     request.get({
    //         headers:{'content-type':'application/json'},
    //         url:'http://localhost:3000/auth/login',
    //     },(err,response)=>{
    //         console.log(response.access_token)
            
    //     })
    // })

    //post complete user details 
    app.post('/api/signup', (req,res)=>{

        var p = req.body.password
        //var pc = req.body.passwordConformation
        var Id = u_counter 
        var un = req.body.username 
        var e = req.body.email 
        var g = req.body.gender 

        // console.log(Id)
        // console.log(p)
        // //console.log(pc)    
        // console.log(g)    
        
        dbo.collection('user').find({'username':un}).toArray((err,result)=>{
            // console.log(result.length)
                if (result.length==0)
                {
                var u_obj={
                    Id:Number(u_counter),
                    username:un,
                    token:"abc",
                    displayName:"None",
                    firstName:"None",
                    lastName:"None",
                    password:"None",
                    grade:0,
                    email:e,
                    gender:g,
                    socialLink:'None',
                    image:"https://secure.gravatar.com/avatar/6123d8d55f9cc322bc7ef0f0?s=90&d=ide...",
                    CreationDate:Date()
                }

                dbo.collection('users').insertOne(u_obj,(err,result)=>{
                    if(err) throw err
                    // console.log(result)
                    //res.redirect(`/users/${u_obj.Id}`)
                    res.send("User " +un +" is added succesfully")
                    //res.redirect('/login')
                    u_counter+=1;
                })                    
            }
            else{
                res.send('Username already Exists')
                //res.redirect('/api/signup')
            }
        })
    })

    // edit user profile
    app.patch('/api/users/:user_id/editprofile', verifyAuth, (req,res)=>{

        //only owner
        var user_id = String(req.params.user_id)
        //var p = req.body.password
        //var pc = req.body.passwordConformation
        //var e = req.body.image
        // console.log(JSON.stringify(req.body))
        var g = (req.body.gender)
        var s = (req.body.SocialLink)
        // console.log("Gender: "+g)
        // console.log('SocialLink: '+s)
        
        dbo.collection('users').find({'Id':user_id}).toArray((err,result)=>{
            if(result.length==1 ){
                dbo.collection('users').find({'Id':user_id}).toArray((err,result)=>{
                    console.log(result.length)
                    if (result.length==1)
                    {
                        var u_obj={
                            //password:(p==undefined)?result[0].password:p,
                            gender:g,
                            SocialLink:s
                        }
                        dbo.collection('users').updateOne({"Id":String(user_id)},{$set:u_obj},(err,result)=>{
                            //console.log(result)
                            res.redirect(`/users/${user_id}`)
        
                        })
                      
                    }
                    else if (result.length == 0)
                    {
                        res.send('User Doesn\'t Exist')
                    }
                    else
                    {
                        res.send('Updation Failed, please contact admin')
                    }
                })
            }
            else{ 
                //console.log(result[0])
                res.send('Invalid User')}
        })
        
    })
        

     //delete user profile
    app.delete('/users/:user_id/delete', verifyAuth, (req,res)=>{
        var user_id = String(req.params.user_id)

        // console.log(user_id)
        // console.log(typeof user_id)

        dbo.collection('users').find({'Id':user_id}).toArray((err,result)=>{
            // console.log(result.length)
                if (result.length==1)
                {
                    var u = result[0]
                    dbo.collection('users').deleteOne({'Id':user_id},(err,result)=>{
                        // console.log(result)
                        //res.send(JSON.stringify(result))
                        res.send('User: '+u.username +' Deleted')
                    })
                }
                else if (result.length==0)
                {
                    res.send("User ID doesn\'t exist. User is may be already deleted")
                    //res.redirect('/users/:user_id/delete')
                }
        })
    })   

//redirecting

    //get all the questions asked by the user
    app.get('/users/:user_id/questions', verifyAuth, (req,res)=>{
        var user_id = String(req.params.user_id)
        // console.log(user_id)
        // console.log(typeof user_id)

        dbo.collection('users').find({Id:user_id}).toArray((err,result)=>{
            if(result.length==1){
                dbo.collection('questionAnswer').find({'OwnerUserId':user_id, 'PostTypeId':1}).toArray((err,result)=>{
                    // console.log(result)
                    // console.log(result.length)
                    if(result.length >= 1)
                        {
                            // var user = result
                            // dbo.collection(col_name_q).findOne({'OwnerUserId':user_id, 'PostTypeId':1},(err,result)=>{
                            //     if(err) throw err
                            //     console.log(result)
                            //     res.send(JSON.stringify(user))
                            // })

                            res.send(result)
                            
                        }
                    else
                        {
                           res.send('You have not asked any questions yet')
                        }
                })
            }
            else res.send('UnAuthorized User, Redirecting to login page')
        })
        
    })


    //get all the comments made by the user
    app.get('/users/:user_id/comments', verifyAuth, (req,res)=>{
        var user_id = String(req.params.user_id)
        // console.log(user_id)
        // console.log(typeof user_id)

        dbo.collection('users').find({Id:user_id}).toArray((err,result)=>{
            if(result.length==1){
                //console.log(result)
                dbo.collection('comments').find({'UserId':user_id}).toArray((err,result)=>{
                    // console.log(result)
                    // console.log(result.length)
                    if(result.length != 0)
                    res.send(result)
                    else if (result.length == 0)
                    {
                       res.send('You have not commented any posts yet')
                    }
                    else 
                    {
                       res.send('Failed to load, please contact admin')
                    }
                })
            }
            else res.send('UnAuthorized User, Redirecting to login page')
        })

        
    })

    //get total number of questions posted by the user
    app.get('/users/:user_id/totalquestions', verifyToken, (req,res)=>{
        var user_id = String(req.params.user_id)
        // console.log(user_id)
        // console.log(typeof user_id)

        dbo.collection('users').find({Id:user_id}).toArray((err,result)=>{
            if(result.length==1){
                dbo.collection('questionAnswer').find({'OwnerUserId':user_id, 'PostTypeId':1}).toArray((err,result)=>{
                    // console.log(result)
                    // console.log(result.length)
                    res.send(JSON.stringify(result.length))
                })
            }
            else res.send('UnAuthorized User, Redirecting to login page')
        })

        
    })

    //get total number of comments posted by the user
    app.get('/users/:user_id/totalcomments', verifyToken, (req,res)=>{
        var user_id = String(req.params.user_id)
        // console.log(user_id)
        // console.log(typeof user_id)

        dbo.collection('users').find({'Id':user_id}).toArray((err,result)=>{
            if(result.length==1){
                dbo.collection('comments').find({'UserId':user_id}).toArray((err,result)=>{
                    // console.log(result)
                    // console.log(result.length)
                    res.send(JSON.stringify(result.length))
                })
            }
            else res.send('UnAuthorized User, redirect to login page')
        })
        
    })
        
    //get total number of answered posted by the user
    app.get('/users/:user_id/totalanswers', verifyToken, (req,res)=>{
        var user_id = String(req.params.user_id)
        // console.log(user_id)
        // console.log(typeof user_id)

        dbo.collection('users').find({'Id':user_id}).toArray((err,result)=>{
            if(result.length==1){
                dbo.collection('questionAnswer').find({'OwnerUserId':user_id, 'PostTypeId':2}).toArray((err,result)=>{
                    // console.log(result)
                    // console.log(result.length)
                    res.send(JSON.stringify(result.length))
                })
            }
            else res.send('UnAuthorized User, redirect to login page')
        })
        
    })
        
        
    

    //get all the answers posted by the user
    app.get('/users/:user_id/answers', verifyAuth, (req,res)=>{
        var user_id = String(req.params.user_id)
        // console.log(user_id)
        // console.log(typeof user_id)

        dbo.collection('users').find({'Id':user_id}).toArray((err,result)=>{
            if(result.length==1){
                dbo.collection('questionAnswer').find({'OwnerUserId':user_id, 'PostTypeId':2}).toArray((err,result)=>{
                    // console.log(result)
                    // console.log(result.length)
                    if(result.length!=0)
                    res.send(result)
                    // if(result.length >= 1)
                    //     {
                    //         var user = result
                    //         dbo.collection(col_name_q).findOne({'OwnerUserId':user_id, 'PostTypeId':2},(err,result)=>{
                    //             if(err) throw err
                    //             console.log(result)
                    //             res.send(JSON.stringify(user))
                    //         })
                            
                    //     }
                    else
                        {
                           res.send('You have not answered any quesions yet')
                        }
                })
            }
            else res.send('UnAuthorized User, redirect to login page')
        })
        
    })

    app.get('/users', verifyToken ,(req,res)=>{
        dbo.collection('users').find().toArray((err,result)=>{
            if(err) throw err
            // console.log(result)
            // console.log(result.length)
            if(result.length >= 1)
                {
                        res.send(result)                    
                }
            else
                {
                   res.send('No users to display')
                }
        })

    })

    })
})

module.exports = app


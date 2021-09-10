/* eslint-disable no-var */
var express = require('express')
var bodyParser = require('body-parser')
var express=require('express')
const app = express()
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

const MongoClient = require('mongodb').MongoClient
//var url = 'mongodb://127.0.0.1:27017'
const url = 'mongodb+srv://pradyumnakedilaya:secret123%23@cluster0.vlavb.mongodb.net/skillenhancement?retryWrites=true&w=majority'
const db_name = 'skillenhancement'
const col_name_q = 'questionAnswer'
const col_name_u = 'users'

//var validate_user = require('./authorize')
const { request } = require('express')

const path = require('path')
const swaggerUi = require("swagger-ui-express")
const fs = require('fs')
const jsyaml = require('js-yaml');
const file_path = path.join(__dirname,'..','swagger','userSwagger.yaml')
const spec = fs.readFileSync(file_path, 'utf8');
swaggerDocument = jsyaml.load(spec);
app.use(
    '/swgr',
    swaggerUi.serve, 
    swaggerUi.setup(swaggerDocument)
);

MongoClient.connect(url,(err,db)=>{
    if(err)throw err
    dbo = db.db(db_name)


    let u_counter;
    let initial_u_counter;

    dbo.collection('globals').find({}).toArray((err,result)=>{

        u_counter = result[0].userid
        initial_u_counter = u_counter


        function cleanup(){
            dbo.collection('globals').updateOne({'userid':initial_u_counter},{$set:{'userid':u_counter}},(err,result)=>{
            //console.log('Server Closed')
                process.exit(1)

            })
        }

        process.on('exit',cleanup)
        process.on('SIGINT',cleanup)

        //get complete user details from id
        app.get('/users/:user_id',async (req,res)=>{
        
            //fetch user id
            const user_id = String(req.params.user_id)
            //find the user is database
            dbo.collection('users').find({'Id':user_id}).toArray((err,result)=>{
                if(result.length == 1)
                {
                    res.send(result[0])
                }
                else
                {
                    res.send('Invalid User')
                }
            })
        })


        //post complete user details 
        app.post('/api/signup', (req,res)=>{

            const p = req.body.password
            //var pc = req.body.passwordConformation
            const Id = u_counter 
            const un = req.body.username 
            const e = req.body.email 
            const g = req.body.gender 

            dbo.collection('user').find({'username':un}).toArray((err,result)=>{
            // console.log(result.length)
                if (result.length==0)
                {
                    const u_obj={
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
                        res.send("User " +un +" is added succesfully")
                        u_counter+=1;
                    })                    
                }
                else{
                    res.send('Username already Exists')
                }
            })
        })

        // edit user profile
        app.patch('/users/:user_id/editprofile', verifyAuth, (req,res)=>{

            //only owner
            const user_id = String(req.params.user_id)
            //var p = req.body.password
            //var pc = req.body.passwordConformation
            //var e = req.body.image
            const g = (req.body.gender)
            const s = (req.body.SocialLink)
            dbo.collection('users').find({'Id':user_id}).toArray((err,result)=>{
                if(result.length==1){
                    dbo.collection('users').find({'Id':user_id}).toArray((err,result)=>{
                        if (result.length==1)
                        {
                            const u_obj={
                            //password:(p==undefined)?result[0].password:p,
                                gender:g,
                                SocialLink:s
                            }
                            dbo.collection('users').updateOne({"Id":String(user_id)},{$set:u_obj},(err,result)=>{
                                res.redirect(`/users/${user_id}`)
        
                            })
                      
                        }
                    })
                }
                else res.send('Invalid User')
            })
        
        })
        

        //delete user profile
        app.delete('/users/:user_id/delete', verifyAuth, (req,res)=>{
            const user_id = String(req.params.user_id)

            dbo.collection('users').find({'Id':user_id}).toArray((err,result)=>{

                if (result.length==1)
                {
                    const u = result[0]
                    dbo.collection('users').deleteOne({'Id':user_id},(err,result)=>{
                        res.send('User: '+u.username +' Deleted')
                    })
                }
                else res.send('Invalid User')
            })
        })   


        //get all the questions asked by the user
        app.get('/users/:user_id/questions', (req,res)=>{
            const user_id = String(req.params.user_id)

            dbo.collection('users').find({Id:user_id}).toArray((err,result)=>{
                if(result.length==1){
                    dbo.collection('questionAnswer').find({'OwnerUserId':user_id, 'PostTypeId':1}).toArray((err,result)=>{
                        if(result.length >= 1)
                            res.send(result)                            
                        else
                            res.send('You have not asked any questions yet')
                    })
                }
                else res.send('Invalid User')
            })
        
        })


        //get all the comments made by the user
        app.get('/users/:user_id/comments', (req,res)=>{
            const user_id = String(req.params.user_id)

            dbo.collection('users').find({Id:user_id}).toArray((err,result)=>{
                if(result.length==1){

                    dbo.collection('comments').find({'UserId':user_id}).toArray((err,result)=>{
                        if(result.length != 0)
                            res.send(result)
                        else if (result.length == 0)
                            res.send('You have not commented any posts yet')
                    })
                }
                else res.send('Invalid User')
            })

        
        })

        //get total number of questions posted by the user
        app.get('/users/:user_id/totalquestions', (req,res)=>{
            const user_id = String(req.params.user_id)

            dbo.collection('users').find({Id:user_id}).toArray((err,result)=>{
                if(result.length==1){
                    dbo.collection('questionAnswer').find({'OwnerUserId':user_id, 'PostTypeId':1}).toArray((err,result)=>{
                        res.send(JSON.stringify(result.length))
                    })
                }
                else res.send('Invalid User ID')

            })

        
        })

        //get total number of comments posted by the user
        app.get('/users/:user_id/totalcomments', (req,res)=>{
            const user_id = String(req.params.user_id)

            dbo.collection('users').find({'Id':user_id}).toArray((err,result)=>{
                if(result.length==1){
                    dbo.collection('comments').find({'UserId':user_id}).toArray((err,result)=>{
                        res.send(JSON.stringify(result.length))
                    })
                }
                else res.send('Invalid User ID')

            })
        
        })
        
        //get total number of answered posted by the user
        app.get('/users/:user_id/totalanswers', (req,res)=>{
            const user_id = String(req.params.user_id)
            dbo.collection('users').find({'Id':user_id}).toArray((err,result)=>{
                if(result.length==1){
                    dbo.collection('questionAnswer').find({'OwnerUserId':user_id, 'PostTypeId':2}).toArray((err,result)=>{
                        res.send(JSON.stringify(result.length))
                    })
                }
                else res.send('Invalid User ID')
            })
        
        })
    

        //get all the answers posted by the user
        app.get('/users/:user_id/answers', (req,res)=>{
            const user_id = String(req.params.user_id)
            dbo.collection('users').find({'Id':user_id}).toArray((err,result)=>{
                if(result.length==1){
                    dbo.collection('questionAnswer').find({'OwnerUserId':user_id, 'PostTypeId':2}).toArray((err,result)=>{
                        if(result.length!=0)
                            res.send(result)
                        else
                            res.send('You have not answered any quesions yet')
                    })
                }
                else res.send('Invalid User')
            })
        
        })

        app.get('/users' ,(req,res)=>{
            dbo.collection('users').find().toArray((err,result)=>{
                if(err) throw err
                if(result.length >= 1)
                    res.send(result)                    
                else
                    res.send('No users to display')
            })
        })

    })
})

module.exports = app


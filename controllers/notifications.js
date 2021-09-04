var express = require('express')
var app = express()
app.use(express.static(__dirname+'/public'))
app.use(express.json())
app.use(express.urlencoded({extended:true}))
var cors = require('cors')
app.use(cors())

app.listen(8083,()=>{
    console.log('Notification Controller Started')

})

/**
 * Id
 * UserId
 * PostId
 * Body
 * Status
 */

var MongoClient = require('mongodb').MongoClient


var url = 'mongodb+srv://pradyumnakedilaya:secret123%23@cluster0.vlavb.mongodb.net/skillenhancement?retryWrites=true&w=majority'
var db_name = 'skillenhancement'
var col_name_q = 'questionAnswer'
var col_name_u = 'users'
var col_noti = 'notifications'


var validate_user = require('./authorize')

MongoClient.connect(url,(err,db)=>{
    if(err)throw err
    dbo = db.db(db_name)

    //console.log('Motification Database Connected')

    //retrieves the notification counter(n_num) 
    dbo.collection('globals').find({}).toArray((err,result)=>{
        //console.log(result)
        q_counter = result[0].q_num
        initial_q_counter = q_counter

        n_counter = result[0].n_num
        initial_n_counter=n_counter

        //console.log(n_counter)



        //to update the notification counter back to the colletion 'globals'
    async function cleanup(){
        dbo.collection('globals').updateOne({'n_num':initial_n_counter},{$set:{'n_num':n_counter}},(err,result)=>{
            //console.log('Server Closed')
            //process.exit(1)

        })
    }

    // process.on('exit',cleanup)
    // process.on('SIGINT',cleanup)


    //api to get all unread notifications for a particular user
    app.get('/User/:User_Id/notifs',(req,res)=>{
        var token = req.headers['x-access-token']
        
        var User_Id = req.params.User_Id
        if(req.params.User_Id.length<=5)
        User_Id = parseInt(User_Id)
        
        console.log(User_Id)
        if(token == null  || token == undefined){
            res.send('Not Logged In')
        }
        else{
            dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{

                if(result.length == 1 && (uv =await validate_user(token,result[0])) && User_Id==result[0].Id){
                    var User = result[0]


                    dbo.collection(col_noti).find({'UserId':User_Id,'Status':'unread'}).toArray((err,result)=>{
                        if(err)
                            throw err
                        if(result.length!=0)
                        res.send(result)
                        else
                        res.send('No Unread Notifications')
                    })

                }
                else{
                    res.send('Invalid User')
                }
            })

        }
    })

    //api to read a particular notification for a particular user
    app.get('/User/:User_Id/:noti_id/read',(req,res)=>{
        var token = req.headers['x-access-token']
        var noti_id = parseInt(req.params.noti_id)
        
        var User_Id = req.params.User_Id
        if(req.params.User_Id.length<=5)
        User_Id = parseInt(User_Id)
        
        if(token == null  || token == undefined){
            res.send('Not Logged In')
        }
        else{
            dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{

                if(result.length == 1 && (uv =await validate_user(token,result[0])) && User_Id==result[0].Id){
                    var User = result[0]


                    dbo.collection(col_noti).find({'UserId':User_Id,'Id':noti_id}).toArray((err,result)=>{
                        if(err)
                            throw err
                        if(result.length == 1 && result[0].Status=='unread'){
                            dbo.collection(col_noti).updateOne({'UserId':User_Id,'Id':noti_id},{$set:{'Status':'read'}},(err,result)=>{
                                if(err)
                                    throw err
                                console.log(result)
                                res.redirect(`/User/${User_Id}/notifs`)
                            })
                        }
                        else{
                            res.send('Invalid Notification ID')
                        }
                    })

                }
                else{
                    res.send('Invalid User Id')
                }
            })

        }
    })

    //api to read all notifications for a particular user
    app.get('/User/:User_Id/readAll',(req,res)=>{
        var token = req.headers['x-access-token']
        
        var User_Id = req.params.User_Id
        if(req.params.User_Id.length<=5)
        User_Id = parseInt(User_Id)

        if(token == null  || token == undefined){
            res.send('Not Logged In')
        }
        else{
            dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{

                if(result.length == 1 && (uv =await validate_user(token,result[0])) && User_Id==result[0].Id){
                    var User = result[0]


                    dbo.collection(col_noti).updateMany({'UserId':User_Id,'Status':'unread'},{$set:{'Status':'read'}},(err,result)=>{
                        if(err)
                            throw err
                        console.log(result)
                        res.send('All Notifications Marked as Read')
                    })

                }
                else{
                    res.send('Invalid User Id')
                }
            })

        }
    })

    //api to push a notification for a particular user
    app.post('/User/:User_Id/push',(req,res)=>{
        var token = req.headers['x-access-token']
        console.log(req.body)
        var PostId = parseInt(req.body.PostId)

        var User_Id = req.params.User_Id
        if(req.params.User_Id.length<=5)
        User_Id = parseInt(User_Id)

        console.log('hi from noti')
        console.log(PostId)
        console.log(User_Id)
        if(token == null  || token == undefined){
            res.send('Not Logged In')
        }
        else{
            dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{

                if(result.length == 1 && (uv =await validate_user(token,result[0]))){
                    var User = result[0]
                    var Body = req.body.Body

                    dbo.collection(col_noti).insertOne({'Id':n_counter++,'Body':Body,'UserId':User_Id,'PostId':PostId,'Status':'unread'},async (err,result)=>{
                        if(err)
                            throw err
                        console.log(result)
                        await cleanup()
                        res.send('Pushed')
                    })

                }
                else{
                    res.send('Invalid User Id')
                }
            })

        }
    })

})
})
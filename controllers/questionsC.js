var express = require('express')
var app = express()
app.use(express.static(__dirname+'/public'))
app.use(express.json())
app.use(express.urlencoded({extended:true}))
var cors = require('cors')
app.use(cors())

var request = require('request')

// var server = app.listen(8089,()=>{
//     console.log('Question Controller Started')

// })

var MongoClient = require('mongodb').MongoClient


var url = 'mongodb+srv://pradyumnakedilaya:secret123%23@cluster0.vlavb.mongodb.net/skillenhancement?retryWrites=true&w=majority'
var db_name = 'skillenhancement'
var col_name_q = 'questionAnswer'
var col_name_u = 'users'


//var validate_user = require('/authorize')
var validate_user = require('C:\\Users\\d976640\\Documents\\skillenhance_OAuth\\controllers\\authorize.js')

var connection;
var dbo;

//connecting to the skillenhancement MongoDB Atlas Database


const dbconnect=async ()=>{
    connection = await MongoClient.connect(url)
    dbo = await connection.db(db_name)
}

var counters;
var q_counter,initial_q_counter,n_counter,initial_n_counter;

//fetching the q_num(post_counter) to generate unique ids 
const getCounters=async ()=>{
    counters = await dbo.collection('globals').find({})
    q_counter = initial_q_counter = await counters.q_num
    n_counter = initial_n_counter = await counters.n_num

}

const setup = async () =>{
    await dbconnect()
    await getCounters()
}

setup()

//persists the q_counter in the globals collection server close
async function cleanup(){
    await dbo.collection('globals').updateOne({'q_num':initial_q_counter},{$set:{'q_num':q_counter}},(err,result)=>{
        console.log('Server Closed')
        process.exit(1)

    })
    await connection.close()
}

process.on('exit',cleanup)
process.on('SIGINT',cleanup)

//api to get a specific question by id
app.get('/questions/:question_id',(req,res)=>{
    var question_id = parseInt(req.params.question_id)
    //console.log(question_id)
    //console.log(typeof question_id)
    //console.log('in qc')
    //checks question existence
    dbo.collection(col_name_q).find({'Id':question_id,'PostTypeId':1}).toArray((err,result)=>{
        //console.log(result)
        if(result.length == 1)
            {
                var question = result[0]
                dbo.collection(col_name_q).updateOne({'Id':question_id,'PostTypeId':1},{$inc:{'ViewCount':1}},(err,result)=>{
                    if(err) throw err
                    console.log(result)

                    question.ViewCount+=1
                    res.send(question)
                })
                
            }
        else
            {
                res.send('Invalid Question ID')

            }
    })
    
    
})

//api to get all questions in the collection 'questionAnswer'
app.get('/questions',(req,res)=>{
        
        console.log('/questions')
        dbo.collection(col_name_q).find({'PostTypeId':1}).toArray((err,result)=>{
            //res.render('user_profile.jade') //for answers & comments also
            res.send(result)
        })
    
})

//api to post a new question
app.post('/questions/add',(req,res)=>{
    
    var data = req.body
    var token = req.headers['x-access-token']

    console.log(token)
    console.log(typeof token)

    //login check
    if(token == null){
        res.send('Not Logged In')
    }
    else{
        
        dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{
            if(err) throw err

            console.log(result)
            //token existence check and validation
            if(result.length==1 && (uv =await validate_user(token,result[0]))){

                var q_obj={
                    Id:q_counter++,
                    PostTypeId:1,
                    AcceptedAnswerId:-1,
                    CreationDate:Date.now(),
                    Score:0,
                    ViewCount:0,
                    OwnerUserId:result[0].Id,
                    Title:data.Title,
                    Body:data.Body,
                    Tags:data.Tags,
                    ClosedDate:null
                }

                dbo.collection(col_name_q).insertOne(q_obj,(err,result)=>{
                    if(err) throw err
                    console.log(result)
                    //redirecting to the new question added
                    res.redirect(`/questions/${q_obj.Id}`)
                })

                
            }
            else{

                res.send('Invalid User')
            }
        })
    }

})

//api to vote a question
app.get('/questions/:question_id/:vote',(req,res)=>{

    var question_id = parseInt(req.params.question_id)
    var vote = req.params.vote
    var token = req.headers['x-access-token']

    //login check
    if(token==null){
        res.send('Not Logged In')
    }
    else{
        dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{
            if(err) throw err

            //token existence check & verification
            if(result.length==1 && (uv =await validate_user(token,result[0]))){
                
                var User = result[0]
                var ActionUserId = result[0].Id

                //question object existence check
                dbo.collection(col_name_q).find({'Id':question_id}).toArray((err,result)=>{
                    if(result.length==1){
                        var OwnerUserId = result[0].OwnerUserId
                        var PostTypeId = result[0].PostTypeId
                        var upd_sel={
                            'Id':question_id
                        }
                        var upd_params;

                        if(vote == 'upvote'){
                            upd_params = {
                                $inc:{
                                    'Score': 1
                                }
                            }
                        }
                        else if(vote == 'downvote'){
                            upd_params = {
                                $inc:{
                                    'Score': -1
                                }
                            }
                        }
                        
                        //update SCore
                        dbo.collection(col_name_q).updateOne(upd_sel,upd_params,(err,result)=>{
                            if(err) throw err
                            console.log(result)
                            
                            console.log('action user id'+ActionUserId)
                            console.log('owner user id'+OwnerUserId)

                            //notify to the user whose question is voted
                            new Promise((resolve,reject)=>{
                                if(ActionUserId != OwnerUserId){
                                    console.log('inside noti call')
                                    request.post({
                                        headers:{'content-type':'application/json',
                                            'x-access-token':token},
                                        url:`http://localhost:8083/User/${OwnerUserId}/push`,
                                        body:JSON.stringify({
                                            Body: User.username + " has Reacted On your Post",
                                            PostId:question_id
                                        })
                                    },(err,response)=>{
                                        if(err) throw err
                                        console.log(response.body)
                                        
                                    })
                                }
                                resolve()
                                
                            }).then(()=>{
                                if(PostTypeId == 1){
                                    res.redirect(`/questions/${question_id}`)
                                }
                                else if(PostTypeId == 2)
                                    res.send('Success')

                            })
                            

                        })


                    }
                    else{
                        res.send('Invalid Post ID')
                    }
                })

            }
            else{
                res.send('Invalid User')
            }
        })
    }

})

//api to undo the vote on a question
/**
 * this api was separately made apart from vote api above as it would come in handy if rather than keeping a net Score
 * value we have upvote and downvote counts separate
 */
app.get('/questions/:question_id/:vote/undo',(req,res)=>{

    var question_id = parseInt(req.params.question_id)
    var vote = req.params.vote
    var token = req.headers['x-access-token']

    //login check
    if(token==null){
        res.send('Not Logged In')
    }
    else{
        dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{
            if(err) throw err

            //token existence check & validation
            if(result.length==1 && (uv =await validate_user(token,result[0]))){

                var User = result[0]
                var ActionUserId = result[0].Id

                //question existence check
                dbo.collection(col_name_q).find({'Id':question_id}).toArray((err,result)=>{
                    if(result.length==1){
                        var OwnerUserId = result[0].OwnerUserId

                        var PostTypeId = result[0].PostTypeId


                        var upd_sel={
                            'Id':question_id
                        }
                        var upd_params;

                        if(vote == 'upvote'){
                            upd_params = {
                                $inc:{
                                    'Score': -1
                                }
                            }
                        }
                        else if(vote == 'downvote'){
                            upd_params = {
                                $inc:{
                                    'Score': 1
                                }
                            }
                        }
                        
                        //update the score
                        dbo.collection(col_name_q).updateOne(upd_sel,upd_params,(err,result)=>{
                            if(err) throw err
                            console.log(result)
                            
                            console.log('action user id'+ActionUserId)
                            console.log('owner user id'+OwnerUserId)

                            //notification sent to the owner of the post being reacted on 
                            new Promise((resolve,reject)=>{
                                if(ActionUserId != OwnerUserId){
                                    console.log('inside noti call')
                                    request.post({
                                        headers:{'content-type':'application/json',
                                            'x-access-token':token},
                                        url:`http://localhost:8083/User/${OwnerUserId}/push`,
                                        body:JSON.stringify({
                                            Body: User.username + " has Reacted On your Post",
                                            PostId:question_id
                                        })
                                    },(err,response)=>{
                                        if(err) throw err
                                        console.log(response.body)
                                        
                                    })
                                }
                                resolve()
                                
                            }).then(()=>{
                                if(PostTypeId == 1){
                                    res.redirect(`/questions/${question_id}`)
                                }
                                else if(PostTypeId == 2)
                                    res.send('Success')

                            })
                        })

                        

                    }
                    else{
                        res.send('Invalid Post ID')
                    }
                })

            }
            else{
                res.send('Invalid User')
            }
        })
    }

})

//api to delete a particular question
app.post('/questions/:question_id/delete',(req,res)=>{

    var question_id = parseInt(req.params.question_id)
    var token = req.headers['x-access-token']

    //login check
    if(token == null){
        res.send('Not Logged In')
    }
    else{
        dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{

            //token existence check & verification
            if(result.length == 1 && (uv =await validate_user(token,result[0]))){

                var User = result[0]

                //question existence check
                dbo.collection(col_name_q).find({'Id':question_id,'PostTypeId':1}).toArray((err,result)=>{

                    //Checking if the user executing delete is the owner of the question
                    if(result.length == 1 && result[0].OwnerUserId==User.Id){
                        var PostTypeId = result[0].PostTypeId

                        //delete op
                        dbo.collection(col_name_q).deleteOne({'Id':question_id},(err,result)=>{
                            if(err) throw err
                            console.log(result)

                            //sending notification to everyone who answered the question
                            dbo.collection(col_name_q).find({'PostTypeId':2,'ParentId':question_id}).toArray((err,result)=>{
                                var ans_set=new Set()

                                new Promise(async (resolve,reject)=>{
                                    await result.forEach(res=>ans_set.add(res.OwnerUserId))
                                    resolve()
                                }).then(()=>{
                                    new Promise((resolve,reject)=>{
                                        ans_set.forEach((answer)=>{
                                            if(answer!=User.Id){
                                            console.log('inside noti call')
                                            new Promise((resolve,reject)=>{
                                                request.post({
                                                    headers:{'content-type':'application/json',
                                                        'x-access-token':token},
                                                    url:`http://localhost:8083/User/${answer}/push`,
                                                    body:JSON.stringify({
                                                        Body: User.username + " has deleted the post you answerd on",
                                                        PostId:question_id
                                                    })
                                                },(err,response)=>{
                                                    if(err) throw err
                                                    console.log(response.body)
                                                    
                                                })
                                                resolve()
                                            }).then(()=>{})
                                            }
        
                                        })
                                        resolve()
                                    }).then(()=>{
                                        if(PostTypeId == 1){
                                            res.redirect('/questions')
                                        }
                                        else if(PostTypeId == 2)
                                            res.send('Success')
        
                                    })
                                })
                                
                                
                            })

                            
                        })
                    }
                    else{
                        res.send('Invalid Question ID')
                    }
                })

            }
            else{
                res.send('Invalid User')
            }

        })
    }
})

//api to edit a question
app.post('/questions/:question_id/edit',(req,res)=>{


    var question_id = parseInt(req.params.question_id)
    var token = req.headers['x-access-token']
    var data = req.body

    //login check
    if(token == null){
        res.send('Not Logged In')
    }
    else{
        dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{

            //token existence check & verification
            if(result.length == 1 && (uv =await validate_user(token,result[0]))){

                var User = result[0]

                //question existence check
                dbo.collection(col_name_q).find({'Id':question_id}).toArray((err,result)=>{
                    
                    //checking if the user calling edit is the owner of the question
                    if(result.length == 1 && result[0].OwnerUserId==User.Id){
                        if(result[0].ClosedDate!=null){
                            res.send('Question is Closed')
                        }
                        var PostTypeId = result[0].PostTypeId

                        var upd_sel={
                            'Id':question_id
                        }
                        let Title_new = (data.Title==undefined)?result[0].Title:data.Title
                        let Body_new = (data.Body==undefined)?result[0].Body:data.Body
                        let Tags_new = (data.Tags==undefined)?result[0].Tags:data.Tags
                        var upd_params;
                        if(PostTypeId == 1){
                            upd_params = {
                                $set:{
                                    'Title':Title_new,
                                    'Body':Body_new,
                                    'Tags':Tags_new
                                }
                            }
                        }
                        else if(PostTypeId == 2){
                            upd_params = {
                                $set:{
                                    'Body':Body_new,
                                    'Tags':Tags_new
                                }
                            }
                        }

                        dbo.collection(col_name_q).updateOne(upd_sel,upd_params,(err,result)=>{
                            if(err) throw err
                            console.log(result)


                            //notifications sent to all users who have answered this question
                            dbo.collection(col_name_q).find({'PostTypeId':2,'ParentId':question_id}).toArray((err,result)=>{
                                
                                var ans_set=new Set()
                                new Promise(async (resolve,reject)=>{
                                    await result.forEach(res=>ans_set.add(res.OwnerUserId))
                                    resolve()
                                }).then(()=>{
                                        new Promise((resolve,reject)=>{
                                    ans_set.forEach((answer)=>{
                                        if(answer!=User.Id){
                                        console.log('inside noti call')
                                        new Promise((resolve,reject)=>{
                                            request.post({
                                                headers:{'content-type':'application/json',
                                                    'x-access-token':token},
                                                url:`http://localhost:8083/User/${answer}/push`,
                                                body:JSON.stringify({
                                                    Body: User.username + " has Editted the post you answerd on",
                                                    PostId:question_id
                                                })
                                            },(err,response)=>{
                                                if(err) throw err
                                                console.log(response.body)
                
                                            })
                                            resolve()
                                        }).then(()=>{})
                                        }
    
                                    })
                                    resolve()

                                }).then(()=>{
                                    if(PostTypeId == 1){
                                        res.redirect(`/questions/${question_id}`)
                                    }
                                    else if(PostTypeId == 2)
                                        res.send('Success')

                                })
                                })

                                
                                    
                            })

                        })

                        
                    }
                    else{
                        res.send('Invalid Post ID')
                    }
                })

            }
            else{
                res.send('Invalid User')
            }

        })
    }


})

//api to fetch all answers for a question
app.post('/questions/:question_id/answers',(req,res)=>{

    console.log('hi')
    var question_id = parseInt(req.params.question_id)
    console.log(question_id)
    dbo.collection(col_name_q).find({'Id':question_id,'PostTypeId':1}).toArray((err,result)=>{
        if(result.length == 1){
            dbo.collection(col_name_q).find({'PostTypeId':2,'ParentId':question_id}).toArray((err,result)=>{
                if(err) throw err
                console.log(result)
                res.send((result))
            })
        }
        else res.send('Invalid Question ID')
    })
    

})

//api to add an answer to a specific question
app.post('/questions/:question_id/answers/add',(req,res)=>{
    var question_id = parseInt(req.params.question_id)
    var token = req.headers['x-access-token']
    var data = req.body

    console.log('hi')

    if(token == null){
        res.send('Not Logged In')
    }
    else{
        dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{

            if(err) throw err

            if(result.length == 1 && (uv =await validate_user(token,result[0]))){
                
                var ActionUserId = result[0].Id

                var User = result[0]

                dbo.collection(col_name_q).find({'Id':question_id,'PostTypeId':1}).toArray((err,result)=>{
                    if(err) throw err
                    if(result.length == 1){
                        //closed question cant accept answers
                        if(result[0].ClosedDate==null){

                            var OwnerUserId = result[0].OwnerUserId

                        var a_obj={
                            'Id':q_counter++,
                            'PostTypeId':2,
                            'ParentId':question_id,
                            'CreationDate':Date.now(),
                            'Score':0,
                            'ViewCount':0,
                            'Body':data.Body,
                            'OwnerUserId':User.Id,
                            'Tags':data.Tags,
                        }

                        dbo.collection(col_name_q).insertOne(a_obj,(err,result)=>{
                            if(err) throw err
                            console.log(result)

                            console.log('action user id'+ActionUserId)
                            console.log('owner user id'+OwnerUserId)

                            //notification sent to the owner of the question
                            if(ActionUserId != OwnerUserId){
                                console.log('inside noti call')
                                request.post({
                                    headers:{'content-type':'application/json',
                                        'x-access-token':token},
                                    url:`http://localhost:8083/User/${OwnerUserId}/push`,
                                    body:JSON.stringify({
                                        Body: User.username + " has answerd to your question",
                                        PostId:question_id
                                    })
                                },(err,response)=>{
                                    if(err) throw err
                                    console.log(response.body)
                                    res.redirect(`http://localhost:8088/answers/${a_obj.Id}`)
                                    
                                    
    
                                })
                            }
                            else 
                                res.redirect(`http://localhost:8088/answers/${a_obj.Id}`)

                        })
                        }
                        else{
                            res.send('Already Closed Question')
                        }
                        
                    }
                    else{
                        res.send('Invalid Question ID')
                    }
                })

            }
            else{
                res.send('Invalid User')
            }

        })
    }


})

//api to close the question & notifications sent to all the users who answered
app.post('/questions/:question_id/close',(req,res)=>{
    var question_id = parseInt(req.params.question_id)
    var token = req.headers['x-access-token']

    if(token == null){
        res.send('Not Logged In')
    }
    else{
        dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{

            if(result.length == 1 && (uv =await validate_user(token,result[0]))){

                var User = result[0]
                console.log('User ---- '+User.Id)

                dbo.collection(col_name_q).find({'Id':question_id,'PostTypeId':1}).toArray((err,result)=>{
                    console.log(result[0])
                    if(result.length == 1 && result[0].OwnerUserId==User.Id){
                        if(result[0].ClosedDate!=null){
                            res.send('Already in Closed State')
                        }
                        else{
                        var OwnerUserId = result[0].OwnerUserId

                        dbo.collection(col_name_q).updateOne({'Id':question_id},{$set:{'ClosedDate':Date.now()}},(err,result)=>{
                            if(err) throw err
                            console.log(result)


                            dbo.collection(col_name_q).find({'PostTypeId':2,'ParentId':question_id}).toArray((err,result)=>{
                                
                                var ans_set=new Set()
                                new Promise(async (resolve,reject)=>{
                                    await result.forEach(res=>ans_set.add(res.OwnerUserId))
                                    resolve()
                                }).then(()=>{
                                    new Promise((resolve,reject)=>{
                                        ans_set.forEach((answer)=>{
                                            console.log(answer)
                                            console.log(typeof answer)
                                            answer=JSON.parse(answer)
                                            if(answer!=User.Id){
                                            console.log('inside noti call')
                                            new Promise((resolve,reject)=>{
                                                request.post({
                                                    headers:{'content-type':'application/json',
                                                        'x-access-token':token},
                                                    url:`http://localhost:8083/User/${answer}/push`,
                                                    body:JSON.stringify({
                                                        Body: User.username + " has Closed the post you answerd on",
                                                        PostId:question_id
                                                    })
                                                },(err,response)=>{
                                                    if(err) throw err
                                                    console.log(response.body)
                    
                                                })
                                                resolve()
                                            }).then(()=>{})
                                            }
        
                                        })
                                        resolve()
    
                                    }).then(()=>{
                                        
                                            res.redirect(`/questions/${question_id}`)
                                        

                                    })
                                })

                                
                                    
                            })


                            
                        })
                        }
                    }
                    else{
                        res.send('Invalid Question ID')
                    }
                })

            }
            else{
                res.send('Invalid User')
            }

        })
    }

})

//api to reopen the question & notifications sent to all the users who answered
app.post('/questions/:question_id/reopen',(req,res)=>{
    var question_id = parseInt(req.params.question_id)
    var token = req.headers['x-access-token']

    if(token == null){
        res.send('Not Logged In')
    }
    else{
        dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{

            if(result.length == 1 && (uv =await validate_user(token,result[0]))){

                var User = result[0]
                console.log('User ---- '+User.Id)

                dbo.collection(col_name_q).find({'Id':question_id,'PostTypeId':1}).toArray((err,result)=>{
                    console.log(result[0])
                    if(result.length == 1 && result[0].OwnerUserId==User.Id){
                        if(result[0].ClosedDate==null){
                            res.send('Question is Already Open')
                        }
                        else{
                        var OwnerUserId = result[0].OwnerUserId

                        dbo.collection(col_name_q).updateOne({'Id':question_id},{$set:{'ClosedDate':null}},(err,result)=>{
                            if(err) throw err
                            console.log(result)


                            dbo.collection(col_name_q).find({'PostTypeId':2,'ParentId':question_id}).toArray((err,result)=>{

                                var ans_set=new Set()
                                new Promise(async (resolve,reject)=>{
                                    await result.forEach(res=>ans_set.add(res.OwnerUserId))
                                    resolve()
                                }).then(()=>{
                                    new Promise((resolve,reject)=>{
                                        ans_set.forEach((answer)=>{
                                            console.log('inside noti call')
                                            if(answer!=User.Id){
                                            new Promise((resolve,reject)=>{
                                                request.post({
                                                    headers:{'content-type':'application/json',
                                                        'x-access-token':token},
                                                    url:`http://localhost:8083/User/${answer}/push`,
                                                    body:JSON.stringify({
                                                        Body: User.username + " has ReOpened the post you answerd on",
                                                        PostId:question_id
                                                    })
                                                },(err,response)=>{
                                                    if(err) throw err
                                                    console.log(response.body)
                    
                                                })
                                                resolve()
                                            }).then(()=>{})
                                            }
        
                                        })
                                        resolve()
    
                                    }).then(()=>{
                                        
                                            res.redirect(`/questions/${question_id}`)
                                        

                                    })
                                })
                                
                                    
                            })



                        })
                    }
                    }
                    else{
                        res.send('Invalid Question ID')
                    }
                })

            }
            else{
                res.send('Invalid User')
            }

        })
    }

})


module.exports = app

const express = require('express');
const app = express();
app.use(express.static(__dirname+'/public'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
const cors = require('cors');
app.use(cors());

const path = require('path')
const swaggerUi = require("swagger-ui-express")
const fs = require('fs')
const jsyaml = require('js-yaml');
const file_path = path.join(__dirname,'..','swagger','questionSwagger.yaml')
const spec = fs.readFileSync(file_path, 'utf8');
const swaggerDocument = jsyaml.load(spec);
app.use(
    '/swgr',
    swaggerUi.serve, 
    swaggerUi.setup(swaggerDocument)
);

require('dotenv').config()

const request = require('request');


const MongoClient = require('mongodb').MongoClient;


const url = 'mongodb+srv://pradyumnakedilaya:secret123%23@cluster0.vlavb.mongodb.net/skillenhancement?retryWrites=true&w=majority';
const db_name = 'skillenhancement';
const col_name_q = 'questionAnswer';
const col_name_u = 'users';


const validate_user = require('./authorize');
const { connection } = require('mongoose');

//connecting to the skillenhancement MongoDB Atlas Database
MongoClient.connect(url,(err,db)=>{
    if(err)throw err;
    const dbo = db.db(db_name);


    let q_counter;
    let initial_q_counter;

    //fetching the q_num(post_counter) to generate unique ids 
    dbo.collection('globals').find({}).toArray((err,result)=>{
        q_counter = result[0].q_num;
        initial_q_counter = q_counter;


        //persists the q_counter in the globals collection server close
        async function cleanup(){
            dbo.collection('globals').updateOne({'q_num':initial_q_counter},{$set:{'q_num':q_counter}})
        }

    
        //api to get a specific question by id
        app.get('/questions/:question_id',(req,res)=>{
            const question_id = parseInt(req.params.question_id);

            //checks question existence
            dbo.collection(col_name_q).find({'Id':question_id,'PostTypeId':1}).toArray((err,result)=>{
                if(result.length == 1)
                {
                    const question = result[0];
                    dbo.collection(col_name_q).updateOne({'Id':question_id,'PostTypeId':1},{$inc:{'ViewCount':1}},(err,result)=>{
                        if(err) throw err;

                        question.ViewCount+=1;
                        res.send(question);
                    });
                    
                }
                else
                {
                    res.send('Invalid Question ID');

                }
            });
        
       
        });

        //api to get all questions in the collection 'questionAnswer'
        app.get('/questions',(req,res)=>{
            
            dbo.collection(col_name_q).find({'PostTypeId':1}).toArray((err,result)=>{
                res.send(result);
            });
        
        });

        //api to post a new question
        app.post('/questions/add',(req,res)=>{
        
            const data = req.body;
            const token = req.headers['x-access-token'];

            //login check
            if(token == null || token == undefined){
                res.send('Not Logged In');
            }
            else{
            
                dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{
                    if(err) throw err;

                    //token existence check and validation
                    if(result.length==1 && (uv =await validate_user(token,result[0]))){

                        const q_obj={
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
                        };

                        await cleanup();
                    
                        dbo.collection(col_name_q).insertOne(q_obj,(err,result)=>{
                            if(err) throw err;
                            //redirecting to the new question added
                            res.redirect(`/questions/${q_obj.Id}`);
                        });

                    
                    }
                    else{

                        res.send('Invalid User');
                    }
                });
            }

        });

        //api to vote a question
        app.get('/questions/:question_id/:vote',(req,res)=>{

            const question_id = parseInt(req.params.question_id);
            const vote = req.params.vote;
            const token = req.headers['x-access-token'];

            //login check
            if(token == null || token == undefined){
                res.send('Not Logged In');
            }
            else{
                dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{
                    if(err) throw err;

                    //token existence check & verification
                    if(result.length==1 && (uv =await validate_user(token,result[0]))){
                    
                        const User = result[0];
                        const ActionUserId = result[0].Id;

                        //question object existence check
                        dbo.collection(col_name_q).find({'Id':question_id}).toArray(async (err,result)=>{
                            if(result.length==1){
                                const OwnerUserId = result[0].OwnerUserId;
                                const PostTypeId = result[0].PostTypeId;
                            
                                let amt,sts;
                                const query_res = await dbo.collection('votes').find({'PostId':question_id,'UserId':User.Id,'PostTypeId':PostTypeId}).toArray();
                                if(query_res.length == 0){
                                    amt=(vote=='upvote')?1:-1;
                                    sts=amt;
                                }
                                else{
                                    const doc = query_res[0];
                                    if(doc.Status==1)
                                    {
                                        if(vote=='upvote')
                                        {
                                            await dbo.collection('votes').deleteOne({'PostId':question_id,'UserId':User.Id,'PostTypeId':PostTypeId});
                                            amt = -1;
                                            sts=0;
                                        }
                                        else if(vote=='downvote'){
                                            amt=-2;
                                            sts=-1;
                                        }
                                    }
                                    else if(doc.Status == -1)
                                    {
                                        if(vote=='downvote')
                                        {
                                            await dbo.collection('votes').deleteOne({'PostId':question_id,'UserId':User.Id,'PostTypeId':PostTypeId});
                                            amt = 1;
                                            sts=0;
                                        }
                                        else if(vote=='upvote'){
                                            amt=2;
                                            sts=1;
                                        }
                                    }
                                }

                                if(sts!=0)
                                    await dbo.collection('votes').updateOne({'PostId':question_id,'UserId':User.Id,'PostTypeId':PostTypeId},{$set:{'Status':sts}},{upsert:true});

                                const upd_sel={
                                    'Id':question_id
                                };
                            
                                const upd_params = {
                                    $inc:{
                                        'Score': amt
                                    }
                                };

                                //update SCore
                                dbo.collection(col_name_q).updateOne(upd_sel,upd_params,(err,result)=>{
                                    if(err) throw err;

                                    //notify to the user whose question is voted
                                    new Promise((resolve,reject)=>{
                                        if(ActionUserId != OwnerUserId){
                                            request.post({
                                                headers:{'content-type':'application/json',
                                                    'x-access-token':token},
                                                url:`http://${process.env.HOST}:8083/User/${OwnerUserId}/push`,
                                                body:JSON.stringify({
                                                    Body: User.username + " has Reacted On your Post",
                                                    PostId:question_id
                                                })
                                            },(err,response)=>{
                                                if(err) throw err;
                                            
                                            });
                                        }
                                        resolve();
                                    
                                    }).then(()=>{
                                        if(PostTypeId == 1){
                                            res.redirect(`/questions/${question_id}`);
                                        }
                                        else if(PostTypeId == 2)
                                            res.send('Success');

                                    });
                                

                                });


                            }
                            else{
                                res.send('Invalid Post ID');
                            }
                        });

                    }
                    else{
                        res.send('Invalid User');
                    }
                });
            }

        });

        app.get('/questions/:question_id/:vote/undo',(req,res)=>{

            const question_id = parseInt(req.params.question_id);
            const vote = req.params.vote;
            const token = req.headers['x-access-token'];

            //login check
            if(token == null || token == undefined){
                res.send('Not Logged In');
            }
            else{
                dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{
                    if(err) throw err;

                    //token existence check & validation
                    if(result.length==1 && (uv =await validate_user(token,result[0]))){

                        const User = result[0];
                        const ActionUserId = result[0].Id;

                        //question existence check
                        dbo.collection(col_name_q).find({'Id':question_id}).toArray((err,result)=>{
                            if(result.length==1){
                                const OwnerUserId = result[0].OwnerUserId;

                                const PostTypeId = result[0].PostTypeId;


                                const upd_sel={
                                    'Id':question_id
                                };
                                let upd_params;

                                if(vote == 'upvote'){
                                    upd_params = {
                                        $inc:{
                                            'Score': -1
                                        }
                                    };
                                }
                                else if(vote == 'downvote'){
                                    upd_params = {
                                        $inc:{
                                            'Score': 1
                                        }
                                    };
                                }
                            
                                //update the score
                                dbo.collection(col_name_q).updateOne(upd_sel,upd_params,(err,result)=>{
                                    if(err) throw err;

                                    //notification sent to the owner of the post being reacted on 
                                    new Promise((resolve,reject)=>{
                                        if(ActionUserId != OwnerUserId){
                                            request.post({
                                                headers:{'content-type':'application/json',
                                                    'x-access-token':token},
                                                url:`http://${process.env.HOST}:8083/User/${OwnerUserId}/push`,
                                                body:JSON.stringify({
                                                    Body: User.username + " has Reacted On your Post",
                                                    PostId:question_id
                                                })
                                            },(err,response)=>{
                                                if(err) throw err;
                                            
                                            });
                                        }
                                        resolve();
                                    
                                    }).then(()=>{
                                        if(PostTypeId == 1){
                                            res.redirect(`/questions/${question_id}`);
                                        }
                                        else if(PostTypeId == 2)
                                            res.send('Success');

                                    });
                                });
                            

                            }
                            else{
                                res.send('Invalid Post ID');
                            }
                        });

                    }
                    else{
                        res.send('Invalid User');
                    }
                });
            }

        });

        //api to delete a particular question
        app.post('/questions/:question_id/delete',(req,res)=>{

            const question_id = parseInt(req.params.question_id);
            const token = req.headers['x-access-token'];

            //login check
            if(token == null || token == undefined){
                res.send('Not Logged In');
            }
            else{
                dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{

                    //token existence check & verification
                    if(result.length == 1 && (uv =await validate_user(token,result[0]))){

                        const User = result[0];

                        //question existence check
                        dbo.collection(col_name_q).find({'Id':question_id,'PostTypeId':1}).toArray((err,result)=>{

                            //Checking if the user executing delete is the owner of the question
                            if(result.length == 1 && result[0].OwnerUserId==User.Id){
                                const PostTypeId = result[0].PostTypeId;

                                //delete op
                                dbo.collection(col_name_q).deleteOne({'Id':question_id},(err,result)=>{
                                    if(err) throw err;

                                    //sending notification to everyone who answered the question
                                    dbo.collection(col_name_q).find({'PostTypeId':2,'ParentId':question_id}).toArray((err,result)=>{
                                        const ans_set=new Set();

                                        new Promise(async (resolve,reject)=>{
                                            await result.forEach(res=>ans_set.add(res.OwnerUserId));
                                            resolve();
                                        }).then(()=>{
                                            new Promise((resolve,reject)=>{
                                                ans_set.forEach((answer)=>{
                                                    if(answer!=User.Id){
                                                        new Promise((resolve,reject)=>{
                                                            request.post({
                                                                headers:{'content-type':'application/json',
                                                                    'x-access-token':token},
                                                                url:`http://${process.env.HOST}:8083/User/${answer}/push`,
                                                                body:JSON.stringify({
                                                                    Body: User.username + " has deleted the post you answerd on",
                                                                    PostId:question_id
                                                                })
                                                            },(err,response)=>{
                                                                if(err) throw err;
                                                        
                                                            });
                                                            resolve();
                                                        }).then(()=>{});
                                                    }
            
                                                });
                                                resolve();
                                            }).then(()=>{
                                                if(PostTypeId == 1){
                                                    res.redirect('/questions');
                                                }
                                                else if(PostTypeId == 2)
                                                    res.send('Success');
            
                                            });
                                        });
                                    
                                    
                                    });

                                
                                });
                            }
                            else{
                                res.send('Invalid Question ID');
                            }
                        });

                    }
                    else{
                        res.send('Invalid User');
                    }

                });
            }
        });

        //api to edit a question
        app.post('/questions/:question_id/edit',(req,res)=>{


            const question_id = parseInt(req.params.question_id);
            const token = req.headers['x-access-token'];
            const data = req.body;

            //login check
            if(token == null || token == undefined){
                res.send('Not Logged In');
            }
            else{
                dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{

                    //token existence check & verification
                    if(result.length == 1 && (uv =await validate_user(token,result[0]))){

                        const User = result[0];

                        //question existence check
                        dbo.collection(col_name_q).find({'Id':question_id}).toArray((err,result)=>{
                        
                            //checking if the user calling edit is the owner of the question
                            if(result.length == 1 && result[0].OwnerUserId==User.Id){
                                if(result[0].ClosedDate!=null){
                                    res.send('Question is Closed');
                                }
                                else{
                                    const PostTypeId = result[0].PostTypeId;

                                    const upd_sel={
                                        'Id':question_id
                                    };
                                    const Title_new = (data.Title==undefined)?result[0].Title:data.Title;
                                    const Body_new = (data.Body==undefined)?result[0].Body:data.Body;
                                    const Tags_new = (data.Tags==undefined)?result[0].Tags:data.Tags;
                                    let upd_params;
                                    if(PostTypeId == 1){
                                        upd_params = {
                                            $set:{
                                                'Title':Title_new,
                                                'Body':Body_new,
                                                'Tags':Tags_new
                                            }
                                        };
                                    }
                                    else if(PostTypeId == 2){
                                        upd_params = {
                                            $set:{
                                                'Body':Body_new,
                                                'Tags':Tags_new
                                            }
                                        };
                                    }

                                    dbo.collection(col_name_q).updateOne(upd_sel,upd_params,(err,result)=>{
                                        if(err) throw err;    

                                        //notifications sent to all users who have answered this question
                                        dbo.collection(col_name_q).find({'PostTypeId':2,'ParentId':question_id}).toArray((err,result)=>{
                                    
                                            const ans_set=new Set();
                                            new Promise(async (resolve,reject)=>{
                                                await result.forEach(res=>ans_set.add(res.OwnerUserId));
                                                resolve();
                                            }).then(()=>{
                                                new Promise((resolve,reject)=>{
                                                    ans_set.forEach((answer)=>{
                                                        if(answer!=User.Id){
                                                            new Promise((resolve,reject)=>{
                                                                request.post({
                                                                    headers:{'content-type':'application/json',
                                                                        'x-access-token':token},
                                                                    url:`http://${process.env.HOST}:8083/User/${answer}/push`,
                                                                    body:JSON.stringify({
                                                                        Body: User.username + " has Editted the post you answerd on",
                                                                        PostId:question_id
                                                                    })
                                                                },(err,response)=>{
                                                                    if(err) throw err;
                    
                                                                });
                                                                resolve();
                                                            }).then(()=>{});
                                                        }
        
                                                    });
                                                    resolve();
    
                                                }).then(()=>{
                                                    if(PostTypeId == 1){
                                                        res.redirect(`/questions/${question_id}`);
                                                    }
                                                    else if(PostTypeId == 2)
                                                        res.send('Success');

                                                });
                                            });
                                    
                                        
                                        });

                                    });

                                }
                            }
                            else{
                                res.send('Invalid Post ID');
                            }
                        });

                    }
                    else{
                        res.send('Invalid User');
                    }

                });
            }


        });
    
        //api to fetch all answers for a question
        app.post('/questions/:question_id/answers',(req,res)=>{

            const question_id = parseInt(req.params.question_id);
            dbo.collection(col_name_q).find({'Id':question_id,'PostTypeId':1}).toArray((err,result)=>{
                if(result.length == 1){
                    dbo.collection(col_name_q).find({'PostTypeId':2,'ParentId':question_id}).toArray((err,result)=>{
                        if(err) throw err;
                        res.send((result));
                    });
                }
                else res.send('Invalid Question ID');
            });
        

        });

        //api to add an answer to a specific question
        app.post('/questions/:question_id/answers/add',(req,res)=>{
            const question_id = parseInt(req.params.question_id);
            const token = req.headers['x-access-token'];
            const data = req.body;

            if(token == null || token == undefined){
                res.send('Not Logged In');
            }
            else{
                dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{

                    if(err) throw err;

                    if(result.length == 1 && (uv =await validate_user(token,result[0]))){
                    
                        const ActionUserId = result[0].Id;

                        const User = result[0];

                        dbo.collection(col_name_q).find({'Id':question_id,'PostTypeId':1}).toArray(async (err,result)=>{
                            if(err) throw err;
                            if(result.length == 1){
                            //closed question cant accept answers
                                if(result[0].ClosedDate==null){

                                    const OwnerUserId = result[0].OwnerUserId;

                                    const a_obj={
                                        'Id':q_counter++,
                                        'PostTypeId':2,
                                        'ParentId':question_id,
                                        'CreationDate':Date.now(),
                                        'Score':0,
                                        'ViewCount':0,
                                        'Body':data.Body,
                                        'OwnerUserId':User.Id,
                                    };

                                    await cleanup();

                                    dbo.collection(col_name_q).insertOne(a_obj,(err,result)=>{
                                        if(err) throw err;

                                        //notification sent to the owner of the question
                                        if(ActionUserId != OwnerUserId){
                                            request.post({
                                                headers:{'content-type':'application/json',
                                                    'x-access-token':token},
                                                url:`http://${process.env.HOST}:8083/User/${OwnerUserId}/push`,
                                                body:JSON.stringify({
                                                    Body: User.username + " has answerd to your question",
                                                    PostId:question_id
                                                })
                                            },(err,response)=>{
                                                if(err) throw err;
                                                res.redirect(`http://${process.env.HOST}:8088/answers/${a_obj.Id}`);
                                        
        
                                            });
                                        }
                                        else 
                                            res.redirect(`http://${process.env.HOST}:8088/answers/${a_obj.Id}`);

                                    });
                                }
                                else{
                                    res.send('Already Closed Question');
                                }
                            
                            }
                            else{
                                res.send('Invalid Question ID');
                            }
                        });

                    }
                    else{
                        res.send('Invalid User');
                    }

                });
            }


        });

        //api to close the question & notifications sent to all the users who answered
        app.post('/questions/:question_id/close',(req,res)=>{
            const question_id = parseInt(req.params.question_id);
            const token = req.headers['x-access-token'];

            if(token == null || token == undefined){
                res.send('Not Logged In');
            }
            else{
                dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{

                    if(result.length == 1 && (uv =await validate_user(token,result[0]))){

                        const User = result[0];

                        dbo.collection(col_name_q).find({'Id':question_id,'PostTypeId':1}).toArray((err,result)=>{
                            if(result.length == 1 && result[0].OwnerUserId==User.Id){
                                if(result[0].ClosedDate!=null){
                                    res.send('Already in Closed State');
                                }
                                else{
                                    const OwnerUserId = result[0].OwnerUserId;

                                    dbo.collection(col_name_q).updateOne({'Id':question_id},{$set:{'ClosedDate':Date.now()}},(err,result)=>{
                                        if(err) throw err;

                                        dbo.collection(col_name_q).find({'PostTypeId':2,'ParentId':question_id}).toArray((err,result)=>{
                                   
                                            const ans_set=new Set();
                                            new Promise(async (resolve,reject)=>{
                                                await result.forEach(res=>ans_set.add(res.OwnerUserId));
                                                resolve();
                                            }).then(()=>{
                                                new Promise((resolve,reject)=>{
                                                    ans_set.forEach((answer)=>{
                                                        answer=JSON.parse(answer);
                                                        if(answer!=User.Id){
                                                            new Promise((resolve,reject)=>{
                                                                request.post({
                                                                    headers:{'content-type':'application/json',
                                                                        'x-access-token':token},
                                                                    url:`http://${process.env.HOST}:8083/User/${answer}/push`,
                                                                    body:JSON.stringify({
                                                                        Body: User.username + " has Closed the post you answerd on",
                                                                        PostId:question_id
                                                                    })
                                                                },(err,response)=>{
                                                                    if(err) throw err;
                        
                                                                });
                                                                resolve();
                                                            }).then(()=>{});
                                                        }
            
                                                    });
                                                    resolve();
        
                                                }).then(()=>{
                                            
                                                    res.redirect(`/questions/${question_id}`);
                                            
    
                                                });
                                            });
                                    
                                        
                                        });

                                
                                    });
                                }
                            }
                            else{
                                res.send('Invalid Question ID');
                            }
                        });

                    }
                    else{
                        res.send('Invalid User');
                    }

                });
            }

        });

        //api to reopen the question & notifications sent to all the users who answered
        app.post('/questions/:question_id/reopen',(req,res)=>{
            const question_id = parseInt(req.params.question_id);
            const token = req.headers['x-access-token'];

            if(token == null || token == undefined){
                res.send('Not Logged In');
            }
            else{
                dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{

                    if(result.length == 1 && (uv =await validate_user(token,result[0]))){

                        const User = result[0];

                        dbo.collection(col_name_q).find({'Id':question_id,'PostTypeId':1}).toArray((err,result)=>{
                            if(result.length == 1 && result[0].OwnerUserId==User.Id){
                                if(result[0].ClosedDate==null){
                                    res.send('Question is Already Open');
                                }
                                else{
                                    const OwnerUserId = result[0].OwnerUserId;

                                    dbo.collection(col_name_q).updateOne({'Id':question_id},{$set:{'ClosedDate':null}},(err,result)=>{
                                        if(err) throw err;

                                        dbo.collection(col_name_q).find({'PostTypeId':2,'ParentId':question_id}).toArray((err,result)=>{

                                            const ans_set=new Set();
                                            new Promise(async (resolve,reject)=>{
                                                await result.forEach(res=>ans_set.add(res.OwnerUserId));
                                                resolve();
                                            }).then(()=>{
                                                new Promise((resolve,reject)=>{
                                                    ans_set.forEach((answer)=>{
                                                        if(answer!=User.Id){
                                                            new Promise((resolve,reject)=>{
                                                                request.post({
                                                                    headers:{'content-type':'application/json',
                                                                        'x-access-token':token},
                                                                    url:`http://${process.env.HOST}:8083/User/${answer}/push`,
                                                                    body:JSON.stringify({
                                                                        Body: User.username + " has ReOpened the post you answerd on",
                                                                        PostId:question_id
                                                                    })
                                                                },(err,response)=>{
                                                                    if(err) throw err;
                        
                                                                });
                                                                resolve();
                                                            }).then(()=>{});
                                                        }
            
                                                    });
                                                    resolve();
        
                                                }).then(()=>{
                                            
                                                    res.redirect(`/questions/${question_id}`);
                                            
    
                                                });
                                            });
                                    
                                        
                                        });


                                    });
                                }
                            }
                            else{
                                res.send('Invalid Question ID');
                            }
                        });

                    }
                    else{
                        res.send('Invalid User');
                    }

                });
            }

        });


    });

});

module.exports = app;

const express = require('express')
const app = express()
app.use(express.static(__dirname+'/public'))
app.use(express.json())
app.use(express.urlencoded({extended:true}))
const cors = require('cors')
app.use(cors())

const path = require('path')
const swaggerUi = require("swagger-ui-express")
const fs = require('fs')
const jsyaml = require('js-yaml');
const file_path = path.join(__dirname,'..','swagger','answerSwagger.yaml')
const spec = fs.readFileSync(file_path, 'utf8');
const swaggerDocument = jsyaml.load(spec);
app.use(
    '/swgr',
    swaggerUi.serve, 
    swaggerUi.setup(swaggerDocument)
);


const MongoClient = require('mongodb').MongoClient

require('dotenv').config()

const url = 'mongodb+srv://pradyumnakedilaya:secret123%23@cluster0.vlavb.mongodb.net/skillenhancement?retryWrites=true&w=majority'
const db_name = 'skillenhancement'
const col_name_q = 'questionAnswer'
const col_name_u = 'users'

//function to do token verification
const validate_user = require('./authorize')

const request = require('request')

MongoClient.connect(url,(err,db)=>{
    if(err)throw err
    const dbo = db.db(db_name)

    let q_counter;
    let initial_q_counter

    //connecting to globals collection to fetch the next post id
    dbo.collection('globals').find({}).toArray((err,result)=>{
        q_counter = result[0].q_num
        initial_q_counter = q_counter

        //get all answer obects
        app.get('/answers',(req,res)=>{
            dbo.collection(col_name_q).find({'PostTypeId':2}).toArray((err,result)=>{
                if(err) throw err
                res.send(result)
            })
        })
   
        //get a particular answer object using a unique answer id
        app.get('/answers/:answer_id',(req,res)=>{
            const answer_id = parseInt(req.params.answer_id)
            //checking for valid answer ID
            dbo.collection(col_name_q).find({'PostTypeId':2,'Id':answer_id}).toArray((err,result)=>{
                if(err) throw err
                if(result.length == 1){
                    const answer = result[0]
                    dbo.collection(col_name_q).updateOne({'PostTypeId':2,'Id':answer_id},{$inc:{'ViewCount':1}},(err,result)=>{
                        if(err) throw err

                        answer.ViewCount+=1
                        res.send(answer)
                    })
                
                }
                else{
                    res.send('Invalid Answer ID')
                }
            })
        })

        //accepting a particular answer for a specific question i.e. marking it as the most correct answer
        app.post('/answers/:answer_id/accept',(req,res)=>{
            const answer_id = parseInt(req.params.answer_id)
            const token = req.headers['x-access-token']

            //checking logged in or not
            if(token==null){
                res.send('Not Logged In')
            }
            else{
            //checking token existence & verifying it
                dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{
                    if(result.length == 1 && (uv =await validate_user(token,result[0]))){
                    
                        const User = result[0]
                        const ActionUserId = result[0].Id

                        //checking answer existence
                        dbo.collection(col_name_q).find({'PostTypeId':2,'Id':answer_id}).toArray((err,result)=>{
                            if(err) throw err
                            if(result.length == 1){
                                const OwnerUserId = result[0].OwnerUserId
                                const question_id = result[0].ParentId

                                //checking the existence of parent question
                                dbo.collection(col_name_q).find({'PostTypeId':1,'Id':question_id}).toArray((err,result)=>{
                                    if(err) throw err
                                    //only owner of the question is authorised to accept the answer
                                    if(result.length==1 && result[0].OwnerUserId == User.Id){
                                        if(result[0].AcceptedAnswerId!=-1){
                                            res.send('Contains An Already Accepted Answer,Undo that to Accept this one')
                                        }
                                        //checking if question is closed
                                        else if(result[0].ClosedDate==null)
                                        {
                                            dbo.collection(col_name_q).updateOne({'PostTypeId':1,'Id':question_id},{$set:{'AcceptedAnswerId':answer_id}},(err,result)=>{
                                                if(err) throw err

                                                //after updation sending notification to the owner of the answer which got accepted
                                                new Promise((resolve,reject)=>{
                                                    if(ActionUserId != OwnerUserId){
                                                        request.post({
                                                            headers:{'content-type':'application/json',
                                                                'x-access-token':token},
                                                            url:`http://${process.env.HOST}:8083/User/${OwnerUserId}/push`,
                                                            body:JSON.stringify({
                                                                Body: "Congo!!!! "+User.username + " has accepted your answer on this question",
                                                                PostId:answer_id
                                                            })
                                                        },(err,response)=>{
                                                            if(err) throw err
                                                    
                                                        })
                                                    }
                                                    resolve()
                                            
                                                }).then(()=>{
                                                    res.redirect(`/answers/${answer_id}`)
                                                })
                                            })
                                        }
                                        else{
                                            res.send('Question is already Closed')
                                        }
    
    
                                    }
                                    else{
                                        res.send('Invalid Answer ID')        
                                    }
                                })
    
                            }
                            else{
                                res.send('Invalid Answer ID')
                            }
                        })
                    }
                    else{
                        res.send('Invalid User')
                    }
                })
            }
        })

        //api to undo an accepted answer
        app.post('/answers/:answer_id/accept/undo',(req,res)=>{
            const answer_id = parseInt(req.params.answer_id)
            const token = req.headers['x-access-token']

            //login check
            if(token==null){
                res.send('Not Logged In')
            }
            else{
            //token check & verification
                dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{
                    if(result.length == 1 && (uv =await validate_user(token,result[0]))){
                    
                        const User = result[0]
                        //checking if the answer object exists
                        dbo.collection(col_name_q).find({'PostTypeId':2,'Id':answer_id}).toArray((err,result)=>{
                            if(err) throw err
                            if(result.length == 1){
                        
                                const question_id = result[0].ParentId
                                //checking if the parent question exists
                                dbo.collection(col_name_q).find({'PostTypeId':1,'Id':question_id}).toArray((err,result)=>{
                                    if(err) throw err
                            
                                    //only owner of parent question can undo an accept 
                                    if(result.length==1 && User.Id == result[0].OwnerUserId){
                                        //closed question cant undo an accept
                                        if(result[0].ClosedDate!=null)
                                            res.send('Question is in Closed State')
                                        //checks if there is even an accepted answer or not
                                        else if(result[0].AcceptedAnswerId==-1){
                                            res.send('Contains No Accepted Answer')
                                        }
                                        //checks if this answer is accepte done
                                        else if(result[0].AcceptedAnswerId==answer_id)
                                        {
                                            dbo.collection(col_name_q).updateOne({'PostTypeId':1,'Id':question_id},{$set:{'AcceptedAnswerId':-1}},(err,result)=>{
                                                if(err) throw err
                                                res.redirect(`/answers/${answer_id}`)
                                            })
                                        }
                                        else
                                            res.send('This is not an accepted answer')
                                    }
                                    else{
                                        res.send('Invalid Question ID')        
                                    }
                                })
    
                            }
                            else{
                                res.send('Invalid Answer ID')
                            }
                        })
                    }
                    else{
                        res.send('Invalid User')
                    }
                })
            }

        })
  
        //api to delete an answer
        app.post('/answers/:answer_id/delete',(req,res)=>{
            const answer_id = parseInt(req.params.answer_id)
            const token = req.headers['x-access-token']

            //login check
            if(token==null){
                res.send('Not Logged In')
            }
            else{
                dbo.collection(col_name_u).find({'token':token}).toArray(async (err,result)=>{

                    //token check & verification
                    if(result.length == 1 && (uv =await validate_user(token,result[0]))){
                    
                        const User = result[0]

                        //answer object existence check
                        dbo.collection(col_name_q).find({'PostTypeId':2,'Id':answer_id}).toArray((err,result)=>{
                            if(err) throw err
                            if(result.length == 1 && result[0].OwnerUserId == User.Id){

                                //parent question object existence check
                                dbo.collection(col_name_q).find({'Id':result[0].ParentId}).toArray((err,result)=>{
                                    if(result.length == 1){
                                        const question_id = result[0].Id

                                        //accepted answer cant be deleted
                                        if(result[0].AcceptedAnswerId == answer_id){
                                            res.send('Cant Delete an Accepted Answer')
                                        }
                                        else{
                                            dbo.collection(col_name_q).deleteOne({'PostTypeId':2,'Id':answer_id},(err,result)=>{
                                                if(err) throw err
                                                res.redirect(`http://${process.env.HOST}:8089/questions/${question_id}`)
                                            })
                                        }
                                    }   
                                    else{
                                        res.send('Invalid Question ID')         
                                    } 
                                })
                            }
                            else{
                                res.send('Invalid Answer ID')
                            }
                        })
                    }
                    else{
                        res.send('Invalid User')
                    }
                })
            }
        })

        //api to edit an answer object ,calls the question edit api as the schema & process are similar
        app.post('/answers/:answer_id/edit',(req,res)=>{
            const answer_id = parseInt(req.params.answer_id)
            const token = req.headers['x-access-token']

            request.post({
                headers:{
                    'content-type':'application/json',
                    'x-access-token':token
                },
                url:`http://${process.env.HOST}:8089/questions/${answer_id}/edit`,
                body : JSON.stringify(req.body)
            },(err,response)=>{
                if(err)
                    throw err
                if(response.body=='Success'){
                    res.redirect(`/answers/${answer_id}`)
                }
                else
                    res.send(response.body)
            })
        
        })

        //api to vote up or down a answer ,calls the question vote api as the schema & process are same
        app.get('/answers/:answer_id/:vote',(req,res)=>{
            const answer_id = parseInt(req.params.answer_id)
            const vote = req.params.vote
            const token = req.headers['x-access-token']

            request.get({
                headers:{
                    'content-type':'application/json',
                    'x-access-token':token
                },
                url:`http://${process.env.HOST}:8089/questions/${answer_id}/${vote}`,
            },(err,response)=>{
                if(err)
                    throw err
                if(response.body=='Success'){
                    res.redirect(`/answers/${answer_id}`)
                }
                else
                    res.send(response.body)
            })
        
        })

    })

})

module.exports = app

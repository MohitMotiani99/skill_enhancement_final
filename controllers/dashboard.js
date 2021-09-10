/* eslint-disable array-callback-return */
/* eslint-disable no-var */
const MongoClient=require('mongodb').MongoClient
const express=require('express')
const request = require('request')
const app = express()
const bodyparser = require("body-parser")
var cors=require ('cors')
const url="mongodb+srv://pradyumnakedilaya:secret123%23@cluster0.vlavb.mongodb.net/skillenhancement?retryWrites=true&w=majority"
var cors = require('cors')
const mydb="skillenhancement"
const collection="questionAnswer"
const collection2="users"
const collection3="comments"
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))
app.use(cors())
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

const path = require('path')
const swaggerUi = require("swagger-ui-express")
const fs = require('fs')
const jsyaml = require('js-yaml');
const file_path = path.join(__dirname,'..','swagger','dashboardSwagger.yaml')
const spec = fs.readFileSync(file_path, 'utf8');
swaggerDocument = jsyaml.load(spec);
app.use(
    '/swgr',
    swaggerUi.serve, 
    swaggerUi.setup(swaggerDocument)
);

MongoClient.connect(url,function(err,db){
    if(err)
        throw err
    dbo=db.db(mydb)
    //console.log('sep Database Connected')
    
    app.post('/login',(req,res)=>{

    })
    app.post('/register',(req,res)=>{

    })

    //Returns all questions and answers from database
    app.post('/mainpage2',(req,res)=>{
        dbo.collection(collection).find({'PostTypeId':1}).toArray((err,result)=>{
            const ans = {
                'questions':result
            }
            dbo.collection(collection).find({'PostTypeId':2}).toArray((err,result)=>{
                ans.answers = result
                res.send(ans)
            })        
        })
    })

    //Return relevent questions and answers - Approach1
    app.post('/searchstring',(req,res)=>{
        const search_string = req.body.search_string.toLowerCase()
        //console.log(search_string)
        const search_words = new Set(search_string.split(' '))
        const promise = Promise.resolve()
        const stop_words = ["i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"]

        new Promise((resolve,reject)=>{
            stop_words.forEach(sw=>search_words.delete(sw))
            //console.log('set is ')
            //console.log(search_words)
            if(search_words.size==0)
                res.send('No Context in the Search Phrase')
            else
                resolve()
        }).then(()=>{
            const q_set = new Set()
            const a_set = new Set()
            request.get({
                headers:{'content-type':'application/json'},
                url:'http://localhost:8089/questions'
            },(err,response,body)=>{
                if(err) throw err
                new Promise((resolve,reject)=>{
                    search_words.forEach(word => {
                        //console.log(word)
                        JSON.parse(body).filter((question) => {return (question.Title.toLowerCase().indexOf(word) >= 0 || question.Body.toLowerCase().indexOf(word) >= 0)}).map((question) => {q_set.add(JSON.stringify(question))})
                    })
                    resolve()
                }).then(()=>{
                    //console.log(q_set)
  
                    new Promise((resolve,reject)=>{
                        request.get({
                            headers:{'content-type':'application/json'},
                            url:'http://localhost:8088/answers'
                        },(err,response,body)=>{
                            if(err) throw err                   
                            search_words.forEach(word=>{
                                JSON.parse(body).filter((answer)=>{return answer.Body.indexOf(word)>=0}).map((answer)=>a_set.add(JSON.stringify(answer)))
                            })                  
                            resolve()                          
                        })
                
                    }).then(()=>{
                        //console.log(a_set)
  
                        const ans ={
                            'questions':Array.from(q_set).map((question)=>JSON.parse(question)).sort((q1,q2)=>q2.ViewCount-q1.ViewCount),
                            'answers':Array.from(a_set).map((answer)=>JSON.parse(answer)).sort((a1,a2)=>a2.ViewCount-a1.ViewCount)
                        }
                        //console.log(ans)
                        res.send(ans)
                    }) 
                })
            })
        })      
    })

    //Returns questions and answers relevent to search sentence. (MongodB Text search)
    app.post('/searchposts',(req,res)=>{
        const search_string = req.body.search_string
        new Promise((resolve,reject)=>{
            dbo.collection(collection).createIndex({'Title':'text','Body':'text'},(err,result)=>{
                //console.log(result)
                resolve()
            })  
        }).then(()=>{
            dbo.collection(collection).find({$text:{$search:search_string}}).toArray((err,result)=>{
                if(err) throw err
                //console.log(result)
                const ans={
                    'questions':[],
                    'answers':[]
                }
                new Promise((resolve,reject)=>{
                    result.forEach((p)=>{
                        if(p.PostTypeId==1)
                            ans.questions.push(p)
                        else
                            ans.answers.push(p)
                    })
                    resolve()
                }).then(()=>{
                    res.send(ans)
                })
          
            })
        })
      
    })

    //Returns suggested questions based on the content viewed by user
    app.post('/suggested',(req,res)=>{
        const data = req.body 
        request.post({
            headers:{'content-type':'application/json'},
            url:'http://localhost:3300/searchposts',
            body:JSON.stringify({
                'search_string':data.Title+" "+data.Body
            })},(err,response)=>{
            if(err) throw err
            // console.log(response.body)
            // console.log(typeof response.body)
            res.send(JSON.parse(response.body).questions)
        })
    })

    //Returns all questions which match the input tag
    app.post('/searchTags',(req,res)=>{
        const data = req.body
        const q_set = new Set()
        new Promise((resolve,reject)=>{
            const Tags = data.Tags
            resolve()
        }).then(()=>{
            request.get({
                headers:{'content-type':'application/json'},
                url:'http://localhost:8089/questions'
            },(err,response,body)=>{
                if(err) throw err
                new Promise((resolve,reject)=>{
                    data.Tags.forEach(word => {
                        // console.log(word)
                        JSON.parse(body).filter((question) => {return question.Tags.indexOf(word.toLowerCase())>-1}).map((question) => {q_set.add(JSON.stringify(question))})
                    })
                    resolve()
                }).then(()=>{
                    // console.log(q_set)
  
                    const ans ={
                        'questions':Array.from(q_set).map((question)=>JSON.parse(question)).sort((q1,q2)=>q2.ViewCount-q1.ViewCount),
                    }
                    // console.log(ans)
                    res.send(ans)

                })
            })
        })

    })

    /*SORT API  
    Sort based on parameters:
      ->Score
      ->ViewCount
      ->CreationDate
      ->ClosedDate etc
    Can sort questions, answers
    Can be sorted in ascending/descending order    
    */
    app.get('/:posts/sort/:base/:type',(req,res)=>{
        const type = req.params.type
        const base = req.params.base
        const posts = req.params.posts
        let host_url;
        if(posts == 'questions')
            host_url='http://localhost:8089/questions'
        else if(posts == 'answers')
            host_url='http://localhost:8088/answers'
        request.get({
            headers:{'content-type':'apllication/json'},
            url:host_url
        },(err,response,body)=>{
            const questions = JSON.parse(body)
            if(err) throw err
            new Promise((resolve,reject)=>{
                if(type == 'desc')
                    questions.sort((q1,q2)=>q2[base] - q1[base])
                else if(type == 'asc')
                    questions.sort((q1,q2)=>q1[base] - q2[base])

                // console.log(questions)
          
                resolve()
            }).then(()=>{
                res.send(questions)
            })
        })
    })

    //Returns all trending questions sorted in descending order based on ViewCount
    app.get('/trending',(req,res)=>{
        request.get({
            headers:{'content-type':'application/json'},
            url:'http://localhost:3300/questions/sort/Score/desc'
        },(err,response,body)=>{
            res.send(JSON.parse(body))
        })
    })

    //Return user details for all the users with the given search name
    app.post('/searchcusts',(req,res)=>{
        const search_name = req.body.search_name.toLowerCase()
        const ans =[]
        dbo.collection(collection2).find({}).toArray((err,result)=>{
            res.send(result.filter((u)=>{
                return u.username.toLowerCase().indexOf(search_name)>=0}))
        })
    })   
})

module.exports = app
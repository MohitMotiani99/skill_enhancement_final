var MongoClient=require('mongodb').MongoClient
var express=require('express')
var request = require('request')
var app = express()
var bodyparser = require("body-parser")
//var url="mongodb://127.0.0.1:27017/";
var url="mongodb+srv://pradyumnakedilaya:secret123%23@cluster0.vlavb.mongodb.net/skillenhancement?retryWrites=true&w=majority"
//var mydb="SkillEnhancementPortal"
var mydb="skillenhancement"
//var collection="question"
var collection="questionAnswer"
var collection2="user"
var collection3="comments"
var username=""
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))

MongoClient.connect(url,function(err,db){
    if(err)
      throw err
    dbo=db.db(mydb)
    console.log(dbo)

    app.post("/signin",(req,res)=>{
      res.redirect("mainpage.html")
    })

    app.post("/mainpage",(req,res)=>{
      /*dbo.collection(collection).find({}).toArray(function(arr,result){
          console.log(typeof(result))

          var question=[]
          var message=[]
          var votes=[]
          var questiondetails=[]
          var count=0
          for (i=0;i<result.length;i++)
          {
            if (result[i].PostTypeId==1)
            {
              count=count+1
              question.push(result[i].Title)
              message.push(result[i].Body)
              votes.push(result[i].Score)
            }
          }
          for (i=0;i<count;i++)
          {
            var qa={}
            qa["question"]=question[i]
            qa["message"]=message[i]
            qa["votes"]=votes[i]
            questiondetails.push(qa)
          }
          res.send(questiondetails)
          //res.send(JSON.stringify(result))
      })*/
      dbo.collection(collection).find({}).toArray(function(arr,result){
        res.send(JSON.stringify(result))
     })
    })

    app.post("/searchuser",(req,res)=>{
      var name=(req.body.searchname).split(":")[1]
      console.log(name)
      var users=[]    //holds id of user's name
      var searchuser=[]
      var question=[]
      var answer=[]
      dbo.collection(collection2).find({username:name}).toArray(function(arr,result){
        //console.log(result)
        for (i=0;i<result.length;i++)
        {
            users.push(result[i].Id)
            searchuser.push(result[i])
        }
        //console.log(users) 
        //console.log(searchuser)       
      })
      dbo.collection(collection).find({}).toArray(function(arr,result){
        for (i=0;i<users.length;i++)
        {
          questions_count=0
          answer_count=0
          for (j=0;j<result.length;j++)
          {
            if (users[i]==result[j].OwnerUserId)
            {
               if (result[j].PostTypeId==1)
               {
                 questions_count=questions_count+1
                 //question[i]=result[j].Title
               }
               if (result[j].PostTypeId==2)
               {
                 answer_count=answer_count+1
                 //answer.push(result[j].Body)
               }
            }
          }
          //searchuser[i].push(questions_count,answer_count)
          searchuser[i]["question_count"]=questions_count
          searchuser[i]["answer_count"]=answer_count
          //console.log(searchuser)
        }
        res.send(searchuser)
    })      
    })

    app.post("/searchquestion",(req,res)=>{
      var search=[]
      var par_id=[]
      var q=[]
      var a=[]
      var votes=[]
      var comments=[]
      var allanswer=[]
      var answer=[]
      var p=-1
      var question = req.body.question
      reg = /a|about|above|after|again|against|all|am|an|and|any|are|as|at|be|because|been|before|being|below|between|both|but|by|cant|cannot|could|couldnt|did|do|does|doing|down|during|each|few|for|from|further|had|has|have|having|he|her|here|hers|herself|him|himself|his|how|i|if|in|into|is|it|its|itself|me|more|most|my|myself|no|nor|not|of|off|on|once|only|or|other|ought|our|ours|ourselves|out|over|own|same|she|should|so|some|such|than|that|the|their|theirs|them|themselves|then|there|these|they|this|those|through|to|too|under|until|up|very|was|were|what|when|where|which|while|who|whom|why|with|would|you|your|yours|yourself|yourselves|aren't|can't|couldn't|didn't|doesn't|don't|hadn't|hasn't|haven't|he'd|he'll|he's|here's|how's|i'd|i'll|i'm|i've|isn't|it's|let's|shan't|she'd|she'll|she's|shouldn't|that's|there's|they'd|they'll|they're|they've|wasn't|we'd|we'll|we're|we've|weren't|what's|when's|where's|who's|why's|won't|wouldn't|you'd|you'll|you're|you've/i;
      /*question.replace("of","")
      question.replace("the","")
      question.replace("is","")*/
      question.replace(reg,"")
      question1=question.split(" ")
      console.log(question1)
      dbo.collection(collection).find({}).toArray(function(arr,result){  
        console.log(result)      
        for (i=0;i<question1.length;i++)
        {
          for (j=0;j<result.length;j++)
          {
            //console.log("Begin")
            //console.log("Next j="+j)
            if (result[j].PostTypeId==1)
            {
              //console.log("Id="+result[j].PostTypeId)
              //console.log(typeOf(result[j].PostTypeId))
              //console.log(result)
              //console.log(result[j])
              //console.log((result[j].Title).indexOf(question[i]))
              //console.log((result[j].Body).indexOf(question[i]))
              //console.log((par_id.indexOf(result[j].Id))==-1)
              if (((((result[j].Title).indexOf(question1[i]))>-1)||(((result[j].Body).indexOf(question1[i]))>-1))&&((par_id.indexOf(result[j].Id))==-1))
              {
                //console.log("second j="+j)
                
                p=p+1
                par_id.push(result[j].Id)
                //console.log("ID="+par_id)
                q.push({"Title":result[j].Title,"Body":result[j].Body})
                votes.push(result[j].Score)
                console.log("QUESTIONS")
                console.log(q)
                console.log("VOTES")
                console.log(votes)      
              }
            }
            //console.log("Questions and Votes over") 
          }      
        }
        //console.log("Answer begin")
        console.log(q)
        /*for (i=0;i<=p;i++)
        {
           console.log(par_id[i])
        }*/

        for (x=0;x<=p;x++)    //Answer array
        {
          var answer=[]
          for (i=0;i<result.length;i++)
          {
            if ((result[i].PostTypeId==2) && (par_id[x]==result[i].ParentId))
            {
              answer.push(result[i].Body)
            }
          }
          allanswer.push(answer)
          console.log(allanswer)
        } 
        //console.log(search)
        dbo.collection(collection3).find({}).toArray(function(arr,result){  //Comments
          
          //console.log("Comments start")
          //console.log(result)
          for (x=0;x<=p;x++)
          {
            var c=[]
            for (i=0;i<result.length;i++)
            {
              if (par_id[x]==result[i].PostId)
              {
                c.push(result[i].Text)
              }              
            }
            comments.push(c)
          }
          
          //Combining questions, comments, votes and answer
          for (n=0;n<=p;n++)
          {
            var s={}
            s["question"]=q[n].Title
            s["body"]=q[n].Body
            s["answer"]=allanswer[n]
            s["votes"]=votes[n]
            s["comments"]=comments[n]
            //console.log(s)
            search.push(s)
          }        
        res.send(search)
        })
    })
   
    })
   
})
var server = app.listen(8087,function(){
    console.log("server started")
})
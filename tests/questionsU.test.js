const app = require('../controllers/questions')
const supertest = require('supertest')
var MongoClient = require('mongodb').MongoClient


var url = 'mongodb+srv://pradyumnakedilaya:secret123%23@cluster0.vlavb.mongodb.net/skillenhancement?retryWrites=true&w=majority'
var db_name = 'skillenhancement'
var col_name_q = 'questionAnswer'
var col_name_u = 'users'


let connection;
let dbo;

function compare(recieved,expected){
    expect(recieved.Id).toBe(expected.Id)
    expect(recieved.AcceptedAnswerId).toBe(expected.AcceptedAnswerId)
    expect(recieved.PostTypeId).toBe(expected.PostTypeId)
    expect(recieved.CreationDate).toBe(expected.CreationDate)
    expect(recieved.Score).toBe(expected.Score)
    expect(recieved.OwnerUserId).toBe(expected.OwnerUserId)
    expect(recieved.Title).toBe(expected.Title)
    expect(recieved.Body).toBe(expected.Body)
    expect(recieved.Tags).toEqual(expected.Tags)
    expect(recieved.ClosedDate).toBe(expected.ClosedDate)
}

beforeAll(async ()=>{
    connection = await MongoClient.connect(url,{
        useNewUrlParser: true,
        useUnifiedTopology: true
  
    })
    dbo = await connection.db(db_name)
})

afterAll(async ()=>{
         await connection.close()
})

beforeEach(async ()=>{
    //console.log('before each')
    await dbo.collection(col_name_q).insertOne({
        "Id": 9999,
        "PostTypeId": 1,
        "AcceptedAnswerId": -1,
        "CreationDate": 1629953505529,
        "Score": 15,
        "ViewCount": 186,
        "OwnerUserId": 901,
        "Title": "testing api for edit question again after reopening edittes",
        "Body": "api seems to work fine reopen",
        "Tags": [
            "java",
            "mongo",
            "python"
        ],
        "ClosedDate": null
    })
    await dbo.collection(col_name_u).insertMany([{
        'Id':901,
        'token':'t1',
        'username':'tester'
    },
    {
        'Id':902,
        'token':'t2',
        'username':'tester'
    },])
})
afterEach(async ()=>{
    await dbo.collection(col_name_q).deleteOne({'Id':9999,'PostTypeId':1})
    await dbo.collection(col_name_u).deleteMany({'username':'tester'})
})


/**
 * 
 * EDIT QUESTION
 * 
 */

test('POST /questions/:question_id/edit NOT LOGGED IN', async () => {
    var question={
        'Body':'Jest Testing Edit v1.3'
    }
    var question_id = 9999
    await supertest(app)
        .post(`/questions/${question_id}/edit`)
        .set({'content-type':'application/json'})
        .send(question)
        .expect(200)
        .then(async (res)=>{
            expect(res.text).toBe('Not Logged In')
        })

})
test('POST /questions/:question_id/edit INVALID TOKEN', async () => {
    var question={
        'Body':'Jest Testing Edit v1.3'
    }
    var question_id = 9999
    await supertest(app)
        .post(`/questions/${question_id}/edit`)
        .set({'content-type':'application/json'})
        .set({'x-access-token':'nottoken'})
        .send(question)
        .expect(200)
        .then(async (res)=>{
            expect(res.text).toBe('Invalid User')
        })

})
test('POST /questions/:question_id/edit OWNER USER', async () => {
    var question={
        'Body':'Jest Testing Edit v1.3'
    }
    var question_id = 9999
    await supertest(app)
        .post(`/questions/${question_id}/edit`)
        .set({'content-type':'application/json'})
        .set({'x-access-token':'t2'})
        .send(question)
        .expect(200)
        .then(async (res)=>{
            expect(res.text).toBe('Invalid Post ID')
        })

})
test('POST /questions/:question_id/edit INVALID QUESTION', async () => {
    var question={
        'Body':'Jest Testing Edit v1.2'
    }
    var question_id = 9999000
    await supertest(app)
        .post(`/questions/${question_id}/edit`)
        .set({'content-type':'application/json'})
        .set({'x-access-token':'t1'})
        .send(question)
        .expect(200)
        .then(async (res)=>{
            expect(res.text).toBe('Invalid Post ID')
        })

})

describe('Closed Question For Edit',() =>{
    beforeEach(async () =>{
        await dbo.collection(col_name_q).updateOne({'Id':9999,'PostTypeId':1},{$set:{'ClosedDate':Date.now()}})
    })
    test('POST /questions/:question_id/edit CLOSED QUESTION', async () => {
        var question={
            'Body':'Jest Testing Edit v1.3'
        }
        var question_id = 9999
        await supertest(app)
            .post(`/questions/${question_id}/edit`)
            .set({'content-type':'application/json'})
            .set({'x-access-token':'t1'})
            .send(question)
            .expect(200)
            .then(async (res)=>{
                // console.log(res.text)
                // console.log(res.headers)
                expect(res.text).toBe('Question is Closed')
            })
    
    })
})


test('POST /questions/:question_id/edit', async () => {
    var question={
        'Body':'Jest Testing Edit v1.3'
    }
    var question_id = 9999
    await supertest(app)
        .post(`/questions/${question_id}/edit`)
        .set({'content-type':'application/json'})
        .set({'x-access-token':'t1'})
        .send(question)
        .expect(302)
        .then(async (res)=>{

            //console.log(res)
            // console.log(res.text)
            // console.log(res.headers)
            // console.log(res.body)
            expect(res.headers.location).toBe(`/questions/${question_id}`)
            var recieved = await dbo.collection(col_name_q).find({'Id':9999,'PostTypeId':1}).toArray()
            recieved = recieved[0]

            expect(recieved.AcceptedAnswerId).toStrictEqual(-1)
            expect(recieved.PostTypeId).toStrictEqual(1)
            expect(recieved.OwnerUserId).toStrictEqual(901)
            expect(recieved.Body).toBe(question.Body)
            expect(recieved.ClosedDate).toBe(null)


        })

})

/**
 * 
 * CLOSE QUESTION 
 * 
 */
test('POST /questions/:question_id/close NOT LOGGED IN',async () => {
    var question_id = 9999
    await supertest(app)
        .post(`/questions/${question_id}/close`)
        .set({'content-type':'application/json'})
        .expect(200)
        .then(async (res)=>{
            expect(res.text).toBe('Not Logged In')
        })
})
test('POST /questions/:question_id/close INVALID QUESTION',async () => {
    var question_id = 9999000
    await supertest(app)
        .post(`/questions/${question_id}/close`)
        .set({'content-type':'application/json'})
        .set({'x-access-token':'t1'})
        .expect(200)
        .then(async (res)=>{
            expect(res.text).toBe('Invalid Question ID')
        })
})
test('POST /questions/:question_id/close NOT OWNER',async () => {
    var question_id = 9999
    await supertest(app)
        .post(`/questions/${question_id}/close`)
        .set({'content-type':'application/json'})
        .set({'x-access-token':'t2'})
        .expect(200)
        .then(async (res)=>{
            expect(res.text).toBe('Invalid Question ID')
        })
})
test('POST /questions/:question_id/close',async () => {
    var question_id = 9999
    await supertest(app)
        .post(`/questions/${question_id}/close`)
        .set({'content-type':'application/json'})
        .set({'x-access-token':'t1'})
        .expect(302)
        .then(async (res)=>{
            var recieved = await dbo.collection(col_name_q).find({'Id':question_id,'PostTypeId':1}).toArray()
            recieved = recieved[0]
            expect(recieved.ClosedDate).not.toBe(null)
            expect(res.headers.location).toBe(`/questions/${question_id}`)
        })
})
describe('Close Closed QUestion' ,()=>{
    beforeEach(async ()=>{
        await dbo.collection(col_name_q).updateOne({'Id':9999,'PostTypeId':1},{$set:{'ClosedDate':Date.now()}})
    })
    test('POST /questions/:question_id/close CLOSED',async () => {
        var question_id = 9999
        await supertest(app)
            .post(`/questions/${question_id}/close`)
            .set({'content-type':'application/json'})
            .set({'x-access-token':'t1'})
            .expect(200)
            .then(async (res)=>{
                expect(res.text).toBe('Already in Closed State')
            })
    })
    

})


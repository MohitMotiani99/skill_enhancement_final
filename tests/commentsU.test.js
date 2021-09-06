const app = require('../controllers/comments')
const supertest = require('supertest')

var MongoClient = require('mongodb').MongoClient


var url = 'mongodb+srv://pradyumnakedilaya:secret123%23@cluster0.vlavb.mongodb.net/skillenhancement?retryWrites=true&w=majority'
var db_name = 'skillenhancement'
var col_name_q = 'questionAnswer'
var col_name_u = 'users'
var col_name_n = 'notifications'
var col_name_c="comments"

function compare(recieved,expected){
    expect(recieved.Id).toBe(expected.Id)
    expect(recieved.CreationDate).toBe(expected.CreationDate)
    expect(recieved.Score).toBe(expected.Score)
    expect(recieved.Text).toBe(expected.Text)
    expect(recieved.PostId).toBe(expected.PostId)
    expect(recieved.UserDisplayName).toBe(expected.UserDisplayName)
    expect(recieved.UserId).toBe(expected.UserId)
}

let connection;
let dbo;

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
    await dbo.collection(col_name_q).insertOne({
        "Id": 9998,
        "PostTypeId": 2,
        "CreationDate": Date.now(),
        "ParentId":9999,
        "Score": 12,
        "ViewCount": 100,
        "OwnerUserId": 902,
        "Body": "Answer Tests v1.0",
    })
    await dbo.collection(col_name_q).insertOne({
        "Id": 9999,
        "PostTypeId": 1,
        "AcceptedAnswerId": -1,
        "CreationDate": Date.now(),
        "Score": 15,
        "ViewCount": 186,
        "OwnerUserId": 901,
        "Title": "Answer Testing Question v2.0",
        "Body": "Tester Body",
        "Tags": [
            "jest"
        ],
        "ClosedDate": null
    })
    await dbo.collection(col_name_u).insertMany([{
        'Id':901,
        'token':'t1',
        'username':'tester',
        'displayName':'Mytester'
    },
    {
        'Id':902,
        'token':'t2',
        'username':'tester',
        'displayName':'Mytester'
    },])
    await dbo.collection(col_name_c).insertOne({
        'Id':9997,
        'PostId':9999,
        'Score':0,
        'Text':'Comment Testing Text v1.0',
        'CreationDate':Date.now(),
        'UserDisplayName':'tester',
        'UserId':901
    })
})
afterEach(async ()=>{
    await dbo.collection(col_name_q).deleteOne({'Id':9998,'PostTypeId':2})
    await dbo.collection(col_name_q).deleteOne({'Id':9999,'PostTypeId':1})
    await dbo.collection(col_name_u).deleteMany({'username':'tester'})
    await dbo.collection(col_name_n).deleteMany({'UserId':901})
    await dbo.collection(col_name_n).deleteMany({'UserId':902})
    await dbo.collection(col_name_c).deleteMany({'PostId':9999})
    await dbo.collection(col_name_c).deleteMany({'PostId':9998})
    await dbo.collection('votes').deleteMany({'UserId':901})
    await dbo.collection('votes').deleteMany({'UserId':902})
})

test('PATCH /comments/:id/upvote NOT LOGGED IN',async ()=>{
    var id = 9997
    await supertest(app)
    .patch(`/comments/${id}/upvote`)
    .expect(200)
    .then(async (res)=>{
        expect(res.text).toBe('Not Logged In')
    })
})
test('PATCH /comments/:id/upvote INVALID TOKEN',async ()=>{
    var id = 9997
    await supertest(app)
    .patch(`/comments/${id}/upvote`)
    .set({'x-access-token':'nottoken'})
    .expect(200)
    .then(async (res)=>{
        expect(res.text).toBe('Invalid User')
    })
})
test('PATCH /comments/:id/upvote INVALID COMMENT',async ()=>{
    var id = 9997000
    await supertest(app)
    .patch(`/comments/${id}/upvote`)
    .set({'x-access-token':'t2'})
    .expect(200)
    .then(async (res)=>{
        expect(res.text).toBe('Invalid Comment Id')
    })
})
test('PATCH /comments/:id/upvote UPVOTE',async ()=>{

    var id = 9997

    let query_res = await dbo.collection(col_name_c).find({'Id':id}).toArray()
    let preAPI = query_res[0]

    await supertest(app)
    .patch(`/comments/${id}/upvote`)
    .set({'x-access-token':'t2'})
    .expect(302)
    .then(async (res)=>{
        expect(res.headers.location).toBe(`/comments/${id}`)
        query_res = await dbo.collection(col_name_c).find({'Id':id}).toArray()
        let postAPI = query_res[0]
        preAPI['Score']+=1
        compare(preAPI,postAPI)
    })
})
test('PATCH /comments/:id/downvote/undo DOWNVOTE UNDO',async ()=>{

    var id = 9997

    let query_res = await dbo.collection(col_name_c).find({'Id':id}).toArray()
    let preAPI = query_res[0]

    await supertest(app)
    .patch(`/comments/${id}/downvote/undo`)
    .set({'x-access-token':'t2'})
    .expect(302)
    .then(async (res)=>{
        expect(res.headers.location).toBe(`/comments/${id}`)
        query_res = await dbo.collection(col_name_c).find({'Id':id}).toArray()
        let postAPI = query_res[0]
        preAPI['Score']+=1
        compare(preAPI,postAPI)
    })
})
test('PATCH /comments/:id/upvote DOWNVOTE',async ()=>{

    var id = 9997

    let query_res = await dbo.collection(col_name_c).find({'Id':id}).toArray()
    let preAPI = query_res[0]

    await supertest(app)
    .patch(`/comments/${id}/downvote`)
    .set({'x-access-token':'t2'})
    .expect(302)
    .then(async (res)=>{
        expect(res.headers.location).toBe(`/comments/${id}`)
        query_res = await dbo.collection(col_name_c).find({'Id':id}).toArray()
        let postAPI = query_res[0]
        preAPI['Score']-=1
        compare(preAPI,postAPI)
    })
})
test('PATCH /comments/:id/downvote/undo UPVOTE UNDO',async ()=>{

    var id = 9997

    let query_res = await dbo.collection(col_name_c).find({'Id':id}).toArray()
    let preAPI = query_res[0]

    await supertest(app)
    .patch(`/comments/${id}/upvote/undo`)
    .set({'x-access-token':'t2'})
    .expect(302)
    .then(async (res)=>{
        expect(res.headers.location).toBe(`/comments/${id}`)
        query_res = await dbo.collection(col_name_c).find({'Id':id}).toArray()
        let postAPI = query_res[0]
        preAPI['Score']-=1
        compare(preAPI,postAPI)
    })
})
/**
 * 
 * EDIT ANSWER
 * 
 */
test('POST /comments/:id/edit NOT LOGGED IN', async () => {
    var comment={
        'body':'Jest Testing Edit v1.4'
    }
    var id = 9997
    await supertest(app)
        .patch(`/comments/${id}/edit`)
        .set({'content-type':'application/json'})
        .send(comment)
        .expect(200)
        .then(async (res)=>{
            expect(res.text).toBe('Not Logged In')
        })

})
test('POST /comments/:id/edit INVALID TOKEN', async () => {
    var comment={
        'body':'Jest Testing Edit v1.4'
    }
    var id = 9997
    await supertest(app)
        .patch(`/comments/${id}/edit`)
        .set({'content-type':'application/json'})
        .set({'x-access-token':'nottoken'})
        .send(comment)
        .expect(200)
        .then(async (res)=>{
            expect(res.text).toBe('Invalid User')
        })

})
test('POST /comments/:id/edit OWNER USER', async () => {
    var comment={
        'body':'Jest Testing Edit v1.4'
    }
    var id = 9997
    await supertest(app)
        .patch(`/comments/${id}/edit`)
        .set({'content-type':'application/json'})
        .set({'x-access-token':'t2'})
        .send(comment)
        .expect(200)
        .then(async (res)=>{
            expect(res.text).toBe('No access to edit the comment')
        })

})
test('POST /comments/:id/edit INVALID COMMENT', async () => {
    var comment={
        'body':'Jest Testing Edit v1.2'
    }
    var id = 9997000
    await supertest(app)
        .patch(`/comments/${id}/edit`)
        .set({'content-type':'application/json'})
        .set({'x-access-token':'t1'})
        .send(comment)
        .expect(200)
        .then(async (res)=>{
            expect(res.text).toBe('No access to edit the comment')
        })

})
describe('Closed Parent Post',()=>{
    beforeEach(async ()=>{
        await dbo.collection(col_name_q).updateOne({'Id':9999,'PostTypeId':1},{$set:{'ClosedDate':Date.now()}})
    })
    test('POST /comments/:id/edit CLOSED PARENT POST', async () => {
        var comment={
            'body':'Jest Testing Edit v1.2'
        }
        var id = 9997
        await supertest(app)
            .patch(`/comments/${id}/edit`)
            .set({'content-type':'application/json'})
            .set({'x-access-token':'t1'})
            .send(comment)
            .expect(200)
            .then(async (res)=>{
                expect(res.text).toBe('Post is Already Closed')
            })
    
    })  
})
test('POST /comments/:id/edit', async () => {
    var comment={
        'body':'Jest Testing Edit for Comments v1.4'
    }
    var id = 9997
    await supertest(app)
        .patch(`/comments/${id}/edit`)
        .set({'content-type':'application/json'})
        .set({'x-access-token':'t1'})
        .send(comment)
        .expect(302)
        .then(async (res)=>{

            expect(res.headers.location).toBe('/question/9999/comments')
            var recieved = await dbo.collection(col_name_c).find({'Id':9997}).toArray()
            recieved = recieved[0]

            expect(recieved.Text).toBe(comment.body)


        })

})

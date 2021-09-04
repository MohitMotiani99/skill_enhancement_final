// const app = require('../controllers/users')
// const supertest = require('supertest')
// var MongoClient = require('mongodb').MongoClient


// var url = 'mongodb+srv://pradyumnakedilaya:secret123%23@cluster0.vlavb.mongodb.net/skillenhancement?retryWrites=true&w=majority'
// var db_name = 'skillenhancement'
// var col_name_q = 'questionAnswer'
// var col_name_u = 'users'
// var col_name_n = 'notifications'


// let connection;
// let dbo;

// function compare(recieved,expected){
//     expect(recieved.Id).toBe(expected.Id)
//     expect(recieved.gender).toBe(expected.gender)
//     expect(recieved.grade).toBe(expected.grade)
//     expect(recieved.SocialLink).toBe(expected.SocialLink)
//     expect(recieved.username).toBe(expected.username)
//     expect(recieved.displayName).toBe(expected.displayName)
//     expect(recieved.firstName).toBe(expected.firstName)
//     expect(recieved.lastName).toBe(expected.lastName)
//     expect(recieved.image).toBe(expected.image)
//     expect(recieved.token).toBe(expected.token)
//     expect(recieved.lastLogin).toBe(expected.lastLogin)
// }

// beforeAll(async ()=>{
//     connection = await MongoClient.connect(url,{
//         useNewUrlParser: true,
//         useUnifiedTopology: true
  
//     })
//     dbo = await connection.db(db_name)
// })

// afterAll(async ()=>{
//          await connection.close()
// })

// beforeEach(async ()=>{
//     await dbo.collection(col_name_q).insertOne({
//         "Id": 9998,
//         "PostTypeId": 2,
//         "CreationDate": Date.now(),
//         "ParentId":9999,
//         "Score": 12,
//         "ViewCount": 100,
//         "OwnerUserId": 902,
//         "Body": "Answer Tests v1.0",
//     })
//     await dbo.collection(col_name_q).insertOne({
//         "Id": 9999,
//         "PostTypeId": 1,
//         "AcceptedAnswerId": -1,
//         "CreationDate": 1629953505529,
//         "Score": 15,
//         "ViewCount": 186,
//         "OwnerUserId": 901,
//         "Title": "testing api for edit question again after reopening edittes",
//         "Body": "api seems to work fine reopen",
//         "Tags": [
//             "java",
//             "mongo",
//             "python"
//         ],
//         "ClosedDate": null
//     })
//     await dbo.collection(col_name_u).insertMany([{
//         'Id':901,
//         'token':'t1',
//         'username':'tester',
//     },
//     {
//         'Id':902,
//         'token':'t2',
//         'username':'tester'
//     },])
// })
// afterEach(async ()=>{
//     await dbo.collection(col_name_q).deleteOne({'Id':9998,'PostTypeId':2})
//     await dbo.collection(col_name_q).deleteOne({'Id':9999,'PostTypeId':1})
//     await dbo.collection(col_name_u).deleteMany({'username':'tester'})
//     await dbo.collection(col_name_n).deleteMany({'UserId':901})
//     await dbo.collection(col_name_n).deleteMany({'UserId':902})
// })


// test(' GET /users/:user_id INVALID USER', async () => {
//     var user_id = 901000
//     await supertest(app).get(`/users/${user_id}`)
//     .expect(403)
// })
// test(' GET /users/:user_id', async () => {
//     var user_id = 901
//     await supertest(app).get(`/users/${user_id}`)
//     .expect(200)
//     .then(async (res)=>{
//         let recieved = res.body
//         let expected = await dbo.collection(col_name_u).find({'Id':user_id}).toArray()
//         expected = expected[0]
//         compare(recieved,expected)
//     })
// })


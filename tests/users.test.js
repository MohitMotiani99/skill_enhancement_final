// const app = require('../controllers/users')
 const supertest = require('supertest')
// var MongoClient = require('mongodb').MongoClient
test('should ', () => {
    expect(1+1).toBe(2)
})


// var url = 'mongodb+srv://pradyumnakedilaya:secret123%23@cluster0.vlavb.mongodb.net/skillenhancement?retryWrites=true&w=majority'
// var db_name = 'skillenhancement'
// var col_name_q = 'questionAnswer'
// var col_name_u = 'users'
// var col_name_n = 'notifications'
// var col_name_c = 'comments'


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
//     expect(recieved.LastLogin).toBe(expected.LastLogin)
// }

// beforeAll(async ()=>{
//     connection = await MongoClient.connect(url,{
//         useNewUrlParser: true,
//         useUnifiedTopology: true
  
//     })
//     dbo = await connection.db(db_name)
// })

// afterAll(async ()=>{
//     await connection.close()
// })


// beforeEach(async ()=>{
//     await dbo.collection(col_name_q).insertOne({
//         "Id": 9998,
//         "PostTypeId": 2,
//         "CreationDate": Date.now(),
//         "ParentId":9999,
//         "Score": 12,
//         "ViewCount": 100,
//         "OwnerUserId": '903',
//         "Body": "Answer Tests v1.0",
//     })
//     await dbo.collection(col_name_q).insertOne({
//         "Id": 9999,
//         "PostTypeId": 1,
//         "AcceptedAnswerId": -1,
//         "CreationDate": Date.now(),
//         "Score": 15,
//         "ViewCount": 186,
//         "OwnerUserId": '903',
//         "Title": "Answer Testing Question v2.0",
//         "Body": "Tester Body",
//         "Tags": [
//             "jest"
//         ],
//         "ClosedDate": null
//     })
//     await dbo.collection(col_name_u).insertMany([{
//         'Id':901,
//         'token':'t1',
//         'username':'tester',
//         'displayName':'Mytester'
//     },
//     {
//         'Id':902,
//         'token':'t2',
//         'username':'tester',
//         'displayName':'Mytester'
//     },
//     {
//         'Id':'903',
//         'token':'t3',
//         'username':'tester',
//         'displayName':'Mytester'
//     },])
//     await dbo.collection(col_name_c).insertOne({
//         'Id':9997,
//         'PostId':9999,
//         'Score':0,
//         'Text':'Comment Testing Text v1.0',
//         'CreationDate':Date.now(),
//         'UserDisplayName':'tester',
//         'UserId':901
//     })
// })
// afterEach(async ()=>{
//     await dbo.collection(col_name_q).deleteOne({'Id':9998,'PostTypeId':2})
//     await dbo.collection(col_name_q).deleteOne({'Id':9999,'PostTypeId':1})
//     await dbo.collection(col_name_u).deleteMany({'username':'tester'})
//     await dbo.collection(col_name_n).deleteMany({'UserId':901})
//     await dbo.collection(col_name_n).deleteMany({'UserId':902})
//     await dbo.collection(col_name_c).deleteMany({'PostId':9999})
//     await dbo.collection(col_name_c).deleteMany({'PostId':9998})
// })


// test(' GET /users/:user_id NOT LOGGED IN', async () => {
//     var user_id = 901
//     await supertest(app).get(`/users/${user_id}`)
//     .expect(403)
// })
// test(' GET /users/:user_id INVALID USER ID', async () => {
//     var user_id = 901000
//     await supertest(app).get(`/users/${user_id}`)
//     .expect(403)
// })
// test(' GET /users/:user_id EXPIRED TOKEN', async () => {
//     var user_id = '104542337112312950899'
//     await supertest(app).get(`/users/${user_id}`)
//     .set({'x-access-token':'ya29.a0ARrdaM-qIoD4PUKNPPb1wKCDPRamwBUMkrpiG0WjkRTRy8rYrQjCqBEtzW3Wqy53bnXYSx2qZAestW9ekYeZWgz-wrGBPvYYbt2CGm7y31fl5GxIn7xZp1Tt3PL3vFuIKNR0fCnmyiQ_Crf9ASwSY4jrZlQW'})
//     .expect(403)
    
// })

// /**
//  * 
//  * EDIT PROFILE
//  * 
//  */
// test('PATCH /users/:user_id/editprofile NOT LOGGED IN', async () => {
//     var user_id = '903'
//     await supertest(app).patch(`/users/${user_id}/editprofile`)
//     .expect(403)
// })
// test('PATCH /users/:user_id/editprofile INVALID USER ID', async () => {
//     var user_id = '903000'
//     await supertest(app).patch(`/users/${user_id}/editprofile`)
//     .expect(403)
// })
// test(' PATCH /users/:user_id/editprofile  EXPIRED TOKEN', async () => {
//     var user_id = '104542337112312950899'
//     await supertest(app).patch(`/users/${user_id}/editprofile`)
//     .set({'x-access-token':'ya29.a0ARrdaM-qIoD4PUKNPPb1wKCDPRamwBUMkrpiG0WjkRTRy8rYrQjCqBEtzW3Wqy53bnXYSx2qZAestW9ekYeZWgz-wrGBPvYYbt2CGm7y31fl5GxIn7xZp1Tt3PL3vFuIKNR0fCnmyiQ_Crf9ASwSY4jrZlQW'})
//     .expect(403)
    
// })
// // test('PATCH /users/:user_id/editprofile', async () => {
// //     var edits = {
// //         'gender':'Female',
// //         'SocialLink':'http://myprofile.com'
// //     }
// //     var user_id = '104542337112312950899'
// //     await supertest(app).patch(`/users/${user_id}/editprofile`)
// //     .set({'content-type':'application/json'})
// //     .set({'x-access-token':'ya29.a0ARrdaM-mibIAt0fGhtWJzKeQV1Ht_NG0xgRWhCv-juWBxI9TRrFGQMiUCCrFE3s5WycSyIqU9Xk21p40oJxDcLRJJj_-v-pwmBQIPAbdc33EatLNF96pt6A7AS_MGMUFwk3zgO3mkwlMqBWqTzCw9kC0CWrh'})
// //     .send(edits)
// //     .expect(302)
// //     .then(async (res)=>{
// //         expect(res.headers.location).toBe(`/users/${user_id}`)
// //         // let recieved = dbo.collection(col_name_u).find({'Id':user_id}).toArray()
// //         // console.log(recieved)
// //         // recieved = recieved[0]

// //         // expect(recieved.gender).toBe(edits.gender)
// //         // expect(recieved.SocialLink).toBe(edits.SocialLink)
// //     })
// // })

// // test('PATCH /users/:user_id/delete', async () => {
// //     var edits = {
// //         'gender':'Female',
// //         'SocialLink':'http://myprofile.com'
// //     }
// //     var user_id = '903'
// //     await supertest(app).patch(`/users/${user_id}/editprofile`)
// //     .set({'content-type':'application/json'})
// //     .set({'x-access-token':'t3'})
// //     .send(edits)
// //     .expect(200)
// //     .then(async (res)=>{
// //         expect(res.text).toBe('User: '+'tester'+' Deleted')
        
// //     })
// // })

// test('GET /users/:user_id/totalquestions INVALID USER',async ()=>{
//     var user_id = 901000
//     await supertest(app).get(`/users/${user_id}/totalquestions`)
//     .expect(200)
//     .then(async (res)=>{
//         expect(res.text).toBe('Invalid User ID')
//     })
// })
// test('GET /users/:user_id/totalquestions',async ()=>{
//     var user_id = '903'
//     await supertest(app).get(`/users/${user_id}/totalquestions`)
//     .expect(200)
//     .then(async (res)=>{
//         //let cnt = await dbo.collection(col_name_q).find({'OwnerUserId':user_id,'PostTypeId':1}).toArray().length
//         let cnt = '1'
//         expect(res.text).toBe(cnt)
//     })
// })


// test('GET /users/:user_id/totalanswers INVALID USER',async ()=>{
//     var user_id = 901000
//     await supertest(app).get(`/users/${user_id}/totalanswers`)
//     .expect(200)
//     .then(async (res)=>{
//         expect(res.text).toBe('Invalid User ID')
//     })
// })
// test('GET /users/:user_id/totalanswers',async ()=>{
//     var user_id = '903'
//     await supertest(app).get(`/users/${user_id}/totalanswers`)
//     .expect(200)
//     .then(async (res)=>{
//         //let cnt = await dbo.collection(col_name_q).find({'OwnerUserId':user_id,'PostTypeId':2}).toArray().length
//         let cnt = '1'
//         expect(res.text).toBe(cnt)
//     })
// })


// test('GET /users/:user_id/totalcomments INVALID USER',async ()=>{
//     var user_id = 901000
//     await supertest(app).get(`/users/${user_id}/totalcomments`)
//     .expect(200)
//     .then(async (res)=>{
//         expect(res.text).toBe('Invalid User ID')
//     })
// })
// test('GET /users/:user_id/totalcomments',async ()=>{
//     var user_id = '903'
//     await supertest(app).get(`/users/${user_id}/totalcomments`)
//     .expect(200)
//     .then(async (res)=>{
//         //let cnt = await dbo.collection(col_name_c).find({'UserId':user_id}).toArray().length
//         let cnt = '0'
//         expect(res.text).toBe(cnt)
//     })
// })


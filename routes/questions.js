const express = require("express");
const router = express.Router();
const mongoose = require("mongoose")
const ObjectId = require("mongodb").ObjectId;

const questionSchema = new mongoose.Schema({
  user_id: String,
  user_name: String,
  title: String,
  body: String,
  tags: Array,
  votes: Array,
  answers: Array,
},
  {
    writeConcern: {
      w: 'majority',
      j: true,
      wtimeout: 1000
    }
  })
const Question = mongoose.model("question", questionSchema)

router.route("/").get(function (req, res) {
  Question.find({}, (err, result) => {
    if (err)
      console.log(err);
    else {
      res.json(result);
    }
  })
});
router.route("/tagged/:tag").get(function (req, res) {
  let tag = req.params.tag
  console.log(tag);
  Question.find({
    tags: { $in: [tag] }
  }, function (err, result) {
    if (err) throw err;
    console.log(result);
    res.send(result)
  })
});
router.route("/byuser/:id").get(function (req, res) {
  let uid = req.params.id
  Question.find({
    user_id: uid
  }, function (err, result) {
    if (err) {
      res.send({ success: false })
      throw err;
    }
    console.log(result);
    res.send({ success: true, fQuestions: result })
  })
});
router.route("/singleQuestion/:id").get(function (req, res) {
  // console.log(req.params.id);
  let myquery = { _id: ObjectId(req.params.id) };
  Question.findOne(myquery, function (err, result) {
    if (err) throw err;
    // console.log(result)
    res.json(result);
  });
});
router.route("/ask").post(async function (req, res) {
  console.log(req.user);
  let id = req.user.id
  try {
    let newAskQuestion = new Question({
      user_id: id,
      user_name: req.user.name,
      title: req.body.title,
      body: req.body.body,
      tags: req.body.tags,
      votes: [],
      answers: [],
    });
    let doc = await newAskQuestion.save()

    res.send({ success: true, ques: doc })
  }
  catch (err) {
    console.log(err);
    res.send({ success: false })
  }
});

router.route("/votes-update/:id").post(function (req, res) {
  var { action, userid } = req.body
  if (userid === null)
    res.send({ success: false })
  let myquery = { _id: ObjectId(req.params.id) };
  var voteArr = []
  var updatedSingleQuestion
  Question.findOne(myquery, function (err, foundQuestion) {
    if (err) throw err;
    if (foundQuestion) {
      updatedSingleQuestion = foundQuestion
      voteArr = foundQuestion.votes
      console.log("found", voteArr);
      var findex = -1
      if (voteArr.length != 0) {
        voteArr.forEach((element, index) => {
          if (element && element.uid) {
            if (element.uid === (userid)) {
              findex = index
              if (action === "increase") {
                if (voteArr[findex].vote === 1)
                  voteArr[findex].vote = 0
                if (voteArr[findex].vote === 0)
                  voteArr[findex].vote = 1
                else
                  voteArr[findex].vote += 1
              } else {
                if (voteArr[findex].vote === -1)      // "decrease"
                  voteArr[findex].vote = 0
                if (voteArr[findex].vote === 0)
                  voteArr[findex].vote = -1
                else
                  voteArr[findex].vote -= 1
              }
            }
          }
        })
      }
      if (findex === -1) {
        console.log("not found");
        var x;
        if (action === "increase")
          x = 1;
        else
          x = -1
        voteArr.push({ uid: userid, vote: x })
      }
      updatedSingleQuestion.votes = voteArr
      console.log(voteArr)
      Question.updateOne(myquery,
        { $set: { votes: voteArr } },
        { writeConcern: { w: "majority", wtimeout: 5000 } },
        function (err, result) {
          if (err) throw err;
          console.log(result)
          res.send({ success: true, message: updatedSingleQuestion })
        }
      );
    }
  })
});
router.route("/add-answer/:id").post(function (req, res) {
  const { aid: id, username: usname, body: b, votes: v } = req.body
  let myquery = { _id: ObjectId(req.params.id) };
  let updatedSingleQuestion
  let answersArr
  Question.findOne(myquery, (err, foundQuestion) => {
    if (err)
      throw err
    updatedSingleQuestion = foundQuestion
    answersArr = foundQuestion.answers
    if (answersArr)
      answersArr.push({ aid: id, usname: usname, body: b, votes: v })
    else
      updatedSingleQuestion.answers = answersArr
    console.log(updatedSingleQuestion.answers);
    Question.updateOne(myquery,
      { $set: { answers: updatedSingleQuestion.answers } },
      { writeConcern: { w: "majority", wtimeout: 5000 } },
      function (err, result) {
        if (err) throw err;
        res.json(updatedSingleQuestion);
      }
    );
  })
});
router.route("/answer-votes-update/:id").post(function (req, res) {
  const { action, ansid } = req.body
  const { id } = req.user
  // console.log("found", id.toString());
  let myquery = { _id: ObjectId(req.params.id) };
  var ansArr = []
  var updatedSingleQuestion
  Question.findOne({ myquery }, function (err, foundQuestion) {
    if (err) throw err;
    //
    if (foundQuestion) {
      updatedSingleQuestion = foundQuestion
      ansArr = foundQuestion.answers
      console.log("found", ansArr);
      var aindex = -1
      ansArr.forEach((ans, index) => {
        if (ans.aid === ansid)
          aindex = index
      })
      console.log(aindex);
      if (ansArr[aindex].aid != id.toString()) {
        console.log(true);
        var findex = -1
        var ansVotesArr = ansArr[aindex].votes
        ansVotesArr.forEach((element, index) => {
          if (element && element.uid) {
            if ((element.uid).toString() === (id.toString())) {
              findex = index
              console.log("found", findex)
              if (action === "increase") {
                if (ansVotesArr[findex].vote === 1)
                  ansVotesArr[findex].vote = 0
                if (ansVotesArr[findex].vote === 0)
                  ansVotesArr[findex].vote = 1
                else
                  ansVotesArr[findex].vote += 1
              } else {
                if (ansVotesArr[findex].vote === -1)      // "decrease"
                  ansVotesArr[findex].vote = 0
                if (ansVotesArr[findex].vote === 0)
                  ansVotesArr[findex].vote = -1
                else
                  ansVotesArr[findex].vote -= 1
              }
              // if (action === "increase" && ansVotesArr[findex].vote < 1)
              //   ansVotesArr[findex].vote += 1
              // if (action === "decrease" && ansVotesArr[findex].vote > -1)
              //   ansVotesArr[findex].vote -= 1
            }
          }
        })
        // }
        if (findex === -1) {
          console.log("not found");
          var x;
          if (action === "increase")
            x = 1;
          else
            x = -1
          ansVotesArr.push({ uid: id, vote: x })
        }
        updatedSingleQuestion.answers.votes = ansVotesArr
        console.log(updatedSingleQuestion.answers.votes);
        Question.updateOne(myquery,
          { $set: { answers: updatedSingleQuestion.answers } },
          { writeConcern: { w: "majority", wtimeout: 5000 } },
          function (err, result) {
            if (err) throw err;
            res.send(updatedSingleQuestion)
          }
        );
      }
    }
  })
})

module.exports = router;

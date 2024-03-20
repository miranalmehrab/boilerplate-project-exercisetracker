require('dotenv').config();
const parser = require('body-parser');
const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');

app.use(cors());
app.use(express.static('public'));
app.use(parser.urlencoded({ extended: false }));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let User = mongoose.model('User', new mongoose.Schema({username: String}));
let Exercise = mongoose.model('Exercise', new mongoose.Schema({userId: mongoose.ObjectId, description: String, duration: Number, date: Date}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/api/users', function (req, res) {    
    User.find({}, 'username _id', function (err, data) {
        if (err) return console.error(err);
        console.log(data);
        res.send(data);
    });
});

app.post('/api/users', function (req, res) {
    let user = new User({username: req.body.username});
    user.save(function (err, data) {
        if (err) return console.error(err);
        console.log(data);
        res.json({username: data.username, _id: data._id});
    });
});

app.post('/api/users/:_id/exercises', function (req, res) {
    User.findById(req.params._id, function (err, user) {
        let date = req.body.date ? new Date(req.body.date).toDateString() : new Date().toDateString();
        let exercise = new Exercise({userId: user._id, description: req.body.description, duration: req.body.duration, date: date});
    
        exercise.save(function (err, exercise) {
            if (err) return console.error(err);
            let response = {username: user.username, description: exercise.description, duration: exercise.duration, date: new Date(exercise.date).toDateString(), _id: user._id};
            console.log(response);
            res.json(response);
        });
    });
});

app.get('/api/users/:_id/logs', function (req, res) {
    User.findById(req.params._id, function (err, user) {
        if (err) return console.log(err);

        let from = req.query.from ? new Date(req.query.from) : new Date(0);
        let to = req.query.to ? new Date(req.query.to) : new Date();
        let limit = req.query.limit ? parseInt(req.query.limit) : 0;

        Exercise.find({userId: user._id, date: {$gte: from, $lte: to}}, 'description duration date -_id', {limit: limit}, function (err, exercises) {
            if (err) return console.error(err);
            
            let logs = exercises.map(exercise => ({description: exercise.description, duration: exercise.duration, date: new Date(exercise.date).toDateString()}));
            let response = {_id: user._id, username: user.username};
            if (req.query.from) response.from = new Date(req.query.from).toDateString();
            if (req.query.to) response.to = new Date(req.query.to).toDateString(); 
            response.count = logs.length;
            response.log = logs;
            
            console.log(response);
            res.json(response);
        });
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});

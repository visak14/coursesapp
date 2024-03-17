const express = require('express')
var bodyparser = require('body-parser')
const {Admin, Course, User}  = require('../db/index')
const router = express.Router()
router.use(bodyparser.json())
const jwt = require('jsonwebtoken');
const { SECRET } = require("../middleware/auth")
const { authenticateJwt } = require("../middleware/auth");

const { z } = require('zod');

let usernameInputProps = z.object({
    username: z.string().min(1).email(),
    password: z.string().min(1)
})
router.post('/signup', (req, res)  =>{
    const parsedInput = usernameInputProps.safeParse(req.body)
    if(!parsedInput.success) {
        return res.status(411).json({
            msg: parsedInput.error
        })
        return;
    }
    let username = parsedInput.data.username;
    let password = parsedInput.data.password
    
    function callback(user){
        if(user){
            res.status(403).json({message: 'user already exist'})
        }
        else {
            const obj  = {username: username, password: password}
            const newUser  =  new User(obj)
             newUser.save()
             const token = jwt.sign({ username, role: 'admin' }, SECRET, { expiresIn: '1h' });
             res.json({message:'User created successfully', token})

        }   
        
    }

    Admin.findOne({username}).then(callback)
})

router.get("/u", authenticateJwt, async (req, res) => {
  const user= await User.findOne({ username: req.user.username });
  if (!user) {
    res.status(403).json({msg: "User doesnt exist"})
    return
  }
  res.json({
      username: user.username
  })
});

// router.post('/signup', async (req, res) => {
//     const { username, password } = req.body;
//     const user = await User.findOne({ username });
//     if (user) {
//       res.status(403).json({ message: 'User already exists' });
//     } else {
//       const newUser = new User({ username, password });
//       await newUser.save();
//       const token = jwt.sign({ username, role: 'user' }, SECRET, { expiresIn: '1h' });
//       res.json({ message: 'User created successfully', token });
//     }
//   });

  router.get('/courses', authenticateJwt, async (req, res) => {
    const courses = await Course.find({published: true});
    res.json({ courses });
  });


  router.post('/login', async (req, res) => {
    const { username, password } = req.headers;
    const user = await User.findOne({ username, password });
    if (user) {
      const token = jwt.sign({ username, role: 'user' }, SECRET, { expiresIn: '1h' });
      res.json({ message: 'Logged in successfully', token });
    } else {
      res.status(403).json({ message: 'Invalid username or password' });
    }
  });
  
  router.get('/courses', authenticateJwt, async (req, res) => {
    const courses = await Course.find({published: true});
    res.json({ courses });
  });
  
  router.post('/courses/:courseId', authenticateJwt, async (req, res) => {
    const course = await Course.findById(req.params.courseId);
    console.log(course);
    if (course) {
      const user = await User.findOne({ username: req.user.username });
      if (user) {
        user.purchasedCourses.push(course);
        await user.save();
        res.json({ message: 'Course purchased successfully' });
      } else {
        res.status(403).json({ message: 'User not found' });
      }
    } else {
      res.status(404).json({ message: 'Course not found' });
    }
  });
  
  router.get('/purchasedCourses', authenticateJwt, async (req, res) => {
    const user = await User.findOne({ username: req.user.username }).populate('purchasedCourses');
    if (user) {
      res.json({ purchasedCourses: user.purchasedCourses || [] });
    } else {
      res.status(403).json({ message: 'User not found' });
    }
  });



module.exports =  router


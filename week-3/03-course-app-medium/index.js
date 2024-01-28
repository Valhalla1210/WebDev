const express = require('express');
const app = express();
const jwt=require('jsonwebtoken');

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

let courseID=0;

secretKey="he3lloworld";

const generateJWT=(user)=>{
  const payload={username:user.username};
  const token=jwt.sign(payload,secretKey,{expiresIn:"1h"});
  return token;
}
const adminAuthentication=(req,res,next)=>{
  const authHeader=req.headers.authorization;
  const token=authHeader.split(' ')[1];

  jwt.verify(token,secretKey,(err,decodedString)=>{
    if(err){
      res.json({message:'Authentication failed'});
    }
    else{
      res.user=decodedString;
      next();
    }
  })
}
// Admin routes
app.post('/admin/signup', (req, res) => {
  const admin=req.body;
  const existingAdmin=ADMINS.find(temp=>temp.username===admin.username && temp.password===admin.password);
  if(existingAdmin){
    res.status(403).json({message:'admin already exists'});
  }
  else{
    const token=generateJWT(admin);
    res.json({message:"admin signed up successfully",token:token});
  }
});

app.post('/admin/login', (req, res) => {
  // logic to log in admin
  const admin=req.body;
  const existingAdmin=ADMINS.find(temp=>temp.username===admin.username && temp.password===admin.password);
  if(existingAdmin){
    const token=generateJWT(existingAdmin);
    res.json({message:token});
  }
  else{
    res.status(403).json({message:"user authentication failed"});
  }
});

app.post('/admin/courses', adminAuthentication,(req, res) => {
  // logic to create a course
  courseID++;
  const course=req.body;
  course.id=courseID;
  COURSES.push(course);

  res.json({message:'new course created'});
});

app.put('/admin/courses/:courseId',adminAuthentication, (req, res) => {
  // logic to edit a course
  const courseId = parseInt(req.params.courseId);

  const courseIndex = COURSES.findIndex(c => c.id === courseId);

  if (courseIndex > -1) {
    const updatedCourse = { ...COURSES[courseIndex], ...req.body };
    COURSES[courseIndex] = updatedCourse;
    res.json({ message: 'Course updated successfully' });
  } else {
    res.status(404).json({ message: 'Course not found' });
  }
});

app.get('/admin/courses',adminAuthentication, (req, res) => {
  // logic to get all courses
  res.json({COURSES:COURSES});
});

// User routes
app.post('/users/signup',(req, res) => {
  // logic to sign up user
  const user=req.body;
  const existingUser=USERS.find(temp=>temp.username===user.username && temp.password===user.password);
  if(existingUser){
    res.status(403).json({messgae:"user already exists"});
  }
  else{
    const newUser={
      username:user.username,
      password:user.password,
      purchasedCourses:[]
    }
    USERS.push(newUser);
    const token=generateJWT(user);
    res.json({
      message:"user signup successful",
      token:token
    });
  }
});

app.post('/users/login', (req, res) => {
  // logic to log in user
  const user=req.body;
  const existingUser=USERS.find(temp=>temp.username===user.username && temp.password===user.password);
  if(existingUser){
    const token=generateJWT(user);
    res.json({
      message:"user signed in",
      token:token
    });
  }
  else{
    res.status(403).json({
      message:"user not signed up"
    });
  }
});

app.get('/users/courses',adminAuthentication, (req, res) => {
  // logic to list all courses
  let publishedCourses=[];
  for(let i=0;i<COURSES.length;i++){
    if(COURSES[i].published){
      publishedCourses.push(COURSES[i]);
    }
  }
  res.json({publishedCourses:publishedCourses});
});

app.post('/users/courses/:courseId', (req, res) => {
  // logic to purchase a course
  const newCourseID=parseInt(req.params.courseId);
  const course=COURSES.find(c=>c.id===newCourseID);
  if(course){
    const user=req.body;
    const userIndex=USERS.indexOf(user);
    if(userIndex==-1){
      res.json({message:"no such user exists"});
    }
    else{
      USERS[userIndex].purchasedCourses.push(newCourseID);
      res.json({message:"course purchased by user"})
    }
  }
  else{
    res.json({message:"no such course exists"});
  }
});

app.get('/users/purchasedCourses', (req, res) => {
  // logic to view purchased courses
  const user = USERS.find(u => u.username === req.user.username);
  if (user && user.purchasedCourses) {
    res.json({ purchasedCourses: user.purchasedCourses });
  } else {
    res.status(404).json({ message: 'No courses purchased' });
  }
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});

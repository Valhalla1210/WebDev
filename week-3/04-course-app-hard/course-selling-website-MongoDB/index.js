const express = require('express');
const app = express();
const jwt=require('jsonwebtoken');
const mongoose=require('mongoose');

app.use(express.json());

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
});

const adminSchema = new mongoose.Schema({
  username: String,
  password: String
});

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  imageLink: String,
  published: Boolean
});
const User = mongoose.model('User', userSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Course = mongoose.model('Course', courseSchema);

mongoose.connect('mongodb+srv://namitvijay:namshob124@cluster0.fyrarat.mongodb.net/');

secretKey="h3lloworld";
// Admin routes

//middleware

const authenticateJwt=(req,res,next)=>{
  const authHeader=req.headers.authorization;
  if(authHeader){
    const token=authHeader.split(' ')[1];
    jwt.verify(token,secreKey,(err,decodedString)=>{
      if(err){
        res.status(403).json("authentication erroe");
      }
      else{
        req.user=decodedString;
        next();
      }
    })
  }
  else{
    res.status().json({message:"web token not found"});
  }
}

app.post('/admin/signup', async (req, res) => {
  // logic to sign up admin
  const admin=req.body;
  const existingAdmin=await Admin.findOne({username:admin.username,password:admin.password});
  if(existingAdmin){
    res.json({message:"Admin already exists"});
  }
  else{
    const newAdmin=new Admin({username,password});
    await newAdmin.save();
    const token=jwt.sign({username:admin.username,role:"Admin"},secreKey,{expiresIn:"1h"});
    res.json({message:"Admin created successfully",token});
  }
});

app.post('/admin/login', async (req, res) => {
  // logic to log in admin
  const admin=req.body;
  const existingAdmin= await Admin.findOne({username:admin.username,password:admin.password});
  if(existingAdmin){
    const token=jwt.sign({username:admin.username,role:"Admin"},secretKey,{expiresIn:"1h"});
    res.json({message:"admin signed in successfully",token:token});
  }
  else{
    res.status(403).json({message:"Sign up needed"});
  }
});

app.post('/admin/courses',authenticateJwt, async (req, res) => {
  // logic to create a course
  const course=req.body;
  const newCourse= new Course({course});
  await newCourse.save();
  res.json({message:"New course creation successful",courseId:newCourse.id});
});

app.put('/admin/courses/:courseId',authenticateJwt, async(req, res) => {
  // logic to edit a course
  const courseID=req.parm
  const existingCourse=await Course.findByIdAndUpdate(courseID,req.body,{new:true});
  if(existingCourse){
    res.json({message:"Course updated successfully",existingCourse});
  }
  else{
    res.status(404).json({message:"Course upation unsuccessful"});
  }
});

app.get('/admin/courses',authenticateJwt, async(req, res) => {
  // logic to get all courses
  const course=await Course.find({});
  res.json({course});
});

// User routes
app.post('/users/signup',async (req, res) => {
  // logic to sign up user
  const user=req.body;
  const existingUser=await User.findOne({user});
  if(existingUser){
    res.status(403).json({message:"User already exists"});
  }
  else{
    const newUser=new User({user});
    await newUser.save();
    const token=jwt.sign({username:user.username,role:"User"},secreKey,{expiresIn:"1h"});
    res.json({message:"New user signed up successfully"});
  }
});

app.post('/users/login', async (req, res) => {
  // logic to log in user
  const user=req.body;
  const existingUser=await User.findOne({user});
  if(existingUser){
    const token=jwt.sign({username:user.username,role:"User"},secreKey,{expiresIn:"1h"});
    res.json({message:"User signed in",token:token});
  }
  else{
    res.status(403).json({message:"User not found"});
  }
});

app.get('/users/courses',authenticateJwt,async (req, res) => {
  // logic to list all courses
  const course=await Course.find({});
  res.json({message:"list of all courses",course});
});

app.post('/users/courses/:courseId', authenticateJwt,async (req, res) => {
  // logic to purchase a course
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

app.get('/users/purchasedCourses', authenticateJwt,async (req, res) => {
  // logic to view purchased courses
  const user = await User.findOne({ username: req.user.username }).populate('purchasedCourses');
  if(user){
    res.json({message:"List of purchased courses",courseList:user.purchasedCourses});
  } 
  else{
    res.status(403).json({message:"User not found"});
  }
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});

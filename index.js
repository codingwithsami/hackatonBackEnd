// Import dependencies
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const courseModel = require("./models/model");
require("dotenv").config();

// App setup
const app = express();
app.use(express.json()); // Use express's built-in JSON parser


app.get("/courses", async(req, res) =>{
 try{
  const result = await courseModel.find({})
      res.status(200).send({
          isSuccessfull:true,
          data:result
      })
  }catch(error){
      res.status(400).send({
          isSuccessfull:false,
          message: error.message,
          data: error
      })
  }
})


app.get("/courses/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await courseModel.findById(id); // Await the result of the async operation

    if (result) {
      res.status(200).send({
        isSuccessfull: true,
        data: result,
      });
    } else {
      res.status(404).send({
        isSuccessfull: false,
        message: "Course Not Found",
      });
    }
  } catch (error) {
    res.status(400).send({
      isSuccessfull: false,
      message: error.message,
      data: error,
    });
  }
});


    
app.post("/post", (req, res) => {
    try {
        const body = req.body;
        const courseObj = {
            name: body.name,
            durationInMonths: body.durationInMonths,
        };

        const resObj = new courseModel({ ...courseObj});

        resObj.save()
            .then((dbRes) => {
                res.status(200).send({
                    isSuccessfull: true,
                    data: dbRes,
                    message: "Course Added Successfully",
                });
            })
            .catch((err) => {
                throw err;
            });
    } catch (error) {
        res.status(400).send({
            isSuccessfull: false,
            message: error.message,
            data: error,
        });
    }
});


app.delete('/courses/:id', async (req, res) => {
  try {
      const courseId = req.params.id;
      const deletedCourse = await courseModel.findByIdAndDelete(courseId);

      if (!deletedCourse) {
          return res.status(404).json({
              isSuccessfull: false,
              message: 'Course not found',
              data: {},
          });
      }

      res.status(200).json({
          isSuccessfull: true,
          message: 'Course deleted successfully',
          data: deletedCourse,
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({
          isSuccessfull: false,
          message: 'An error occurred',
          data: {},
      });
  }
});



app.put('/courses/:id', async (req, res) => {
  try {
      const courseId = req.params.id;
      const updatedData = req.body; // Assuming the updated course details are sent in the request body

      // Check if the course ID is valid
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
          return res.status(400).json({
              isSuccessfull: false,
              message: 'Invalid course ID',
              data: {},
          });
      }

      // Find and update the course
      const updatedCourse = await courseModel.findByIdAndUpdate(courseId, updatedData, {
          new: true, // This ensures the updated document is returned
          runValidators: true, // This ensures validation is applied on the updated data
      });

      // If course not found, return 404 error
      if (!updatedCourse) {
          return res.status(404).json({
              isSuccessfull: false,
              message: 'Course not found',
              data: {},
          });
      }

      // Return the updated course details
      return res.status(200).json({
          isSuccessfull: true,
          message: 'Course updated successfully',
          data: updatedCourse,
      });

  } catch (error) {
      console.error(error);  // Log the error stack for better visibility
      res.status(500).json({
          isSuccessfull: false,
          message: 'An error occurred',
          data: {},
      });
  }
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1); // Exit the application if the connection fails
  });

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);


// Signup route
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "All fields are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10); // Hash password
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error registering user", error: err.message });
  }
});

// Login route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.status(200).json({ message: "Login successful" });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
});

// Get user by ID route
app.get("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password"); // Exclude password
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user", error: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


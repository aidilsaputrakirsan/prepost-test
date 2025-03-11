// controllers/authController.js
const User = require('../models/User');

// Login user / Create new user
exports.login = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ name });
    
    if (user) {
      // Update existing user
      user.avatar = avatar || user.avatar;
      user.status = "waiting";
      await user.save();
    } else {
      // Create new user
      user = new User({
        name,
        avatar,
        status: "waiting"
      });
      await user.save();
    }
    
    return res.status(200).json({
      status: "success",
      user: {
        id: user._id,
        name: user.name,
        avatar: user.avatar,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};
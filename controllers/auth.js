const User = require('../models/User');


// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { username, email,tel,firstname, lastname, password, role  } = req.body;

    // Prevent user from setting role manually
    const user = await User.create({
      username,
      firstname,
      lastname,
      email,
      password,
      role,
      tel
    });

    sendTokenResponse(user, 201, res);

  } catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      message: (`Cannot register user: ${err.message}`)
    });
  }
};



// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    // Validate email & password
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or username and password'
      });
    }

    // Check for user (+password because select: false)
      const user = await User.findOne({
        $or: [
          { email: identifier },
          { tel: identifier }
        ]
      }).select('+password');
      
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);

  } catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      message: 'Login failed'
    });
  }
};



// @desc    Logout user
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
};

exports.updateUser = async (req, res, next) => {
  try {
    const {username,email,tel,firstname,lastname,picture} = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { username, email, tel, firstname, lastname, picture }, {
      new: true,
      runValidators: true
    }).select('-password'); 

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }
   
    return res.status(200).json({
      success: true,
      msg: 'User information updated successfully.',
      data: user
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      msg: `Cannot update user, ${e}`
    });
  }
};



// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
};

exports.resetPassword = async (req,res,next) => {
  try{
    const {currentPassword,newPassword,rePassword} = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if(!user){
      return res.status(404).json({
        success:false,
        msg:"User cannot be found"
      })
    }

    const isMatch = await user.matchPassword(currentPassword);
    if(!isMatch){
      return res.status(401).json({
        success:false,
        msg:"Current password is incorrect"
      });
    }
    if(newPassword !== rePassword){
      return res.status(400).json({
        success:false,
        msg: "New password comfirmation mismatch"
      })
    }
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success:true,
      msg: "Password changed successfully."
    })
  }
  catch(e){
    res.status(500).json({
      success:false,
      msg:(`Cannot change password, ${e}`)
    })
  }
}



// Helper: Send token response
const sendTokenResponse = (user, statusCode, res) => {

  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() +
      (process.env.JWT_COOKIE_EXPIRE || 1) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,   // or firstname + lastname
        email: user.email,
        role: user.role,
        token
      }
    });
};
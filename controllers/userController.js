import User from '../models/User.js';
import UserInfo from '../models/UserInfo.js';

// Custom error classes (inline to avoid import issues)
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class DatabaseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
  }
}

export async function registerUser(req, res) {
  try {
    console.log('Register request received:', req.body);
    
    const { name, email, mobile } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Name is required'
        }
      });
    }

    if (!email || email.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Email is required'
        }
      });
    }

    if (!mobile || mobile.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Mobile is required'
        }
      });
    }

    // Check if user already exists
    try {
      const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
      if (existingUser) {
        console.log('User already exists:', existingUser.email);
        // Return existing user instead of error
        return res.json({
          success: true,
          user: {
            id: existingUser._id.toString(),
            name: existingUser.name,
            email: existingUser.email,
            mobile: existingUser.mobile,
          },
        });
      }
    } catch (dbError) {
      console.error('Database error checking existing user:', dbError);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Database error while checking user'
        }
      });
    }

    // Create new user
    try {
      const user = new User({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
      });

      const savedUser = await user.save();

      if (!savedUser) {
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to create user'
          }
        });
      }

      console.log('User created successfully:', savedUser.email);

      res.status(201).json({
        success: true,
        user: {
          id: savedUser._id.toString(),
          name: savedUser.name,
          email: savedUser.email,
          mobile: savedUser.mobile,
        },
      });
    } catch (saveError) {
      console.error('Error saving user:', saveError);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to save user to database'
        }
      });
    }
  } catch (error) {
    console.error('Unexpected error in registerUser:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.message,
          stack: error.stack 
        })
      }
    });
  }
}

export async function saveUserInfo(req, res) {
  try {
    const { name, email, mobile } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Name is required'
        }
      });
    }

    if (!email || email.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Email is required'
        }
      });
    }

    if (!mobile || mobile.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Mobile is required'
        }
      });
    }

    // Create new user info entry (duplicates allowed)
    const userInfo = new UserInfo({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
    });

    const savedUserInfo = await userInfo.save();

    if (!savedUserInfo) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to save user info'
        }
      });
    }

    // Return the userId as requested
    res.status(201).json({
      userId: savedUserInfo._id.toString(),
    });
  } catch (error) {
    console.error('Error in saveUserInfo:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.message,
          stack: error.stack 
        })
      }
    });
  }
}

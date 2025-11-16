import User from '../models/User.js';
import UserInfo from '../models/UserInfo.js';
import { ValidationError, DatabaseError } from '../utils/errors.js';

export async function registerUser(req, res, next) {
  try {
    const { name, email, mobile } = req.body;

    if (!name || name.trim() === '') {
      throw new ValidationError('Name is required');
    }

    if (!email || email.trim() === '') {
      throw new ValidationError('Email is required');
    }

    if (!mobile || mobile.trim() === '') {
      throw new ValidationError('Mobile is required');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
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

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
    });

    const savedUser = await user.save();

    if (!savedUser) {
      throw new DatabaseError('Failed to create user');
    }

    res.status(201).json({
      success: true,
      user: {
        id: savedUser._id.toString(),
        name: savedUser.name,
        email: savedUser.email,
        mobile: savedUser.mobile,
      },
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(`Error registering user: ${error.message}`);
  }
}

export async function saveUserInfo(req, res, next) {
  try {
    const { name, email, mobile } = req.body;

    if (!name || name.trim() === '') {
      throw new ValidationError('Name is required');
    }

    if (!email || email.trim() === '') {
      throw new ValidationError('Email is required');
    }

    if (!mobile || mobile.trim() === '') {
      throw new ValidationError('Mobile is required');
    }

    // Create new user info entry (duplicates allowed)
    const userInfo = new UserInfo({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
    });

    const savedUserInfo = await userInfo.save();

    if (!savedUserInfo) {
      throw new DatabaseError('Failed to save user info');
    }

    // Return the userId as requested
    res.status(201).json({
      userId: savedUserInfo._id.toString(),
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError(`Error saving user info: ${error.message}`);
  }
}

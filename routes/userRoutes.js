import express from 'express';
import { registerUser, saveUserInfo } from '../controllers/userController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/save-info', saveUserInfo);

export default router;

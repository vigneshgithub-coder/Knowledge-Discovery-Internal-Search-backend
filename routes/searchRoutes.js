import express from 'express';
import { search, suggestions, popular } from '../controllers/searchController.js';

const router = express.Router();

router.post('/', search);
router.get('/suggestions', suggestions);
router.get('/popular', popular);

export default router;

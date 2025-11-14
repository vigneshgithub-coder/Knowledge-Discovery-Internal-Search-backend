import express from 'express';
import { search, getSuggestions } from '../controllers/searchController.js';

const router = express.Router();

router.post('/', search);
router.get('/suggestions', getSuggestions);

export default router;

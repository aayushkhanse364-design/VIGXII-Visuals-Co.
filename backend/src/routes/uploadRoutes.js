import { Router } from 'express';
import multer from 'multer';

import { uploadMedia } from '../controllers/uploadController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

router.post('/', protectAdmin, upload.single('file'), uploadMedia);

export default router;
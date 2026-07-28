import { Router } from 'express';
import scoreboardsController from '../controllers/scoreboards.controller';
import { authMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(__dirname, '../../uploads/scoreboards');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Upload media file (logo image or PDF convocatoria)
router.post('/upload', upload.single('file'), (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se envió ningún archivo.' });
    }
    const fileUrl = `/uploads/scoreboards/${req.file.filename}`;
    return res.status(200).json({ success: true, fileUrl });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Scoreboards CRUD
router.get('/', (req, res) => scoreboardsController.getAllScoreboards(req, res));
router.get('/:id', (req, res) => scoreboardsController.getScoreboardById(req, res));
router.post('/', (req, res) => scoreboardsController.createScoreboard(req, res));
router.put('/:id', (req, res) => scoreboardsController.updateScoreboard(req, res));
router.delete('/:id', (req, res) => scoreboardsController.deleteScoreboard(req, res));

// Challenges
router.post('/:id/challenges', (req, res) => scoreboardsController.addChallenge(req, res));
router.put('/challenges/:challengeId', (req, res) => scoreboardsController.updateChallenge(req, res));
router.delete('/challenges/:challengeId', (req, res) => scoreboardsController.deleteChallenge(req, res));

// Scoring
router.post('/:id/scores/group', (req, res) => scoreboardsController.awardGroupScore(req, res));
router.post('/:id/scores/participant', (req, res) => scoreboardsController.awardParticipantScore(req, res));
router.put('/scores/group/:scoreId', (req, res) => scoreboardsController.updateGroupScore(req, res));
router.put('/scores/participant/:scoreId', (req, res) => scoreboardsController.updateParticipantScore(req, res));
router.delete('/scores/group/:scoreId', (req, res) => scoreboardsController.deleteGroupScore(req, res));
router.delete('/scores/participant/:scoreId', (req, res) => scoreboardsController.deleteParticipantScore(req, res));

export default router;

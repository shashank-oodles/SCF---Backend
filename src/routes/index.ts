import { Router } from 'express';
import { getHealth } from '../controllers/healthController';
import {
  listFilters,
  getFiltersByTitleId,
  resolveFilters,
  createTitleHandler,
  publishTitleHandler,
} from '../controllers/filterController';
import { validateTitleIdParam } from '../middleware/validateTitleId';

const router = Router();

router.get('/health', getHealth);
router.get('/filters', listFilters);
router.post('/filters', createTitleHandler);
router.get('/filters/resolve', resolveFilters);
router.get('/filters/:titleId', validateTitleIdParam, getFiltersByTitleId);
router.put('/filters/:titleId', validateTitleIdParam, publishTitleHandler);

export default router;

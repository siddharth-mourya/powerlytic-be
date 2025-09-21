import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const data = {
    status: 'ok',
    comment: "lastupdate - added cors",
    timestamp: new Date().toISOString(),
  };
  res.json(data);
});

export default router;

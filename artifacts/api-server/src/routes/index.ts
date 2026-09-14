import { Router, type IRouter } from "express";
import healthRouter from "./health";
import familyJobBoardRouter from "./family-job-board";

const router: IRouter = Router();

router.use(healthRouter);
router.use(familyJobBoardRouter);

export default router;

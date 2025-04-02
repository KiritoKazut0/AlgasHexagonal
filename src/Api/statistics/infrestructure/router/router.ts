import { Router } from "express";
import {authMiddleware, getPredictionsController, reportController} from "../Dependencies"
const router =  Router();

router.post('/', getPredictionsController.run.bind(getPredictionsController));
router.post('/report', reportController.run.bind(reportController));

export default router; 


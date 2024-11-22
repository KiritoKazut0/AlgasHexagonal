import { Router } from "express";
import {authMiddleware, getPredictionsController, reportControler} from "../Dependencies"
const router =  Router();

router.post('/', getPredictionsController.run.bind(getPredictionsController));
router.post('/report', reportControler.run.bind(reportControler));

export default router; 


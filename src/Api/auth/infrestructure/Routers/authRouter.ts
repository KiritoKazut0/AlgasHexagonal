import { accessController,findUserForPasswordResetController, addController} from "../Dependencies";
import { Router } from "express";

const authRouter = Router();

authRouter.post('/access', accessController.run.bind(accessController));
authRouter.post('/create', addController.run.bind(addController))
authRouter.post('/recovery', findUserForPasswordResetController.run.bind(findUserForPasswordResetController));


export default authRouter;
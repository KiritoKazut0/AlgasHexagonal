import { Request, Response, NextFunction } from "express";
import TokenService from "../Helpers/TokenService";

export default class AuthMiddleware {
    constructor( readonly tokenService: TokenService) {}

    async run(req: Request, res: Response, next: NextFunction) {
        const token = req.headers['authorization'];
        
        if (!token) return this.errorResponse(res, "No token provided", 401);

        if (!this.tokenService.validateToken(token.replace('Bearer ', ""))) {
            return this.errorResponse(res, "Invalid token", 401);
        }

        next();
    }

    private errorResponse(res: Response, msg: string, status: number) {
        return res.status(status).json({ msg, data: null });
    }
    
}

import TokenService from "../Helpers/TokenService";
import VerifyCodeUseCase from "../../aplication/VeryCodeUseCase";
import { Request, Response } from "express";

export default class VerifyCodeController {
    constructor(
        readonly verifyCodeUseCase: VerifyCodeUseCase,
        readonly tokenService: TokenService) { }

    async run(req: Request, res: Response) {
        try {
    
            const token = req.headers.authorization as string;
            const {code} = req.params;

            console.log(code)

            if (!code) return res.status(400).json({ msg: 'Reset code is required', data: null });


            const id = this.tokenService.getPayload(token);
            if (!id) throw new Error('Failed to load payload');

            const result = await this.verifyCodeUseCase.run(code, id);

            return res.status(result.success ? 200 : 410).json({
                success: result.success,
                msg: result.msg
            })


        } catch (error: unknown) {
            console.error(error);
            if (error instanceof Error) {
                if (error.message === 'TOKEN_PAYLOAD_ERROR') {
                    return res.status(500).json({ msg: 'Failed to process token payload', success: false });
                }
            }

            return res.status(500).json({ msg: 'Internal Server Error', success: false });
        }
        }
    }


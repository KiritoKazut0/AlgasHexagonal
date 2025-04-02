import { Request, Response } from "express";
import AccessUseCase from "../../aplication/AccessUseCase";
import AuthRequest from "../../domain/DTOS/AuthRequest";

export default class AccessController {
    
    constructor(readonly auhtUseCase: AccessUseCase){}

    async run (req: Request, res: Response){
        const {name, password, email}: AuthRequest = req.body;


        if ( !email || !password){
             return res.status(400).json({
                msg: "is required complete fields",
                data: null
            })
        } 

        try {
           const result = await this.auhtUseCase.run({ password,email});
                       
           const response = result
           ? { status: 200, msg: 'Access Successfully', data: result }
           : { status: 404, msg: 'User not found', data: null };
           
           return res.status(response.status).json({
                data: response.data,
                msg: response.msg
           })

        } catch (error) {
            console.log(error)
            return res.status(500).json({
                data: null,
                msg: 'Internal Server Error'
            })    
        }


    }


}
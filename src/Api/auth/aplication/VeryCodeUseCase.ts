import AuthRepository from "../domain/AuthRepository";
import EncriptInterface from "./service/EncriptInterface";
import TokenInterface from "./service/TokenInterface";

export default class VerifyCodeUseCase {
    constructor(
        readonly authRepository: AuthRepository,
        readonly encryptService: EncriptInterface,
        readonly tokenService: TokenInterface
    ) {}

    async run(code: string, idUser: string): Promise <{msg: string, success: boolean}>{

        const user = await this.authRepository.findUserByPk(idUser);
        if (!user) return { msg: 'User not found', success: false };

        const { passwordResetExpires, passwordResetCode } = user;

        if (!passwordResetExpires || !passwordResetCode) {
            return { msg: 'Reset code not found', success: false };
        }

        if (passwordResetExpires.getTime() < Date.now()) {
            return { msg: 'El codigo de verificacion ah expirado', success: false };
        }

        const isCodeValid = await this.encryptService.compare(passwordResetCode, code);
        if (!isCodeValid) {
            return { msg: 'codigo de verificacion no valido', success: false };
        }

        return { msg: 'Code verified successfully', success: true };
    }
}

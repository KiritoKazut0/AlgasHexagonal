import AuthRepository from "../domain/AuthRepository";
import AuthRequest from "../domain/DTOS/AuthRequest";
import AuthResponse from "../domain/DTOS/AuthResponse";
import EncriptInterface from "./service/EncriptInterface";
import TokenInterface from "./service/TokenInterface";

export default class AddUseCase {
    constructor(
        readonly encryptService: EncriptInterface,
        readonly tokenService: TokenInterface,
        readonly authRepository: AuthRepository
    ) { }

    async run(authRequest: AuthRequest): Promise<AuthResponse | null> {

        authRequest.password = await this.encryptService.hash(authRequest.password);
        const result = await this.authRepository.add(authRequest);
        if (!result) return null;

        const response: AuthResponse = {
            userData: {
                id: result.id,
                name: result.name,
                email: result.email,
                rol: result.rol,
            },
            token: this.tokenService.generateToken(result.id)
        }

        return response

    }

}
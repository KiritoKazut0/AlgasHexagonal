import AuthRepository from "../domain/AuthRepository";
import AuthRequest from "../domain/DTOS/AuthRequest";
import AuthResponse from "../domain/DTOS/AuthResponse";
import EncriptInterface from "./service/EncriptInterface";
import TokenInterface from "./service/TokenInterface";

export default class AccessUseCase {
    constructor(
        readonly tokenService: TokenInterface,
        readonly encriptService: EncriptInterface,
        readonly authRepository: AuthRepository
    ) { }

    async run({ email, password }: { email: string, password: string }): Promise<AuthResponse | null> {
        const authFounded = await this.authRepository.findUser(email);
        if (!authFounded) return null;

        const isPasswordValid = await this.encriptService.compare(authFounded.password, password)

        if (!isPasswordValid) return null

        const response: AuthResponse = {
            userData: {
                id: authFounded.id.toString(),
                email: authFounded.email,
                name: authFounded.name,
                rol: authFounded.rol,
            },
            token: this.tokenService.generateToken(authFounded.id)
        }

        return response;

    }
}
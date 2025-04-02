import AuthRequest from "./DTOS/AuthRequest";
import Auth from "./Auth";
import StoragePasswordResetCodeRequest from "./DTOS/StoragePasswordResetCode";

export default interface AuthRepository {
    add(auth: AuthRequest):Promise<Auth | null>
    findUser( email: string): Promise<Auth | null>;
    findUserByPk(id: string): Promise<Auth | null>;
    //restablecimiento de contraseña
    storePasswordResetCode(request: StoragePasswordResetCodeRequest): Promise<void>;
    resetPassword(userId: string, newPassword: string): Promise<void>
    
 
}

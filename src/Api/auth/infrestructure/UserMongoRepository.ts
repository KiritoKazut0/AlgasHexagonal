import AuthRequest from "../domain/DTOS/AuthRequest";
import Auth from "../domain/Auth";
import AuthRepository from "../domain/AuthRepository";
import UserModel from "../../shared/ModelUser";
import StoragePasswordResetCodeRequest from "../domain/DTOS/StoragePasswordResetCode";

export default class UserMongoRepository implements AuthRepository {
    constructor(readonly model: typeof UserModel) { }



    async add(auth: AuthRequest): Promise<Auth | null> {

        try {
            const isExistedUser = await this.findUser(auth.email);
            if (isExistedUser) return null;

            const newUser = await this.model.create({
                name: auth.name,
                email: auth.email,
                password: auth.password,
                rol: 'Administrador'
            });

            return {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                password: newUser.password,
                rol: newUser.rol
            }

        } catch (error) {
            console.error('Error trying to add user to database:', error);
            throw new Error('Error accessing database');
        }


    }

    async storePasswordResetCode(request: StoragePasswordResetCodeRequest): Promise<void> {
        try {

  
           await this.model.updateOne({
                _id: request.userId
            }, {
                passwordResetCode: request.code,
                passwordResetExpires: request.expires
            });

          

        } catch (error) {
            console.error('Error storing password reset code:', error);
            throw new Error('Could not store password reset code');
        }

    }


 async findUser( email: string): Promise<Auth | null> {
        try {

            const userFound = await this.model.findOne({ email });
            if (!userFound) return null;

            return {
                id: userFound.id,
                name: userFound.name,
                email: userFound.email,
                password: userFound.password,
                rol: userFound.rol
            };

        } catch (error) {
            console.error('Error trying to search for user in database:', error);
            throw new Error('Error accessing database');
        }
    }


  async  findUserByPk(id: string): Promise<Auth | null> {
        try {
            
            const user = await this.model.findById(id);
            if (!user) return null;

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                password: user.email,
                rol: user.rol,
                passwordResetCode: user.passwordResetCode,
                passwordResetExpires: user.passwordResetExpires
            }

        } catch (error) {
            console.error('Error trying to search for user in database:', error);
            throw new Error('Error accesing database')
        }
    }

   async resetPassword(userId: string, newPassword: string): Promise<void> {
        try {
            
            await this.model.findByIdAndUpdate(userId, {
                password: newPassword
            });

        } catch (error) {
            console.error('Error trying to search for user in database:', error);
            throw new Error('')
        }
    }

}


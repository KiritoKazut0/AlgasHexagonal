export default interface AuthResponse {
  userData: IuserData;
  token: string;
}
interface IuserData {
  id: string
  name: string;
  email: string;
  rol: 'Administrador' | 'Investigador'
}
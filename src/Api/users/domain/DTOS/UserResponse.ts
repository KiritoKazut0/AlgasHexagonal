
export default interface UserResponse {
    id: string,
    name: string,
    email: string,
    rol: 'Administrador' | 'Investigador'
}
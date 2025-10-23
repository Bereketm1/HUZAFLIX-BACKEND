export interface CreateUserDto {
  email: string;
  password: string;
  roleId?: number;
  name?: string;
}

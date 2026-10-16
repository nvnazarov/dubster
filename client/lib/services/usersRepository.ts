import { User } from "@/lib/models/user";

export default interface UsersRepository {
  find(userID: User["id"]): Promise<User | null>;
};
import UsersRepository from "@/lib/services/usersRepository";
import { User } from "@/lib/models/user";

export default class FakeUsersRepository implements UsersRepository {
  async find(userID: User["id"]): Promise<User | null> {
    return {
      id: userID,
      name: "fakeUser",
    };
  }
};

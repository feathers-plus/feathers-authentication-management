import { User } from "../../src/types"

interface UserTest extends Partial<User> {
  email: string,
  plainPassword?: string,
  plainNewPassword?: string
  newPassword?: string
}

export interface UserTestDB extends UserTest {
  _id: string
}

export interface UserTestLocal extends UserTest {
  id: string
}

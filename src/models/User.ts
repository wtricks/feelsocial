import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export interface IUser extends mongoose.Document {
  username: string;
  email: string;
  password: string;
  friends: mongoose.Types.ObjectId[];
  friendRequests: mongoose.Types.ObjectId[];

  updatedAt: Date;
  createdAt: Date;
}

interface IUserMethods {
  comparePassword(password: string): Promise<boolean>;
}

type UserModel = mongoose.Model<IUser, object, IUserMethods>;

const userSchema = new mongoose.Schema<IUser, UserModel, IUserMethods>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Hash the password before saving the user
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, bcrypt.genSaltSync(10));
  }
  next();
});

/**
 * Compare a given password to the user's stored password
 * @param password The password to compare
 * @returns A promise that resolves to a boolean indicating if the password matches
 */
userSchema.methods.comparePassword = function (password: string) {
  return bcrypt.compare(password, this.password);
};

userSchema.set('toJSON', {
  /**
   * Deletes the password from the user object before it is returned
   * from any of the methods that return the user object, such as
   * {@link User.findOne}, {@link User.find}, {@link User.findByIdAndUpdate},
   * etc.
   *
   * @param _doc - The user document (not used)
   * @param ret - The user object to be returned
   * @returns The user object with the password deleted
   */
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

const User = mongoose.model<IUser, UserModel>('User', userSchema);
export default User;

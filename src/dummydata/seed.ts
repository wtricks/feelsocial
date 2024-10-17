import dotenv from 'dotenv';

import Comment, { IComment } from 'models/Comment';
import Post, { type IPost } from 'models/Post';
import User, { type IUser } from 'models/User';
import mongoose from 'mongoose';

dotenv.config();

async function clearPreviousData(): Promise<void> {
  try {
    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    console.log('Previous data cleared.');
  } catch (err) {
    console.error('Error clearing data:', err);
  }
}

async function createDummyUsers(): Promise<IUser[]> {
  const usersData = [
    { username: 'john_doe', email: 'john@example.com', password: 'password1' },
    {
      username: 'jane_smith',
      email: 'jane@example.com',
      password: 'password2',
    },
    {
      username: 'alice_wonder',
      email: 'alice@example.com',
      password: 'password3',
    },
    {
      username: 'bob_builder',
      email: 'bob@example.com',
      password: 'password4',
    },
    {
      username: 'charlie_pace',
      email: 'charlie@example.com',
      password: 'password5',
    },
    {
      username: 'danny_ocean',
      email: 'danny@example.com',
      password: 'password6',
    },
    { username: 'eva_green', email: 'eva@example.com', password: 'password7' },
    {
      username: 'fred_flint',
      email: 'fred@example.com',
      password: 'password8',
    },
    {
      username: 'george_miller',
      email: 'george@example.com',
      password: 'password9',
    },
    {
      username: 'hannah_abbott',
      email: 'hannah@example.com',
      password: 'password10',
    },
  ];

  const users = await User.insertMany(usersData);
  console.log('Users created:', users);
  return users;
}

async function createDummyPosts(users: IUser[]): Promise<IPost[]> {
  const postData = [
    { content: 'Hello world!', author: users[0]._id },
    { content: 'Excited to be here!', author: users[1]._id },
    { content: 'Loving this platform!', author: users[2]._id },
    { content: 'Working on my new project', author: users[3]._id },
    {
      content: 'Looking for feedback on my recent blog.',
      author: users[4]._id,
    },
    { content: 'Exploring the city today.', author: users[5]._id },
    { content: 'Any good book recommendations?', author: users[6]._id },
    { content: 'Happy Monday everyone!', author: users[7]._id },
    { content: 'Just launched my new website.', author: users[8]._id },
    { content: 'Feeling great!', author: users[9]._id },
  ];

  const posts = await Post.insertMany(postData);
  console.log('Posts created:', posts);

  ///@ts-expect-error TODO: check this
  return posts;
}

async function createDummyComments(
  posts: IPost[],
  users: IUser[]
): Promise<IComment[]> {
  const commentData = [
    { content: 'Nice post!', post: posts[0]._id, author: users[1]._id },
    {
      content: 'Thanks for sharing!',
      post: posts[1]._id,
      author: users[2]._id,
    },
    {
      content: 'Interesting perspective.',
      post: posts[2]._id,
      author: users[3]._id,
    },
    { content: 'I agree with you.', post: posts[3]._id, author: users[4]._id },
    { content: 'Great job!', post: posts[4]._id, author: users[5]._id },
    { content: 'Keep it up!', post: posts[5]._id, author: users[6]._id },
    { content: 'This is so true.', post: posts[6]._id, author: users[7]._id },
    { content: 'Well said!', post: posts[7]._id, author: users[8]._id },
    { content: 'Totally relatable.', post: posts[8]._id, author: users[9]._id },
    { content: 'Awesome content.', post: posts[9]._id, author: users[0]._id },
  ];

  const comments = await Comment.insertMany(commentData);
  console.log('Comments created:', comments);

  ///@ts-expect-error TODO: check this
  return comments;
}

async function createFriendConnections(users: IUser[]): Promise<void> {
  await User.findByIdAndUpdate(users[0]._id, {
    $push: { friends: users[1]._id },
  });
  await User.findByIdAndUpdate(users[1]._id, {
    $push: { friends: users[0]._id },
  });

  await User.findByIdAndUpdate(users[2]._id, {
    $push: { friendRequests: users[3]._id },
  });
  await User.findByIdAndUpdate(users[3]._id, {
    $push: { friends: users[2]._id },
  });

  console.log('Friend connections created');
}

async function seedDatabase(URL: string): Promise<void> {
  try {
    await mongoose.connect(URL);

    // clear data
    await clearPreviousData();

    const users = await createDummyUsers();
    const posts = await createDummyPosts(users);
    await createDummyComments(posts, users);
    await createFriendConnections(users);

    console.log('Database seeding completed.');
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    await mongoose.connection.close();
  }
}

seedDatabase(process.env.MONGO_URL!);

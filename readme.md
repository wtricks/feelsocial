# FeelSocial

FeelSocial is a social media backend API built using **Express**, **MongoDB**, **TypeScript**, and **Mongoose**. It supports user authentication, posting, comments, likes, and friend management. The application is optimized for retrieving posts based on friends, mutual friends, and interactions.

## Table of Contents

- [FeelSocial](#feelsocial)
  - [Demo](#demo)
  - [Features](#features)
  - [Technologies](#technologies)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [API Endpoints](#api-endpoints)
    - [Authentication](#authentication)
    - [Posts](#posts)
    - [Friends](#friends)
    - [Comments](#comments)
  - [License](#license)
 
## Demo

> **LiveURL on Render:** <https://dummy-feelsocial.onrender.com>  
> **For Dummy Users, please check [here](./src/dummydata/seed.ts)**

> *`NOTE:` Render's Server'll be automatically sleeps after inactivity, so for testing perpose use localhost instead of live URL.*

## Features

- User registration and login
- Post creation, deletion, and retrieval
- Like and comment system
- Friend and mutual friend-based feed
- Random posts suggestion from users with many friends and posts
- Input validation using express-validator
- Error handling and optimized response times

## Technologies

- **Node.js** - Backend runtime
- **Express** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **TypeScript** - Type safety and development efficiency
- **Express-Validator** - Input validation
- **ESLint** - Code linting and quality checks

## Installation

To get started with FeelSocial, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/wtricks/feelsocial.git
   cd feelsocial
   ```

2. Install the dependencies:

   ```bash
   pnpm install
   ```

3. Set up your environment variables in a `.env` file (see [Environment Variables](#environment-variables) section).

4. Start the development server:

   ```bash
   pnpm run dev
   ```

5. Seed local database with dummy data.

    ```bash
    # Note: This'll erase previous data from the database.
    pnpm seed
    ```

## Environment Variables

Create a `.env` file in the root directory and add the following variables:

```bash
MONGO_URI=mongodb_url
JWT_SECRET=a_screte_key
PORT=5000
```

## API Endpoints

### Authentication

- **Register**

  - `POST /api/auth/register`
  - Request body:

    ```ts
    {
      username: string,
      email: string,
      password: string
    }
    ```

- **Login**

  - `POST /api/auth/login`
  - Request body:

    ```ts
    {
      email: string;
      password: string;
    }
    ```

### Posts

- **Create Post**

  - `POST /api/posts`
  - Request body:

    ```ts
    {
      content: string;
    }
    ```

- **Get Posts**

  - `GET /api/posts`
  - Query params: `?limit=number&page=number&order=desc|asc&search=string`

- **Update Post**

  - `PUT /api/posts/:postId`
  - Request body:

    ```ts
    {
      content: string;
    }
    ```

- **Like/Unlike Post**

  - `POST /api/posts/:postId/like`

- **Get Users who liked post**

  - `GET /api/posts/:postId/likes`

- **Delete Post**

  - `DELETE /api/posts/:postId`

- **Get Post By ID**
  - `GET /api/posts/:postId`

### Friends

- **Get Suggestions**

  - `GET /api/users/suggestions`
  - Query params: `?limit=number&page=number`

- **Send Friend Request**

  - `POST /api/users/send-request/:userId`

- **Cancel Friend Request**

  - `DELETE /api/users/request/:userId`

- **Accept Friend Request**

  - `POST /api/users/accept-request/:userId`

- **Reject Friend Request**

  - `POST /api/users/reject-request/:userId`

- **Remove Friend**

  - `DELETE /api/users/friend/:userId`

- **Sent Friend Request List**

  - `GET /api/users/sent-requests`
  - Query params: `?limit=number&page=number&search=string&order=asc|desc`

- **Recieved Friend Request List**

  - `GET /api/users/received-requests`
  - Query params: `?limit=number&page=number&search=string&order=asc|desc`

- **Friend List**

  - `GET /api/users/friends`
  - Query params: `?limit=number&page=number&search=string&order=asc|desc`

- **Update Current User**

  - `PUT /api/users/`
  - Request body:

    ```ts
    {
      email?: string
      username?: string
    }
    ```

### Comments

- **Get Comments**

  - `GET /api/comments/:postId`
  - Query Params: `?limit=number&page=number&order=asc|desc`

- **Delete Comment**

  - `DELETE /api/comments/:commentId`

- **Create Comment**

  - `POST /api/comments/:postId`
  - Request Body:

    ```ts
    {
      content: string;
    }
    ```

- **Update Comment**

  - `PUT /api/comments/:commentId`
  - Request body:

    ```ts
    {
      content: string;
    }
    ```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

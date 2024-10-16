# FeelSocial

FeelSocial is a social media backend API built using **Express**, **MongoDB**, **TypeScript**, and **Mongoose**. It supports user authentication, posting, comments, likes, and friend management. The application is optimized for retrieving posts based on friends, mutual friends, and interactions.

## Table of Contents

- [FeelSocial](#feelsocial)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Technologies](#technologies)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [API Endpoints](#api-endpoints)
    - [**Authentication**](#authentication)
    - [Posts](#posts)
    - [Friends](#friends)
    - [Comments](#comments)
  - [License](#license)

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

## Environment Variables

Create a `.env` file in the root directory and add the following variables:

```bash
MONGO_URI=mongodb_url
JWT_SECRET=a_screte_key
PORT=5000
```

## API Endpoints

### **Authentication**

- **Register**

  - `POST /api/auth/register`
  - Request body:

    ```json
    {
      "username": "string",
      "email": "string",
      "password": "string"
    }
    ```

- **Login**

  - `POST /api/auth/login`
  - Request body:

    ```json
    {
      "email": "string",
      "password": "string"
    }
    ```

### Posts

- **Create Post**

  - `POST /api/posts`
  - Request body:

    ```json
    {
      "content": "string"
    }
    ```

- **Get Posts**

  - `GET /api/posts`
  - Query params: `?limit=number&page=number&order=desc|asc&search=string`

- **Like/Unlike Post**

  - `POST /api/posts/:postId/like`

- **Comment on Post**

  - `POST /api/posts/:postId/comment`
  - Request body:

    ```json
    {
      "text": "string"
    }
    ```

### Friends

- **Add Friend**

  - `POST /api/friends/:userId`

- **Remove Friend**
  - `DELETE /api/friends/:userId`

### Comments

- **Get Comments**

  - `GET /api/posts/:postId/comments`

- **Delete Comment**
  - `DELETE /api/comments/:commentId`

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

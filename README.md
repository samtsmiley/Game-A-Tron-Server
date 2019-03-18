# Game-A-Tron Server

## Table of Contents
- [Introduction](#introduction)
- [Tech Stack](#tech-stack)
- [Server Structure](#app-structure)
- [Data Models](#data-models)
  - [User Schema](#user-schema)
  - [Games Schema](#games-schema)
  - [Posts Schema](#posts-schema)
  
- [API Endpoints](#api-endpoints)
  - [Users](#users)
  - [Authentication](#authentication)
  - [Games](#games)
  - [Posts](#posts)
  - [Image Upload](#image-upload)
  - [User Email](#user-email)


## Introduction
Game-A-Tron is a web application that helps people to gamify their lives.

## Tech Stack
Game-A-Tron server is powered by the following,
* Node
* Express
* MongoDB
* Mongoose
* Passport
* BCryptJS
* JSONWebToken
* Moment
* NodeMailer
* Cloudinary
* dotEnv
* Mocha
* Chai

## App Structure
Game-A-Tron follows Node's convention of processing codes from top to bottom and left to right. The most-used routes will be placed at top, followed by lesser-used routes.

Route hierarchy is as follows,
```
Users
Authentication
Games
Posts
Images
Emails
```

Application data is persisted via MongoDB. Document mapping is handled by Mongoose. RESTful API architecture is also used for data creation and retrieval.

## Data Models
Game-A-Tron employs Mongoose document schema to construct its data models: users, games, and posts. 

### User Schema
```
username: {type: String, required: true,unique: true},
  password: {type: String, required: true},
  games: [{type: mongoose.Schema.Types.ObjectId, ref: 'Game'}],
  email: String,
  confirmed: {type: Boolean, default: false}
```

### Game Schema
```
 name: {type: String, required: true, unique: true},
  description: String,
  rules: [{description: {type: String, required: true}}],
  scores: [{description: {type: String, required: true}, points: Number}],
  endScore: {type: Number, default: null},
  posts: [{type: mongoose.Schema.Types.ObjectId, ref: 'Post'}],
  participants: [{userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true}, score: {type: Number, default: 0}}],
  admins: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
```

### Posts Schema
```
  description: {type: String, required: true},
  userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  gameId: {type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true},
  value: Number,
  comment: {type: String, required: false},
  image: {type: String, required: false},
  imageId: {type: String, required: false}
```

## API Endpoints
All requests and responses are in JSON format.

Action | Path |
--- | --- |
Users | https://game-a-tron.herokuapp.com/users |
Authentication | https://game-a-tron.herokuapp.com/auth |
Games | https://game-a-tron.herokuapp.com/games |
Posts | https://game-a-tron.herokuapp.com/posts |
Image upload | https://game-a-tron.herokuapp.com/images |
Email | https://game-a-tron.herokuapp.com/email |


### Users
`POST` request to endpoint `/` is for creating user documents. It accepts the following request body,
```
{
  username,
  password,
  email, // optional
}
```

### Authentication
`POST` to `/login` endpoint for creation of JWT. It accepts the following request body,
```
{
  username,
  password
}
```
This endpoint takes in the username and verifies the password. When validated, the server will respond with a token,
```
{
  authToken
}
```

`POST` to `/refresh` will send back another token with a newer expiriation. No request body is necessary as an existing and valid JWT must be provided to access this endpoint.

### Games
`POST` to `/` will create a game document. It accepts the following request body,
```
{
  name, 
  description, 
  rules, 
  scores, 
  endScore,
}
```

`GET` request to  `/:id` will return an object of a game document belonging to a user, respectively, with `:id` being the games's ID.

`PUT` request to `/join/:id` will adds user to a game document. 


### Posts
`GET` request to `/` will return an array of all posts data belonging to a user.

`POST` request to `/` will create an post document. This will used to populate other responses. It accepts the following request body,
```
{
  description, 
  gameId, 
  value, 
  comment, 
  image, 
  imageId
}
```

### Image Upload
`POST` request to `/upload` will create a post picture by uploading a picture file (chosen by the user) directly into the app's Cloudinary account.

### User Email
`POST` request to `/` will send an email to the user using nodeMailer.  
```

```
`GET` request to `/confirm/:id` will return an message verifing the users account.

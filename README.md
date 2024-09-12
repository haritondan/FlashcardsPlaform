# Online Study Platform

## Project Description

The platform is an online study tool that enables users to securely create, edit, share flashcards and has authentication services.

## Application Suitability Assessment

### Why Microservices are Relevant for the Study Platform:

- **Complexity and Independent Components**: Managing flashcards as a separate microservice simplifies scaling, maintenance, and upgrades, ensuring better performance and flexibility.

- **Scalability**: The Flashcards Microservice scales independently to handle high usage during peak times like exams.

- **Real-time Updates**: WebSockets enable real-time notifications for flashcard updates and changes.

- **Faster Iteration**: Decoupling flashcards allows faster development of new features without impacting the rest of the platform.

### Real-world Examples:

- **Quizlet**: A popular learning platform that provides flashcards as one of its core services, scaling it independently for millions of students worldwide.

## Service Boundaries

![Architecture](./pad-arch.png)

### Define Service Boundaries

- **Authentication Microservice:** Authenticate users and provide access control for different features, including flashcards.
- **Flashcards Microservice:** Allows users to create, edit and delete flashcards.
  Provides subscripton for flashcards updates.

## Technology Stack and Communication Patterns

- **Gateway, Service Discovery, and Load Balancer in Node.js** – Node.js is an event-driven framework well-suited for handling multiple simultaneous requests, making it ideal for the API gateway and load balancing.

- **Authentication and Flashcards Services in Flask** – Flask is a lightweight and flexible framework that works well for building RESTful APIs, making it a good fit for the Authentication and Flashcards Microservices.

- **Authentication and Flashcards Service Databases in PostgreSQL** – Both the Authentication and Flashcards Services require strong data integrity and benefit from a relational structure. PostgreSQL is an excellent choice for handling structured user data, storing flashcards, their relationships, and related metadata, ensuring consistency across both services.

- **Cache in Redis** – Redis is used for caching frequently accessed flashcard sets, providing quick retrieval and reducing the load on the database.

- **Inter-Service Communication in gRPC** – gRPC offers efficient communication with bi-directional streaming, ensuring fast and reliable interactions between the microservices.

- **WebSocket for Asynchronous Communication** – WebSockets enable asynchronous real-time communication, allowing the Flashcards Microservice to send live notifications about updates.

- **User-Service Communication as RESTful APIs** – REST architecture is simple and efficient, allowing users to easily interact with the platform's microservices.

## Data Management Design

### Tables

- **User Model**

  ```json
  {
    "userId": "int",
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```

- **FlashcardSet Model**

  ```json
  {
    "setId": "int",
    "title": "string",
    "subject": "string",
    "creatorId": "int"
  }
  ```

- **Flashcard Model**

  ```json
  {
    "cardId": "int",
    "setId": "int",
    "question": "string",
    "answer": "string"
  }
  ```

## Status Endpoints:

`GET /status` - a common endpoint for both of the microservices to check if the services are running.

**Response:**

- 200 OK

  ```json
  {
    "service": "flashcards",
    "status": "running",
    "timestamp": "timestamp"
  }
  ```

- 500 Server Internal Error

  ```json
  {
    "service": "string",
    "status": "error",
    "timestamp": "timestamp",
    "details": "string"
  }
  ```

## Authentication Service Endpoints:

`POST /api/auth/register` - register a user.

**Request:**

```json
{
  "username": "username",
  "email": "username@gmail.com",
  "password": "pass"
}
```

**Response:**

- 201 Created

  ```json
  {
    "message": "User registered successfully",
    "username": "username"
  }
  ```

- 409 Conflict

  ```json
  {
    "message": "Email already in use."
  }
  ```

- `POST /api/auth/login` - log in a user.

**Request:**

```json
{
  "email": "username@gmail.com",
  "password": "pass"
}
```

**Response:**

- 200 OK

  ```json
  {
    "message": "Login successful",
    "token": "string"
  }
  ```

- 401 Unauthorized

  ```json
  {
    "message": "Invalid email or password"
  }
  ```

- 500 Internal Server Error

  ```json
  {
    "message": "Something went wrong. Please try again later."
  }
  ```

- `PUT /api/auth/{user_id}` - edit a user.

**Header**

```
 Authorization: Bearer \<token>
```

**Request:**

```json
{
  "username": "username",
  "email": "username@gmail.com",
  "password": "pass"
}
```

**Response:**

- 200 OK

  ```json
  {
    "message": "Profile updated successfully"
  }
  ```

- 400 Bad Request

  ```json
  {
    "error": "string",
    "details": "string"
  }
  ```

- 404 User Not Found

  ```json
  {
    "error": "User not found"
  }
  ```

## Flashcards Service Endpoints:

- `GET /api/flashcards` - get a list of sets of flashcards.

**Response:**

- 200 OK

  ```json
  {
    "flashcardSets": [
      {
        "setId": "int",
        "title": "string",
        "subject": "string",
        "creatorId": "int",
        "cards": [
          {
            "cardId": "int",
            "question": "string",
            "answer": "string"
          }
        ]
      }
    ]
  }
  ```

- `GET /api/flashcards/{setId}` - get a set of flashcards

**Response:**

- 200 OK

  ```json
  {
    "setId": "int",
    "title": "string",
    "subject": "string",
    "creatorId": "int",
    "cards": [
      {
        "cardId": "int",
        "question": "string",
        "answer": "string"
      }
    ]
  }
  ```

- 404 Not Found

  ```json
  {
    "error": "Flashcard set not found"
  }
  ```

- `POST /api/flashcards` - post a flashcard.

**Request:**

```json
{
  "title": "string",
  "subject": "string",
  "cards": [
    {
      "question": "string",
      "answer": "string"
    }
  ]
}
```

**Response:**

- 201 Created

  ```json
  {
    "message": "Flashcard set created successfully",
    "title": "string"
  }
  ```

- 400 Bad Request

  ```json
  {
    "error": "string",
    "details": "string"
  }
  ```

- `PUT /api/flashcards/{setId}` - update a flashcard.

**Request:**

```json
{
  "title": "string",
  "subject": "string",
  "cards": [
    {
      "question": "string",
      "answer": "string"
    }
  ]
}
```

**Response:**

- 200 OK

  ```json
  {
    "message": "Flashcard set updated successfully"
  }
  ```

  - 404 Not Found

  ```json
  {
    "error": "Flashcard set not found"
  }
  ```

- `DELETE /api/flashcards/{setId}` - delete a flashcard.

**Response:**

- 200 OK

  ```json
  {
    "message": "Flashcard set deleted successfully"
  }
  ```

- 404 Not Found

  ```json
  {
    "error": "Flashcard set not found"
  }
  ```

## Other Endpoints

`wss://flashcards-service.com/updates` - The user establishes a WebSocket connection to your WebSocket endpoint

### Subscription

**Request:**

```json
{
  "action": "subscribe",
  "topic": "flashcards_updates",
  "flashcard_set_id": 1234
}
```

**Response:**

- 200 OK
  ```json
  {
    "message": "Subscribed to flashcards_updates",
    "flashcard_set_id": 1234
  }
  ```
- 404 Not Found

  ```json
  {
    "error": "Flashcard set not found",
    "flashcard_set_id": 1234
  }
  ```

### Updates

**Server-to-Client Update Message::**

```json
{
  "flashcard_set_id": 1234,
  "action": "added",
  "card_id": 5678,
  "question": "New question text",
  "answer": "New answer text"
}
```

### Unsubscription

**Request:**

```json
{
  "action": "unsubscribe",
  "topic": "flashcards_updates",
  "flashcard_set_id": 1234
}
```

**Response:**

- 200 OK
  ```json
  {
    "message": "Unsubscribed from flashcards_updates",
    "flashcard_set_id": 1234
  }
  ```
- 404 Not Found

  ```json
  {
    "error": "Subscription not found",
    "flashcard_set_id": 1234
  }
  ```

### Deployment & Scaling

**Containerization:**

- Each microservice (Authentication, Flashcards) will be containerized using Docker.
- Docker Compose will manage the network, allowing services to communicate using service names, and creating isolated environments for each service.

**Horizontal Scaling:**

- Horizontal scaling will be used to deploy more instances of the Flashcards service during high usage periods. Each instance will share the load, improving performance and resource usage.

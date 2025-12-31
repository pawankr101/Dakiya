<div align="center">
  <h1>Dakiya</h1>
</div>

## 📖 About the Project

Dakiya is a real-time communication application built with a modern web stack. It facilitates direct, peer-to-peer connections for messaging and data exchange, leveraging WebRTC for low-latency communication and WebSockets for signaling. The project is designed with a clean, modular architecture, making it easy to understand, extend, and maintain.

## ✨ Features

- **Real-time Messaging:** Instantaneous text-based communication.
- **Peer-to-Peer Communication:** Utilizes WebRTC for direct client-to-client connections, ensuring low latency and privacy.
- **Signaling:** Employs a WebSocket-based signaling server to coordinate WebRTC connections.
- **Authentication:** Secure authentication flow using JSON Web Tokens (JWT).
- **Scalable Backend:** The backend is built with Node.js and TypeScript, offering a robust and scalable foundation.
- **Modern Frontend:** A responsive and interactive user interface built with React and TypeScript.

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/)
- [MongoDB](https://www.mongodb.com/)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/dakiya.git
    cd dakiya
    ```

2.  **Install server dependencies:**

    ```bash
    cd server
    npm install
    ```

3.  **Install client dependencies:**

    ```bash
    cd ../client
    npm install
    ```

### Configuration

1.  **Server:**
    -   Create a `.env` file in the `server` directory.
    -   Add the following environment variables:
        ```env
        PORT=3000
        MONGO_URI=mongodb://localhost:27017/dakiya
        JWT_SECRET=your-secret-key
        ```

2.  **Client:**
    -   The client is configured to connect to the server at `http://localhost:3000`. This can be changed in `client/src/config.ts`.

## 🏃‍♀️ Usage

1.  **Start the MongoDB server.**

2.  **Start the backend server:**

    ```bash
    cd server
    npm start
    ```

3.  **Start the client application:**

    ```bash
    cd ../client
    npm start
    ```

4.  Open your browser and navigate to `http://localhost:8080`.

## 🛠️ Technologies Used

### Backend

- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Express.js](https://expressjs.com/) (assumed)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/) (assumed)
- [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) (`ws` library assumed)
- [JSON Web Token](https://jwt.io/)

### Frontend

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [WebRTC](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)

### Tooling

- [Biome](https://biomejs.dev/) for linting and formatting.
- [Vite](https://vitejs.dev/) (assumed for frontend tooling)

## Project Structure

<pre>
/media/pawan/Data/Learning/Coding/Projects/Dakiya/
├───.gitignore
├───biome.json
├───package-lock.json
├───package.json
├───README.md
├───client/
│   ├───client.js
│   ├───package.json
│   ├───tsconfig.json
│   └───src/
│       ├───config.ts
│       ├───index.html
│       ├───index.tsx
│       └───...
└───server/
    ├───server.js
    ├───package.json
    ├───tsconfig.json
    └───src/
        ├───config.ts
        ├───index.ts
        └───...
</pre>

A brief explanation of the directory structure:

-   **`client/`**: Contains the React frontend application.
    -   **`src/`**: The source code of the client application.
    -   **`client.js`**: Build and development script for the client.
-   **`server/`**: Contains the Node.js backend application.
    -   **`src/`**: The source code of the server application.
    -   **`server.js`**: Build and startup script for the server.
-   **`docs/`**: Documentation files.
-   **`biome.json`**: Configuration for the Biome toolchain.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-username/dakiya/issues).

## 📝 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

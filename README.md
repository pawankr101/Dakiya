# Dakiya

Dakiya is a modern, real-time collaboration platform designed for seamless and secure communication. It enables users to connect through one-to-one or group chats, audio/video calls, and file sharing, with a focus on privacy and user control.

The project follows a local-first architectural approach, ensuring that your data is always available on your device, even when you're offline.

## ✨ Features

Dakiya comes packed with a rich set of features for a complete communication experience.

### Core Communication
- **One-to-One & Group Chats:** Real-time text messaging with online status indicators and read receipts.
- **Rich Media Sharing:** Share pictures, audio, videos, documents (PDF, DOCX), and your location.
- **Interactive Tools:** Engage with others using polls and event sharing.
- **Audio/Video Calling:** High-quality, duplex audio and video streams with screen sharing and recording capabilities.
- **Call Management:** Receive call notifications and acknowledgements, with robust handling for disconnections.

### User & Profile Management
- **Flexible Login Options:** Sign in with Email/Username + Password, OTP, or third-party providers (Google, Facebook, LinkedIn, GitHub).
- **Comprehensive Dashboard:** Easily access your chat list, call history, and contacts.
- **Profile Customization:** Manage your profile information, including your name, display picture, and bio.
- **Contact Management:** Organize your contacts by blocking, adding to favorites, or inviting new users.

### Settings & Privacy
- **Account Control:** Full control over your account, privacy, and security settings.
- **Data Management:** Options for data backup and restoration.
- **Custom Notifications:** Configure notification preferences to your liking.

### 🔮 Future Enhancements
- **Group Call Expansion:** Adding more participants to ongoing calls.
- **Smart Suggestions:** AI-powered contact suggestions and speech recognition.
- **Decentralization:** Moving towards a fully decentralized architecture for greater user autonomy.

## 🚀 Tech Stack

Dakiya is built with a modern, robust technology stack to ensure scalability, low latency, and a seamless user experience.

- **Frontend:**
  - **Framework:** React
  - **Styling:** Tailwind CSS
  - **Build Tool:** Esbuild

- **Backend:**
  - **Framework:** Node.js with Fastify
  - **Real-time Communication:** WebSockets (`ws`)

- **Database & Storage:**
  - **Local-First:** WatermelonDB (backed by IndexedDB/SQLite)
  - **Cloud Database:** PostgreSQL
  - **Caching & Real-time:** Redis

- **Tooling:**
  - **Monorepo Management:** npm Workspaces
  - **Linting & Formatting:** BiomeJS
  - **Concurrency:** `concurrently`

## 🏗️ Project Structure

The project is organized as a monorepo with two main packages:

- **`/client`**: Contains the single-page web application built with React.
- **`/server`**: Contains the backend API server built with Node.js and Fastify.

```
/
├── client/         # Frontend React application
│   ├── src/
│   └── client.js   # Build and development script
├── server/         # Backend Node.js server
│   ├── src/
│   └── server.js   # Build and development script
├── docs/           # Design documents and project assets
├── package.json    # Root package configuration and scripts
└── ...
```

## 🏁 Getting Started

To get the Dakiya application running on your local machine, follow these steps.

### Prerequisites

- Node.js (>= v24)
- npm (or your preferred package manager)

### Installation & Setup

1. **Clone the repository:**
   ```sh
   git clone https://github.com/pawankr101/Dakiya.git
   cd Dakiya
   ```

2. **Install dependencies:**
   The project uses npm workspaces, so dependencies for both the client and server will be installed from the root directory.
   ```sh
   npm install
   ```

3. **Set up environment variables:**
   You will need to create `.env` files for the `client` and `server` packages based on the required configuration (e.g., database credentials, API keys).

### Running the Application

- **Start both the client and server in development mode:**
  This command uses `concurrently` to run both applications simultaneously.
  ```sh
  npm start
  ```
  - The client will be accessible at `http://localhost:3000`.
  - The server will run on `http://localhost:8000`.

## 📜 Available Scripts

The following scripts are available in the root `package.json` and can be run with `npm run <script_name>`:

| Script               | Description                                                                  |
| -------------------- | ---------------------------------------------------------------------------- |
| `start`              | Starts both the client and server in development mode.                       |
| `build`              | Builds both the client and server for development.                           |
| `build:prod`         | Builds both the client and server for production.                            |
| `lint`               | Lints the `client` and `server` codebases using BiomeJS.                     |
| `client:start`       | Starts the client development server.                                        |
| `client:build`       | Builds the client application.                                               |
| `server:start`       | Starts the backend server.                                                   |
| `server:build`       | Builds the backend server.                                                   |
| `reinstall`          | Removes `node_modules` and `package-lock.json` and reinstalls dependencies.  |
| `update`             | Checks for and applies dependency updates.                                   |


## 🤝 Contributing

Contributions are welcome! If you have ideas for improvements or want to fix a bug, please open an issue or submit a pull request.

## 📄 License

This project is licensed under the ISC License. See the [LICENSE.md](LICENSE.md) file for details.

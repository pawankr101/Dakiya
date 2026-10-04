# 📬 Dakiya

**Dakiya** is an enterprise-grade, real-time collaboration and communication platform. Engineered with a strict **local-first architecture** and a high-performance **Fastify & NATS JetStream** backend, it ensures seamless, low-latency communication even in unstable network conditions. It goes beyond simple chat by offering advanced group governance, duplex media streaming, robust offline capabilities, and a Bring-Your-Own-Storage (BYOS) model.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)
[![Security Policy](https://img.shields.io/badge/Security-Policy-brightgreen.svg)](SECURITY.md)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D24-339933?logo=nodedotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Fastify](https://img.shields.io/badge/Fastify-5.x-Black?logo=fastify)
![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?logo=typescript)
![NATS](https://img.shields.io/badge/NATS-JetStream-27AE60)

---

## 🏗️ Architecture & Core Philosophy

Dakiya is built on the principles of **Consistency**, **Partition Tolerance**, and **Low Latency** (CAP theorem considerations).

*   **Local-First & BYOS (Bring-Your-Own-Storage):** The application treats the local device (via `op-sqlite`) as the primary data source. UI updates are instantaneous (zero-lag), while a background sync engine handles synchronization using **Hybrid Logical Clocks (HLC)**.
*   **Event-Driven Sync:** Powered entirely by **NATS JetStream** for robust, guaranteed message distribution, delivery queues, and real-time WebSockets delivery.
*   **AOT Schema Validation:** Utilizes TypeBox with custom Ahead-of-Time (AOT) compilation (`@dakiya/schemas`) to ensure zero-overhead runtime validation and absolute parity between the frontend and backend.
*   **Custom Build Orchestration:** Both the client and server avoid standard bundler bloat by utilizing highly optimized, custom Node.js build scripts (`client.js` and `server.js`) powered by `esbuild`.
*   **Custom Threading Model:** The backend leverages a custom-built worker thread pool (`ThreadStack` and `Queue`) for heavy computations without blocking the Fastify event loop.

---

## ✨ Comprehensive Features

### 💬 Messaging & Collaboration
*   **Diverse Conversations:** Support for Direct, Group, Channel, System, and Self-conversations.
*   **Rich Media Sharing:** Share text, pictures, audio, videos, documents (PDF, DOCX), location coordinates, interactive polls, and calendar events.
*   **Message Interactions:** Support for message editing, forwarding, emoji reactions, threaded replies, and message pinning.
*   **Media Center (Calls):** High-quality, duplex audio and video streams with screen sharing (live doodling), call recording capabilities, and robust handling for disconnections.
*   **Group Governance:** Granular role-based access control (Owner, Admin, Member), admin-only messages, invite restrictions, and automated ownership transfer logic built directly into PostgreSQL triggers.

### 🔐 Identity, Profile & Settings
*   **Flexible Login Options:** Sign in with Email/Mobile/Username + Password, OTP, or third-party OAuth providers (Google, Facebook, LinkedIn, GitHub, Microsoft).
*   **Privacy Controls:** Manage visibility settings (Everyone/Contacts/Nobody) for Profile Picture (DP), Last Seen, DOB, and Bio/About. 
*   **Account & Data Management:** Automated backup and restore controls (Daily/Weekly/Monthly, Wi-Fi only options), Two-Factor Authentication (SMS, Email, TOTP), and linked device management.
*   **Custom Notifications:** Configure vibration, sound, popups, and email notifications for individual or group chats with "Mute Until" capabilities.

---

## 🛠️ Technology Stack

| Layer | Technology | Primary Role |
| :--- | :--- | :--- |
| **Frontend** | React 19, Tailwind CSS 4, MUI | SPA Framework, utility-first styling, and accessible UI components. |
| **Backend** | Node.js (v24+), Fastify 5 | High-throughput API and WebSocket server. |
| **Message Broker**| NATS JetStream & NATS KV | Event-driven pub/sub, delivery queues, and high-speed in-memory caching. |
| **Cloud Database**| PostgreSQL (`postgres.js`) | Remote source of truth with complex triggers for data integrity and immutability. |
| **Local Database**| `op-sqlite` | High-performance local-first persistence layer. |
| **Security** | JWT (JWS), Fastify Helmet/CORS | Secure, stateless authentication and strict CSP policies. |
| **Validation** | TypeBox | End-to-end type safety and schema validation. |
| **Tooling** | BiomeJS, TypeScript 7, esbuild | Ultra-fast formatting, linting, strict typing, and custom orchestration. |

---

## 📂 System Architecture & Directory Structure

Dakiya maintains a strict monorepo structure utilizing npm workspaces to decouple business logic, schemas, and utilities.

```bash
Dakiya/
├── client/                 # React 19 Frontend SPA
│   ├── src/
│   │   ├── app/            # Core routing, UI components, and views
│   │   ├── schemas/        # Local schema registry integrations
│   │   ├── storage/        # op-sqlite connection and local queries
│   │   ├── types/          # Frontend-specific TypeScript definitions
│   │   └── workers/        # Web Workers for off-main-thread processing
│   ├── client.js           # Custom esbuild orchestrator for the frontend
│   └── package.json  
├── server/                 # Fastify Backend API
│   ├── src/
│   │   ├── app/            # Application logic, routers, plugins (Swagger, Security)
│   │   ├── schemas/        # AOT Compiled TypeBox schema registry
│   │   ├── servers/        # Dual HTTP/1 & HTTP/2 + WebSocket server wrapper
│   │   ├── services/       # Auth (JWT) and NATS JetStream services
│   │   ├── storage/        # PostgreSQL connection, Cache (NATS KV), and Sync Repos
│   │   └── workers/        # Node.js Worker Threads pool for heavy processing
│   ├── server.js           # Custom esbuild orchestrator for the backend
│   └── package.json
├── packages/               
│   ├── schemas/            # @dakiya/schemas (AOT Compiled TypeBox Validators)
│   │   ├── scripts/        # Custom compiler to generate standalone validators
│   │   └── src/            # Shared Entities (User, Message, Conversation)
│   └── utils/              # @dakiya/utils (High-Performance Custom Utilities)
│       └── src/
│           ├── chrono/     # Time, Date, and Epoch utilities
│           ├── ds/         # Custom Data Structures (LinkedList, Dictionary, Queue, HLC)
│           ├── errors/     # Standardized Exception handling
│           └── guards/     # Advanced Type Guards
├── docs/                   # DB Schemas, Design Specs, and JSON configurations
├── biome.json              # Unified Monorepo Linter/Formatter rules
└── package.json            # Workspace orchestration
```

---

## 📜 Available Workspace Scripts

The root `package.json` acts as the mission control for the monorepo. You can run these commands from the root directory:

| Script | Description |
| :--- | :--- |
| `npm start` | Concurrently starts the client and server development environments. |
| `npm run build` | Builds both the client and server for development. |
| `npm run build:prod` | Executes custom `client.js` and `server.js` production builds with minification and tree-shaking. |
| `npm run lint` | Runs BiomeJS to check formatting and linting across the entire monorepo. |
| `npm run reinstall` | Hard reset: removes `node_modules`, lockfiles, reinstalls, and builds shared packages. |
| `npm run update` | Upgrades all dependencies across workspaces via `npm-check-updates`. |
| `npm run packages:build` | AOT compiles `@dakiya/schemas` and builds `@dakiya/utils`. |

*You can also run specific scoped scripts like `npm run client:start`, `npm run server:build`, or `npm run server:start:process` if you need to manage them individually.*

---

## ⚙️ Getting Started

### Prerequisites
*   **Node.js**: v24.0.0 or higher.
*   **PostgreSQL**: Running instance with a database created.
*   **NATS Server**: Running instance for JetStream and KV Cache.

### Environment Setup
1. Copy the environment template in the server directory (e.g., `.env.example` to `.env.dev`).
2. Update the variables (`DAKIYA_DB_HOST`, `DAKIYA_NATS_HOST`, `DAKIYA_JWT_SECRET`, etc.).

### Installation & Execution
```bash
# 1. Clone the repository
git clone https://github.com/pawankr101/Dakiya.git
cd Dakiya

# 2. Install dependencies and build shared packages
npm run reinstall

# 3. Start the development servers (Frontend & Backend)
npm start
```
*Note: On the first run, the backend will automatically connect to PostgreSQL and initialize all necessary tables, enums, triggers, and indexes.*

---

## 🔮 Future Roadmap

Based on our design documents, Dakiya is actively evolving toward a more intelligent and autonomous collaboration platform:

*   **Smart Suggestions & AI:** Implementing local speech recognition and AI-powered contact/reply suggestions.
*   **Decentralization:** Moving towards a fully decentralized, peer-to-peer architecture for greater user autonomy and reduced server reliance.
*   **Enhanced Group Calls:** Adding support for dynamically inviting and adding more participants to ongoing duplex media streams.

---

## 🛡️ Security Policy

We take the security of Dakiya very seriously. If you discover a security vulnerability, we appreciate your help in disclosing it to us in a responsible manner.

**🚨 Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Review our full [Security Policy](SECURITY.md) for instructions on how to report issues privately.

---

## 🤝 Contributing

Contributions are what make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated. If you have ideas for improvements or want to fix a bug, please open an issue or submit a pull request.

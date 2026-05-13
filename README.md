# 📬 Dakiya

**Dakiya** is an enterprise-grade, real-time collaboration and communication platform. Engineered with a strict **local-first architecture** and a high-performance **Fastify & NATS JetStream** backend, it ensures seamless, low-latency communication even in unstable network conditions. It goes beyond simple chat by offering advanced group governance, duplex media streaming, and robust offline capabilities.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)
[![Security Policy](https://img.shields.io/badge/Security-Policy-brightgreen.svg)](#security-policy)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D24-339933?logo=nodedotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Fastify](https://img.shields.io/badge/Fastify-5.x-Black?logo=fastify)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript)

---

## 🏗️ Architecture & Core Philosophy

Dakiya is built on the principles of **Consistency**, **Partition Tolerance**, and **Low Latency** (CAP theorem considerations). 

*   **Local-First & BYOS (Bring-Your-Own-Storage):** The application treats the local device (IndexedDB/SQLite via WatermelonDB) as the primary data source. UI updates are instantaneous (zero-lag), while a background engine handles synchronization.
*   **Event-Driven Sync:** Powered entirely by **NATS JetStream** for robust, guaranteed message distribution, delivery queues, and real-time WebSockets delivery.
*   **Custom Build Orchestration:** Both the client and server avoid standard bundler bloat by utilizing highly optimized, custom Node.js build scripts (`client.js` and `server.js`) powered by `esbuild`.
*   **Typed Monorepo:** Shared business logic, custom data structures, and schemas are strictly decoupled into a dedicated `@dakiya/shared` package to ensure absolute parity between frontend and backend.

---

## ✨ Comprehensive Features

### 💬 Messaging & Collaboration
*   **One-to-One & Group Chats:** Real-time text messaging with online status indicators and granular read receipts.
*   **Rich Media Sharing:** Share pictures, audio, videos, documents (PDF, DOCX), location coordinates, and interactive polls.
*   **Media Center (Calls):** High-quality, duplex audio and video streams with screen sharing (live doodling), call recording capabilities, and robust handling for disconnections.
*   **Message Interactions:** Support for message editing, forwarding, emoji reactions, and threaded replies.
*   **Group Governance:** Group creation, member management, and specific admin controls (admin-only messages, invite restrictions).

### 🔐 Identity, Profile & Settings
*   **Flexible Login Options:** Sign in with Email/Mobile/Username + Password, OTP, or third-party OAuth providers (Google, Facebook, LinkedIn, GitHub).
*   **Comprehensive Dashboard:** Access chat lists, call history, contacts, and account settings from a unified interface.
*   **Privacy Controls:** Manage visibility settings (Everyone/Contacts/Nobody) for Profile Picture (DP), Last Seen, and Bio/About. Options to block users and manage blocked contacts.
*   **Account & Data Management:** Automated backup and restore controls (Daily/Weekly/Monthly, Wi-Fi only options), Two-Factor Authentication, and linked device management.
*   **Custom Notifications:** Configure vibration, sound, popups, and email notifications for individual or group chats.

---

## 🛠️ Technology Stack

| Layer | Technology | Primary Role |
| :--- | :--- | :--- |
| **Frontend** | React 19, Tailwind CSS 4 | SPA Framework and utility-first styling. |
| **Backend** | Node.js (v24+), Fastify 5 | High-throughput API and WebSocket server. |
| **Message Broker**| NATS JetStream | Event-driven pub/sub, delivery queues, and caching. |
| **Local Database**| WatermelonDB | Offline-first persistence (SQLite/IndexedDB). |
| **Cloud Database**| PostgreSQL | Remote source of truth (via `postgres.js`). |
| **Security** | JWT (JWS) | Secure, stateless authentication. |
| **Tooling** | BiomeJS, TypeScript 6 | Ultra-fast formatting, linting, and strict typing. |
| **Orchestration** | npm Workspaces, esbuild | Monorepo management and rapid compilation. |

---

## 📂 System Architecture & Directory Structure

Dakiya maintains a dual-state database architecture. **Cloud Storage (Postgres)** maintains global uniqueness, delivery queues, and authentication payloads. **Local Storage (WatermelonDB)** stores a fast, serialized profile state, custom user settings, and offline conversation histories.
```bash
Dakiya/
├── client/                 # React 19 Frontend SPA
│   ├── src/
│   │   ├── app/            # Core routing, components, and views
│   │   ├── hooks/          # React custom hooks
│   │   ├── modules/        # Modular UI components
│   │   ├── services/       # API and WebSocket communication
│   │   ├── storage/        # WatermelonDB local schemas and models
│   │   ├── types/          # Frontend-specific TypeScript definitions
│   │   └── utils/          # Helper functions
│   ├── client.js           # Custom esbuild orchestrator
│   └── package.json  
├── server/                 # Fastify Backend API
│   ├── src/
│   │   ├── app/            # Application logic and routers
│   │   ├── models/         # Postgres data models
│   │   ├── servers/        # HTTP and WebSocket server initialization
│   │   ├── services/       # Auth, Media, and NATS JetStream services
│   │   └── storage/        # Cloud database connection logic
│   ├── server.js           # Custom backend build orchestrator
│   └── package.json
├── packages/               
│   └── shared/             # @dakiya/shared (Common Logic)
│       ├── src/
│       │   ├── chrono/     # Time/Date utilities
│       │   ├── ds/         # Custom Data Structures
│       │   ├── errors/     # Standardized error handling
│       │   ├── guards/     # Type guards
│       │   └── types.ts    # Shared TypeScript definitions
│       └── package.json
├── docs/                   # DB Schemas, Design Specs, and JSON configurations
├── biome.json              # Unified Monorepo Linter/Formatter rules
└── package.json            # Workspace orchestration

---

## 📜 Available Workspace Scripts

The root `package.json` acts as the mission control for the monorepo. You can run these commands from the root directory:

| Script | Description |
| :--- | :--- |
| `npm start` | Concurrently starts the client and server development environments. |
| `npm run build` | Builds both the client and server for development. |
| `npm run build:prod` | Executes custom `client.js` and `server.js` production builds. |
| `npm run lint` | Runs BiomeJS to check formatting and linting across the entire monorepo. |
| `npm run reinstall` | Hard reset: removes `node_modules`, lockfiles, reinstalls, and builds shared. |
| `npm run update` | Upgrades all dependencies across workspaces via `npm-check-updates`. |
| `npm run shared:build` | Compiles the `@dakiya/shared` package. |

*You can also run specific scoped scripts like `npm run client:start`, `npm run server:build`, or `npm run server:start:process` if you need to manage them individually.*

---

## 🔮 Future Roadmap

Based on the architectural design documents, Dakiya is actively evolving toward a more intelligent and autonomous collaboration platform:

*   **Group Call Expansion:** Adding support for dynamically inviting and adding more participants to ongoing calls.
*   **Smart Suggestions & AI:** Implementing speech recognition and AI-powered contact suggestions.
*   **Decentralization:** Moving towards a fully decentralized, peer-to-peer architecture for greater user autonomy and reduced server reliance.

---

## 🛡️ Security Policy

We take the security of Dakiya very seriously. If you discover a security vulnerability, we appreciate your help in disclosing it to us in a responsible manner.

**🚨 Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Instead, please report them privately using one of the following methods:

### How to Report
1. **Email:** Send a detailed email to `pawan.akshaykr@gmail.com`.
2. **GitHub Private Vulnerability Reporting:** Navigate to the **Security** tab, click **Advisories**, and then click **Report a vulnerability**.

### Response Process
*   We will acknowledge receipt of your vulnerability report within **48 hours**.
*   We will investigate the issue and send you updates on our progress.
*   Once the vulnerability is patched, we will coordinate with you to publish a security advisory and notify users to update.
*   We ask that you please keep the details of the vulnerability confidential until a fix has been released and announced to protect the users of this project.

*Security updates are generally only applied to the most recent releases (main branch).*

---

## 🤝 Contributing

Contributions are what make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated. If you have ideas for improvements or want to fix a bug, please open an issue or submit a pull request.

# Getting Started Guide

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [BACKEND_SETUP.md](file://BACKEND_SETUP.md)
- [package.json](file://package.json)
- [backend/package.json](file://backend/package.json)
- [app.json](file://app.json)
- [drizzle.config.ts](file://drizzle.config.ts)
- [backend/drizzle.config.ts](file://backend/drizzle.config.ts)
- [eas.json](file://eas.json)
- [tsconfig.json](file://tsconfig.json)
- [shared/schema.ts](file://shared/schema.ts)
- [backend/src/db/schema.ts](file://backend/src/db/schema.ts)
- [backend/src/index.ts](file://backend/src/index.ts)
- [server/index.ts](file://server/index.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Development Server Startup](#development-server-startup)
7. [Testing Options](#testing-options)
8. [Demo Features and Interactive Preview](#demo-features-and-interactive-preview)
9. [Troubleshooting](#troubleshooting)
10. [Conclusion](#conclusion)

## Introduction
This guide walks you through setting up the PHOENIX application locally, including prerequisites, installation, environment configuration, backend database setup, and development server startup. It also covers testing options such as Expo Go, development builds, web preview, and simulator testing, along with demo features and troubleshooting tips.

## Prerequisites
Before you begin, ensure your environment meets the following requirements:
- Node.js 18 or higher installed on your machine
- A physical iOS or Android device for testing with Expo Go
- The Expo Go app installed on your device
- A modern code editor (VS Code recommended)

These prerequisites are required to run the Expo application and interact with the backend API during development.

**Section sources**
- [README.md:124-127](file://README.md#L124-L127)

## Installation
Follow these steps to clone the repository and install dependencies for both the frontend and backend:

1. Clone the repository
   - Use your preferred Git client or command line to clone the repository to your local machine.

2. Navigate to the project directory
   - Change into the project root directory.

3. Install frontend dependencies
   - Run the package manager install command in the project root.

4. Install backend dependencies
   - Change into the backend directory and install its dependencies.

Expected outcome:
- The frontend dependencies are installed in the root project directory.
- The backend dependencies are installed under the backend folder.

Command summary:
- git clone <repository-url>
- cd PHOENIX
- npm install
- cd backend && npm install && cd ..

Note: The frontend and backend scripts and dependencies are defined in the root and backend package.json files.

**Section sources**
- [README.md:129-142](file://README.md#L129-L142)
- [package.json:1-84](file://package.json#L1-L84)
- [backend/package.json:1-46](file://backend/package.json#L1-L46)

## Environment Configuration
Configure the backend environment variables before starting the development server:

1. Copy the environment template to create a .env file in the backend directory.
2. Edit the .env file with your configuration:
   - DATABASE_URL: Your PostgreSQL connection string
   - JWT_SECRET: A strong secret key for JWT signing
   - PORT: Port for the backend server (default 5000)
   - NODE_ENV: Set to development
   - FRONTEND_URL: The URL where your frontend will be served (e.g., http://localhost:8081)

After editing, save the file and proceed to database setup.

Expected outcome:
- The backend .env file exists with the required variables configured.

Command summary:
- cp backend/.env.example backend/.env
- Edit backend/.env with your values

**Section sources**
- [README.md:144-152](file://README.md#L144-L152)
- [BACKEND_SETUP.md:69-83](file://BACKEND_SETUP.md#L69-L83)

## Database Setup
Set up the PostgreSQL database using Drizzle ORM and initialize the schema:

1. Navigate to the backend directory
2. Push the database schema to create tables
3. Generate schema files for development

What gets created:
- Users table
- Loans table
- Loan applications table
- Repayments table
- Notifications table
- Settings table

Command summary:
- cd backend
- npm run db:push
- npm run db:generate

Expected outcome:
- The database is provisioned with the schema defined in the backend database schema file.
- Migration artifacts are generated in the backend drizzle directory.

Notes:
- The frontend Drizzle configuration references a shared schema file for cross-project usage.
- The backend Drizzle configuration loads environment variables from the backend .env file.

**Section sources**
- [README.md:161-174](file://README.md#L161-L174)
- [BACKEND_SETUP.md:85-106](file://BACKEND_SETUP.md#L85-L106)
- [drizzle.config.ts:1-15](file://drizzle.config.ts#L1-L15)
- [backend/drizzle.config.ts:1-14](file://backend/drizzle.config.ts#L1-L14)
- [shared/schema.ts:1-21](file://shared/schema.ts#L1-L21)
- [backend/src/db/schema.ts:1-146](file://backend/src/db/schema.ts#L1-L146)

## Development Server Startup
Start the backend and frontend servers to run the application locally:

Backend server:
- From the backend directory, start the development server.

Frontend server:
- From the project root, start the Expo development server.

Expected outcome:
- The backend server starts on the configured port (default 5000) and exposes health checks and API documentation.
- The frontend server starts and displays a QR code for scanning with the device.

Command summary:
- Terminal 1: cd backend && npm run dev
- Terminal 2: npm start

Additional scripts:
- Root scripts include commands for building, linting, and running the server in different modes.
- Backend scripts include dev, build, start, and database-related commands.

**Section sources**
- [README.md:189-196](file://README.md#L189-L196)
- [backend/src/index.ts:1-76](file://backend/src/index.ts#L1-L76)
- [package.json:5-21](file://package.json#L5-L21)
- [backend/package.json:7-14](file://backend/package.json#L7-L14)

## Testing Options
Choose one of the following testing approaches depending on your needs:

- Expo Go: Scan the QR code shown by the frontend server to run the app on your physical device.
- Development build: Use EAS Build to create a development client with internal distribution.
- Web preview: Access the web version of the app in a browser.
- Simulator: Use iOS Simulator or Android Emulator for device simulation.

Build configuration:
- EAS build configurations are defined for development, preview, and production distributions.

App metadata and plugins:
- The app.json file defines app identity, icons, splash screen, platform-specific settings, and plugin configurations for router, font, web browser, and notifications.

TypeScript configuration:
- tsconfig.json extends Expo’s base TypeScript configuration and sets path aliases for easier imports.

**Section sources**
- [README.md:198-202](file://README.md#L198-L202)
- [eas.json:1-22](file://eas.json#L1-L22)
- [app.json:1-77](file://app.json#L1-L77)
- [tsconfig.json:1-22](file://tsconfig.json#L1-L22)

## Demo Features and Interactive Preview
Try the interactive demo to explore the app quickly:

- Live preview: See the app in action via the development server.
- QR code: Scan the QR code to open the app on your device.
- Hot reload: Changes are reflected instantly during development.
- Web version: Test the app in a browser.

Quick demo setup:
- git clone <repository-url>
- cd PHOENIX
- npm install
- npm start

**Section sources**
- [README.md:97-114](file://README.md#L97-L114)
- [README.md:101-107](file://README.md#L101-L107)

## Troubleshooting
Common setup issues and resolutions:

- Database connection failed:
  - Verify the DATABASE_URL in the backend .env file is correct.
  - Ensure the database is active and reachable.
  - Confirm SSL mode is enabled in the connection string.

- Port already in use:
  - Change the PORT value in the backend .env file.
  - Alternatively, identify and terminate the process using the port.

- CORS errors:
  - Ensure FRONTEND_URL in the backend .env matches the frontend URL.
  - Restart the backend server after updating the .env file.

- Expo server behind proxy:
  - The root package.json includes scripts for running the Expo dev server with proxy environment variables.

- Static build and manifest serving:
  - The Express server serves static Expo manifests and assets for web and development builds.

**Section sources**
- [BACKEND_SETUP.md:172-185](file://BACKEND_SETUP.md#L172-L185)
- [package.json:11-13](file://package.json#L11-L13)
- [server/index.ts:16-53](file://server/index.ts#L16-L53)
- [server/index.ts:163-205](file://server/index.ts#L163-L205)

## Conclusion
You have successfully installed the PHOENIX application, configured the backend environment, initialized the database schema, and started both the frontend and backend servers. You can now test the app using Expo Go, development builds, web preview, or simulators, and explore the demo features. If you encounter issues, refer to the troubleshooting section for quick fixes.
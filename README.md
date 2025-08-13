# react-whiteboard

A collaborative, real-time whiteboard application built with React (Vite), Node.js/Express, and Socket.IO. Users can draw together, chat, create rooms, and export whiteboards as PDFs.

---

## 🚀 Features

- Real-time collaborative drawing
- Multi-page whiteboard with room system
- Live chat between users
- PDF export of all whiteboard pages
- Animated sticky notes (GSAP)
- See other users’ live cursors
- Admin and join request system

---

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Installation

1. **Clone the repo:**
   ```sh
   git clone [https://github.com/JyothikSandeep/react-whiteboard.git](https://github.com/JyothikSandeep/react-whiteboard.git)
   cd react-whiteboard
   ```
2. Install dependencies:
Frontend:
```sh
cd client
npm install
```

Backend:

```sh
cd ../server
npm install
```

Running Locally
Build the frontend:

```sh
cd client
npm run build

```

Start the backend (serves frontend as well):

```sh
cd ../server
npm start

```

Development mode:
You can run npm run dev in /client for hot-reload React development.
The backend runs on /server with npm start.

🌐 Deployment (Azure App Service)
This project is set up for monorepo deployment to Azure App Service using GitHub Actions.

The backend serves the built frontend from /client/dist.

See .github/workflows/ for the deployment pipeline.

Environment variables should be set in the Azure Portal (not in .env files).

Publish Profile Deployment

Download the publish profile from Azure Portal → App Service → Overview → "Get publish profile".

Add it as a GitHub secret named AZUREAPPSERVICE_PUBLISHPROFILE.

Push to main branch to trigger deployment.

⚙️ Configuration

CORS: Configured for local and Azure domains.

Socket.IO: Client connects to the correct backend based on environment.

.env: Used locally, but not uploaded to GitHub or Azure.

🤝 Contributing

Contributions are welcome! Please open issues and pull requests.

📄 License

MIT

🙏 Acknowledgements

React

Vite
Express
Socket.IO
Azure App Service


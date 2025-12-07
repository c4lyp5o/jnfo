# 🚀 JNFO

A high-performance, "birds-eye view" dashboard for your Jellyfin server. Built with **ElysiaJS** and **Svelte 5**, this dashboard provides real-time insights into active streams, library statistics, and user activity without the heavy resource usage of standard monitoring tools.

## ✨ Features

* **⚡ Real-Time Monitoring:** See exactly who is watching what, right now.
* **🎯 Direct Play vs. Transcode:** Instantly spot if a stream is transcoding (orange) or direct playing (green).
* **📊 Library Statistics:** Beautiful, dynamic cards showing your Movie, TV, and Music counts.
* **🎨 Dynamic Backgrounds:** The "Latest Added" media is fetched automatically and used as a cinematic backdrop for stats cards.
* **👥 User Roster:** A complete list of users sorted by last active date.
* **🔐 Secure by Design:** Designed to sit behind a Reverse Proxy (Traefik/Nginx) with Basic Auth. No complex login system to maintain.
* **🚀 Blazing Fast:** Backend powered by ElysiaJS; Frontend by Svelte.

---

## 🛠️ Tech Stack

* **Runtime:** [Bun](https://bun.sh)
* **Backend:** [ElysiaJS](https://elysiajs.com)
* **Frontend:** [Svelte](https://svelte.dev) + [Tailwind CSS](https://tailwindcss.com)

---

## 🔧 Installation & Setup

### Prerequisites
* [Bun](https://bun.sh) installed (`curl -fsSL https://bun.sh/install | bash`)
* A running **Jellyfin** server
* An **API Key** from Jellyfin (Dashboard -> Advanced -> API Keys)

### 1. Clone the Repo
```bash
git clone [https://github.com/yourusername/jellyfin-dashboard.git](https://github.com/c4lyp4o/jnfo.git)
cd jnfo
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory with the following content:
```env
JELLYFIN_URL=http://your-jellyfin-url
JELLYFIN_API_KEY=your-api-key
PORT=5000 # Optional, defaults to 5000
```

### 3. Install Dependencies
```bash
bun install
```

### 4. Development Mode
To start the development for BE and FE with hot-reloading, run:
```bash
bun dev
```

---

## 🐳 Deployment (Docker)
This project is designed to be deployed as a single container serving both the API and the static frontend.

### 1. Build the Docker Image
```bash
docker build -t jnfo:latest .
```
### 2. Run the Container
```bash
docker run -d \
  -e JELLYFIN_URL=http://your-jellyfin-url \
  -e JELLYFIN_API_KEY=your-api-key \
  -e PORT=5000 \ # Optional
  -p 5000:5000 \
  --name jnfo \
  jnfo:latest
```

### 3. Access the Dashboard
Open your browser and navigate to `http://localhost:5000` (or your server's IP and port).

---

🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for the Jellyfin community!
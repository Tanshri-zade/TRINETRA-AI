TRINETRAAI Police Portal - React/Vite

This is a real React conversion: no legacy HTML pages, no iframe, no old page JS dependency.
It uses the COMMON Major Project backend by default:
http://localhost:4000/api/v1

Run:
1. Start your Major Project Backend on port 4000.
2. In this folder: npm install
3. npm run dev

If backend URL changes, copy .env.example to .env and edit VITE_API_BASE_URL.
Before deployment set VITE_API_BASE_URL to your deployed backend API URL.

Routes:
/login
/register
/dashboard
/history
/alerts/:id

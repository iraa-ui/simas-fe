# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

# React FE Starter

Front-end sederhana berbasis **React** (Vite) untuk latihan konsumsi REST API.

## Prasyarat
- Node.js 18+ & npm 9+ (atau pnpm/yarn)
- Git

## Setup Cepat
```bash
# 1) Clone
git clone <repo-url> react-fe-starter
cd react-fe-starter

# 2) Install dependencies
npm install
# atau: pnpm install / yarn

# 3) Jalankan dev server
npm run dev
# Akses: http://localhost:5173
```

## Skrip Penting
```bash
npm run dev       # jalankan di mode development
npm run build     # build production ke folder dist/
npm run preview   # preview hasil build
npm run lint      # (opsional) linting
```

## Konfigurasi .env (contoh)
Buat file `.env` (local) atau `.env.development`:
```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```
Akses variabel via `import.meta.env.VITE_API_BASE_URL`.

## Struktur Folder (ringkas)
```
src/
 ├─ components/
 │   └─ HealthCheck.tsx
 ├─ pages/
 │   └─ Home.tsx
 ├─ services/
 │   └─ api.ts
 ├─ App.tsx
 └─ main.tsx
```

## Contoh Service API (src/services/api.ts)
```ts
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

// Helper fetch sederhana
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(API_BASE + path, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(\`GET \${path} -> \${res.status}\`);
  return res.json() as Promise<T>;
}
```

## Contoh Komponen Cek Kesehatan (src/components/HealthCheck.tsx)
```tsx
import { useEffect, useState } from "react";
import { apiGet } from "../services/api";

type Health = { status: string; time: string };

export default function HealthCheck() {
  const [data, setData] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const h = await apiGet<Health>("/health");
        setData(h);
      } catch (e: any) {
        setError(e.message ?? "Error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>⚠️ {error}</p>;
  return (
    <div>
      <strong>Status:</strong> {data?.status} <br />
      <strong>Time:</strong> {data?.time}
    </div>
  );
}
```

## Contoh Pemakaian di App.tsx
```tsx
import HealthCheck from "./components/HealthCheck";

export default function App() {
  return (
    <main style={{ padding: 16 }}>
      <h1>React FE Starter</h1>
      <p>Contoh konsumsi API dari Laravel BE.</p>
      <HealthCheck />
    </main>
  );
}
```

## Tugas Latihan (untuk junior)
1. Buat halaman `/tasks` untuk menampilkan daftar Task dari endpoint `/tasks`.  
2. Tambah form sederhana untuk **Create Task** (`title`, `is_done`).  
3. Tampilkan notifikasi error/sukses (tanpa lib, cukup state).  
4. Pisahkan UI ke komponen yang kecil & reusable.

## Tips Singkat
- Simpan URL API di `.env` agar mudah pindah environment.  
- Selalu tangani state **loading**, **error**, **empty**.  
- Gunakan TypeScript untuk type-safety (opsional, direkomendasikan).

---

_Selesai. Fokus: setup dasar, service fetch sederhana, dan satu contoh komponen._

=======
>>>>>>> 01534f6 (feat: sync with development)

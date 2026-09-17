# Jobs247 Frontend

Deploy: http://3.1.196.187/
Admin: http://3.1.196.187/admin

Frontend ứng dụng tuyển dụng **Jobs247**.

**Stack:** React 19 · Vite · TypeScript · Redux Toolkit · React Router · i18next · Tailwind · Axios

---

## Yêu cầu

- Node.js **22+**
- npm **10+**

---

## Chạy local

```bash
git clone <repo-url> jobs247_fe
cd jobs247_fe
npm ci
cp .env.example .env
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

### Biến môi trường (`.env`)

| Biến | Ý nghĩa |
|------|---------|
| `VITE_APP_NAME` | Tên app |
| `VITE_APP_URL` | URL frontend |
| `VITE_BASE_PATH` | Base path (thường `/`) |
| `VITE_BACKEND_URL` | URL API backend (để trống nếu chỉ dùng mock) |
| `VITE_USE_MOCK` | `true` = mock / fallback; `false` = gọi API thật |

**Mock nhanh:** giữ như `.env.example` (`VITE_USE_MOCK=true`, `VITE_BACKEND_URL` trống).

**Có backend:** đặt `VITE_BACKEND_URL` và `VITE_USE_MOCK=false`.

### Tài khoản demo (mock)

| Vai trò | Email | Mật khẩu |
|--------|--------|----------|
| Người tìm việc | `user@jobs247.vn` | `user123` |
| Nhà tuyển dụng | `employer@jobs247.vn` | `employer123` |

Đăng nhập tại `/login`. Admin (`/admin/login`) cần backend thật.

---

## Scripts

| Lệnh | Việc |
|------|------|
| `npm run dev` | Dev server (port 3000) |
| `npm run build` | Build → thư mục `out/` |
| `npm run preview` | Xem bản build |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript |

---

## Deploy (tóm tắt)

- Image Docker: build Vite → nginx trong container; compose map `127.0.0.1:3000:80` (khớp nginx host proxy tới `:3000`).
- CI: push `main` → sync `docker-compose.prod.yml` lên `/var/www/jobs247-frontend` → pull/up container.
- Secrets: `VITE_*`, `DOCKERHUB_*`, `EC2_*`. User SSH cần quyền ghi `/var/www/jobs247-frontend` và chạy Docker.

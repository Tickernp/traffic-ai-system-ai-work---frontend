# Deployment checklist

> **Current target:** run the full application on the university VM. Follow [`../backend/VM_DEPLOY.md`](../backend/VM_DEPLOY.md). The Vercel steps below describe the earlier deployment option and are not part of the current VM setup.

This project has two deployable parts: the Next.js frontend in this repository and the FastAPI service in `../backend`.

In this working copy, `frontend` is the only Git repository and it has no remote configured; `backend` is outside that repository. Before hosting, push the frontend repo to a Git provider and create/push a separate backend repo from the `backend` folder. Keep `.env` files, `venv`, and the large MP4 clips out of Git.

## 1. Deploy the API and database

Create a PostgreSQL database with a hosting provider, then run `schema.sql` once against it. Create a Python web service from the backend repository with:

- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variables: `DATABASE_URL`, `API_WRITE_KEY`, `FRONTEND_ORIGINS`, `VIDEO_DIR`, and `YOLO_MODEL_PATH`

Set `FRONTEND_ORIGINS` to the exact deployed frontend origin, such as `https://your-project.vercel.app`. Do not include a trailing slash.

The video playlist is read from `VIDEO_DIR`. Upload the nine MP4 files to persistent storage attached to the API service and point `VIDEO_DIR` to that directory. Do not commit the multi-gigabyte clips or the Python virtual environment. Include `yolov8n.pt` with the backend deployment, or set `YOLO_MODEL_PATH` to a model file available on the service. Persistent storage and enough CPU/RAM for YOLO may require a paid hosting plan.

## 2. Deploy the frontend

Connect this frontend repository to Vercel and set the project root to the repository root (the directory containing `package.json`). Add this environment variable before deploying:

```text
NEXT_PUBLIC_API_URL=https://your-api.example.com
```

The API origin must be HTTPS. Redeploy after changing this value because Next.js exposes `NEXT_PUBLIC_*` variables in the browser bundle.

## 3. Embed in Google Sites

Open the deployed frontend URL directly first. If it loads and its Dashboard, Reports, and Live CCTV pages can reach the API, add it in Google Sites with **Insert → Embed → By URL** (or **Full page embed**), then publish the site. The frontend response headers allow embedding from Google Sites.

## Important deployment notes

- The API currently exposes statistics and report downloads without sign-in. Only deploy it publicly if those records are safe for anyone to view.
- Set a long random `API_WRITE_KEY` on the backend to protect the vehicle log write endpoint. Keep it out of frontend variables and source control.
- YOLO video processing needs sustained CPU/RAM; an always-on service may be needed for a smooth public demo.
- `NEXT_PUBLIC_API_URL` is public by design. Never put database credentials or private API keys in a `NEXT_PUBLIC_*` variable.

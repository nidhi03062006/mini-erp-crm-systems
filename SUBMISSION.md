# Submission Summary

## GitHub repository link
- No Git remote is configured in this workspace.
- To submit a repo link, initialize git and add a remote, for example:
  - `git init`
  - `git add .`
  - `git commit -m "Initial commit"`
  - `git remote add origin <your-repo-url>`

## Live URLs
- Frontend URL: `http://localhost:3000`
- Backend API base URL: `http://localhost:3000/api`

## Test login credentials for all roles
- Admin: `admin@erp.com` / `admin`
- Sales: `sales@erp.com` / `sales`
- Warehouse: `warehouse@erp.com` / `warehouse`
- Accounts: `accounts@erp.com` / `accounts`

## Postman collection / API documentation
- Postman collection file: `Mini_ERP_CRM_Postman_Collection.json`
- README includes API usage, authentication, and example endpoints.

## README with setup and deployment instructions
- Setup instructions are in `README.md`.
- Key commands:
  - `npm install`
  - `npm run dev`
  - `npm run build`
  - `npm start`

## Short architecture explanation
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS.
- Backend: Node.js + Express + TypeScript.
- Database: local JSON file persistence using `db.json` with atomic writes.
- Build: Vite builds frontend assets, `esbuild` bundles `server.ts` to `dist/server.cjs`.
- Runtime: production server serves static frontend assets and backend API under the same host.

## Known limitations / incomplete parts
- Uses a file-based JSON database (`db.json`), not a production relational database.
- No external database configuration or environment-based DB support.
- Default server only binds to port 3000 and does not read a deploy-time `PORT` env variable.
- No production fault tolerance for multi-instance scaling.
- Authentication is seeded and uses a simple HMAC JWT implementation, not OAuth or secure user registration flows.
- The app is not currently deployed to a public URL, only running locally.

# Smart Parking Recommendation App — Team 1 (SC2006)

## Getting Started

1. Clone the repo:

git clone https://github.com/minmonnnn/sc2006.git
cd sc2006

2. Open the **repo root** in VS Code — not a subfolder:

code .

3. Install all dependencies (this is a pnpm workspace — one install covers frontend, backend, and shared-types):

pnpm install

4. Copy the environment file templates and fill in the real values (ask Min for the actual secrets — never commit `.env`):

cp apps/frontend/.env.example apps/frontend/.env
cp apps/backend/.env.example apps/backend/.env

5. **Read `AGENT_PLAYBOOK.md` in full**, then read your own file in `docs/playbook/` — that's where your specific tasks are.

## Tech Stack

React + Vite + TypeScript (frontend) · Node.js + Express + TypeScript (backend) · Supabase (Postgres + Auth) · Google Maps Platform · data.gov.sg / LTA DataMall

## Project Structure

See `AGENT_PLAYBOOK.md` Section 3 for the full monorepo layout.
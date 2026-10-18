# MealBridge

**Good Food. No Waste. Together.**

MealBridge is a surplus-food rescue and redistribution platform connecting food donors, recipient organisations, and volunteers to coordinate safe, traceable food rescue.

## Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma + Supabase
- **Auth:** Supabase Auth
- **Realtime:** Socket.IO

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase and database credentials

# Generate Prisma client
npm run db:generate

# Start development servers
npm run dev
```

## Project Structure

```
mealbridge/
├── apps/
│   ├── web/          # React frontend (port 5173)
│   └── api/          # Express API (port 3001)
├── packages/
│   └── shared/       # Shared types and validation
└── README.md
```

## License

MIT

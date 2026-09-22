# System Architecture

```text
Student
  ↓
React/Vite Frontend
  ↓ HTTPS
Supabase Auth
  ↓
PostgreSQL + RLS
  ├── Incidents
  ├── Counseling
  ├── Suggestions
  └── Audit Logs
  ↓
Private Storage
  ↓
Edge Functions / AI Service
  ↓
Authorized notifications
```

## Recommended stack

- React + TypeScript + Vite
- Supabase
- PostgreSQL
- GitHub Actions
- Vercel or GitHub Pages

## Deployment

GitHub main → CI → Build → Production.

# Auth Testing Playbook

## Test Credentials
- Admin: admin@origami.com / admin123
- Test user: Register via /api/auth/register

## Auth Endpoints
- POST /api/auth/register - Create new account
- POST /api/auth/login - Login with email/password
- GET /api/auth/me - Get current user (requires Bearer token)
- PUT /api/auth/profile - Update skill level/name

## Testing Steps
1. Register: `curl -X POST http://localhost:8001/api/auth/register -H "Content-Type: application/json" -d '{"name":"Test","email":"test@test.com","password":"test123"}'`
2. Login: `curl -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@origami.com","password":"admin123"}'`
3. Get user: `curl -H "Authorization: Bearer <token>" http://localhost:8001/api/auth/me`

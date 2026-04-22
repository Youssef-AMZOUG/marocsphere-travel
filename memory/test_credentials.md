# MarocSphere Test Credentials

## Admin User
- Email: `phase1test@example.com`
- Password: `password123`
- Role: admin
- Note: This is NOT a partner account — /api/partners/stats returns 403 (correct behavior)

## Test Flow Notes
- Forgot Password: Use the /auth/forgot-password page. In demo mode, the reset token is returned directly and a clickable link is shown.
- Partner Dashboard: Requires a partner account. Non-partner users are redirected to /partner/register.

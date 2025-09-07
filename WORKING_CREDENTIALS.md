# Working Login Credentials

## Admin Account

- **Email**: admin@test.com
- **Password**: Password123!
- **Role**: ADMIN
- **Verified**: Yes

## Researcher Account

- **Email**: researcher@test.com
- **Password**: TestPassword123!
- **Role**: RESEARCHER
- **Verified**: Yes

## Demo Account

- **Email**: demo@vqmethod.com
- **Password**: (needs to be reset)
- **Role**: RESEARCHER
- **Verified**: Yes

## Participant Account

- **Email**: participant@test.com
- **Password**: (needs to be reset)
- **Role**: PARTICIPANT
- **Verified**: Yes

---

**Note**: The admin password has been reset to `Password123!` on 2025-09-06.

To reset any other password, use the script:

```bash
cd backend && npx tsx prisma/reset-admin-password.ts
```

(Modify the email and password in the script as needed)

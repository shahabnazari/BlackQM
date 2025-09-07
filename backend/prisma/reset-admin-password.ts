import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  const email = 'admin@test.com';
  const newPassword = 'Password123!';

  console.log(`🔐 Resetting password for ${email}...`);

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update the user's password
  const user = await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  console.log(`✅ Password reset successfully for ${user.email}`);
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 New Password: ${newPassword}`);
  console.log(`\nYou can now login with these credentials.`);
}

resetAdminPassword()
  .catch((e) => {
    console.error('❌ Error resetting password:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

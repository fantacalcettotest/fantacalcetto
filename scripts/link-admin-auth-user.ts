import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_DEMO_EMAIL = "admin.demo@fantacalcetto.test";

function readSupabaseAuthUserId() {
  const cliArg = process.argv[2]?.trim();
  const envValue = process.env.SUPABASE_AUTH_USER_ID?.trim();
  const value = cliArg || envValue;

  if (!value) {
    throw new Error(
      "Supabase Auth user id mancante. Passalo come primo argomento CLI o come variabile SUPABASE_AUTH_USER_ID."
    );
  }

  return value;
}

async function main() {
  const authUserId = readSupabaseAuthUserId();

  const adminUser = await prisma.user.findUnique({
    where: {
      email: ADMIN_DEMO_EMAIL
    },
    select: {
      authUserId: true,
      email: true,
      id: true,
      role: true
    }
  });

  if (!adminUser) {
    throw new Error(`Utente admin demo ${ADMIN_DEMO_EMAIL} non trovato.`);
  }

  if (adminUser.role !== UserRole.ADMIN) {
    throw new Error(`L'utente ${ADMIN_DEMO_EMAIL} non ha ruolo ADMIN.`);
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: adminUser.id
    },
    data: {
      authUserId
    },
    select: {
      authUserId: true,
      email: true,
      id: true
    }
  });

  console.log("Collegamento auth completato.");
  console.log(`User app id: ${updatedUser.id}`);
  console.log(`Email app: ${updatedUser.email}`);
  console.log(`Supabase auth user id: ${updatedUser.authUserId}`);
}

main()
  .catch((error) => {
    console.error("Link admin auth fallito:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

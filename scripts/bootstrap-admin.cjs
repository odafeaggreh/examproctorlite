// const { loadEnvConfig } = require("@next/env");
// const { initializeApp, cert, getApps } = require("firebase-admin/app");
// const { getAuth } = require("firebase-admin/auth");
// const { getFirestore } = require("firebase-admin/firestore");
// const { z } = require("zod");

// loadEnvConfig(process.cwd());

// const argsSchema = z.object({
//   email: z.string().email("A valid email is required"),
//   password: z
//     .string()
//     .min(6, "Password must be at least 6 characters long")
//     .optional(),
//   name: z.string().min(1).optional(),
//   role: z.enum(["admin", "superAdmin"]).default("admin"),
// });

// function parseArgs(argv) {
//   const parsed = {};

//   for (let index = 0; index < argv.length; index += 1) {
//     const current = argv[index];

//     if (!current.startsWith("--")) {
//       continue;
//     }

//     const key = current.slice(2);
//     const next = argv[index + 1];

//     if (!next || next.startsWith("--")) {
//       parsed[key] = "true";
//       continue;
//     }

//     parsed[key] = next;
//     index += 1;
//   }

//   return argsSchema.parse(parsed);
// }

// function getAdminApp() {
//   if (getApps().length > 0) {
//     return getApps()[0];
//   }

//   const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
//   const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
//     ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
//     : undefined;
//   const projectId =
//     process.env.FIREBASE_ADMIN_PROJECT_ID ||
//     process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

//   if (!clientEmail || !privateKey || !projectId) {
//     throw new Error(
//       "Missing Firebase Admin credentials. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in .env.local."
//     );
//   }

//   const credential = cert({
//     clientEmail,
//     privateKey,
//     projectId,
//   });

//   return initializeApp({
//     credential,
//     projectId,
//   });
// }


// async function upsertAdminUser({ email, password, name, role }) {
//   const app = getAdminApp();
//   const auth = getAuth(app);
//   const db = getFirestore(app);

//   let userRecord;
//   let wasCreated = false;

//   try {
//     userRecord = await auth.getUserByEmail(email);
//   } catch (error) {
//     if (error.code !== "auth/user-not-found") {
//       throw error;
//     }

//     if (!password) {
//       throw new Error(
//         "User does not exist yet. Pass --password to create the account."
//       );
//     }

//     userRecord = await auth.createUser({
//       email,
//       password,
//       displayName: name,
//       emailVerified: true,
//     });
//     wasCreated = true;
//   }

//   if (!wasCreated && (name || password)) {
//     const updatePayload = {};

//     if (name) {
//       updatePayload.displayName = name;
//     }

//     if (password) {
//       updatePayload.password = password;
//     }

//     if (Object.keys(updatePayload).length > 0) {
//       userRecord = await auth.updateUser(userRecord.uid, updatePayload);
//     }
//   }

//   const claims = {
//     role,
//     admin: true,
//     superAdmin: role === "superAdmin",
//   };

//   await auth.setCustomUserClaims(userRecord.uid, claims);

//   await db.collection("users").doc(userRecord.uid).set(
//     {
//       uid: userRecord.uid,
//       name: name || userRecord.displayName || "",
//       email: userRecord.email || email,
//       role,
//       status: "active",
//       ...(wasCreated && { createdAt: new Date().toISOString() }),
//       updatedAt: new Date().toISOString(),
//     },
//     { merge: true }
//   );

//   return {
//     uid: userRecord.uid,
//     email: userRecord.email || email,
//     role,
//     wasCreated,
//   };
// }

// async function main() {
//   try {
//     const args = parseArgs(process.argv.slice(2));
//     const result = await upsertAdminUser(args);

//     process.stdout.write(
//       [
//         "",
//         "Admin bootstrap complete.",
//         `Email: ${result.email}`,
//         `UID: ${result.uid}`,
//         `Role: ${result.role}`,
//         `Action: ${result.wasCreated ? "created and promoted" : "promoted/updated"}`,
//         "",
//         "If this user is already signed in anywhere, sign out and sign back in",
//         "so Firebase refreshes the custom claims into the next session cookie.",
//         "",
//       ].join("\n")
//     );
//   } catch (error) {
//     const message =
//       error instanceof z.ZodError
//         ? error.issues.map((issue) => issue.message).join("; ")
//         : error instanceof Error
//         ? error.message
//         : "Unknown error";

//     process.stderr.write(`\nAdmin bootstrap failed: ${message}\n\n`);
//     process.stderr.write(
//       "Usage:\n" +
//         "npm run admin:bootstrap -- --email you@example.com --password Secret123 --name \"Your Name\" --role superAdmin\n\n" +
//         "Notes:\n" +
//         "- --password is required only when creating a new user.\n" +
//         "- --role accepts admin or superAdmin.\n\n"
//     );
//     process.exitCode = 1;
//   }
// }

// main();

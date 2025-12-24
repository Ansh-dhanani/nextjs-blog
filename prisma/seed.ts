require('dotenv').config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Ensure .env contains DATABASE_URL and that dotenv is loaded.");
  process.exit(1);
}

// Small diagnostic: print masked DATABASE_URL so you can verify the host/user (password is hidden)
function maskDbUrl(url: string) {
  try {
    return url.replace(/:(.*)@/, ":*****@");
  } catch (err) {
    return "DATABASE_URL (masked)";
  }
}

// Parse the DATABASE_URL and print helpful diagnostics (do NOT print the raw password)
try {
  const raw = process.env.DATABASE_URL!;
  const parsed = new URL(raw);
  const maskedUser = parsed.username ? parsed.username.replace(/.(?=.{1,2}$)/g, "*") : "<no-user>";
  const hasPassword = !!parsed.password;
  const dbName = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname.replace(/^\//, "") : null;
  console.log("Using DATABASE_URL:", maskDbUrl(raw));
  console.log(`DB host: ${parsed.host}, user: ${maskedUser}, password: ${hasPassword ? "present" : "missing"}, database: ${dbName ?? "<not-specified>"}`);

  if (!dbName) {
    console.error("Hint: Your DATABASE_URL does not include a database name. Add it as the path segment: mongodb+srv://<user>:<password>@cluster0.mongodb.net/<database>?...");
  }
  if (!hasPassword) {
    console.error("Hint: No password detected in DATABASE_URL; ensure credentials are included or set via env vars.");
  }
} catch (err: any) {
  console.error("Could not parse DATABASE_URL:", err?.message || err);
  console.log("Using DATABASE_URL (masked):", maskDbUrl(process.env.DATABASE_URL!));
  console.error("Hint: Use a connection string like: mongodb+srv://<user>:<password>@cluster0.mongodb.net/<database>?retryWrites=true&w=majority");
}


const prisma = new PrismaClient();

console.log("Prisma client created");

async function main() {
  console.log("Start seeding...");

  // Connect to database
  await prisma.$connect();
  console.log("Connected to database");

  // Skip cleanup to avoid foreign key constraint issues
  // If you need to reset the database, run: npx prisma migrate reset
  console.log("Starting seeding (skipping cleanup)...");

  // Create users
  const pass = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.create({
    data: {
      name: "Alice",
      username: "alice",
      email: "alice@example.com",
      password: pass,
      avatar: null,
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: "Bob",
      username: "bob",
      email: "bob@example.com",
      password: pass,
      avatar: null,
    },
  });

  // Create dynamic posts (no hardcoded tags)
  const sampleSentenceWords = [
    "react",
    "next",
    "prisma",
    "mongodb",
    "tailwind",
    "typescript",
    "testing",
    "performance",
    "seo",
    "accessibility",
    "cloudinary",
    "serverless",
    "edge",
    "caching",
    "graphql",
    "rest",
    "deployment",
    "hooks",
    "components",
    "api",
  ];

  const random = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  const posts: Array<{ id?: string; title: string; path: string; content: any; authorId: string } > = [];

  // Generate 12 posts with semi-random titles & content
  for (let i = 0; i < 12; i++) {
    const w1 = random(sampleSentenceWords);
    const w2 = random(sampleSentenceWords);
    const w3 = random(sampleSentenceWords);
    const title = `${w1.charAt(0).toUpperCase() + w1.slice(1)} & ${w2.charAt(0).toUpperCase() + w2.slice(1)}: Tips ${i + 1}`;
    const path = `${w1}-${w2}-${i + 1}`.toLowerCase();
    const contentText = `In this article we discuss ${w1}, ${w2} and ${w3}. It covers best practices, performance tips and examples.`;

    const created = await prisma.post.create({
      data: {
        title,
        path,
        content: { ops: [{ insert: contentText }] },
        authorId: i % 2 === 0 ? alice.id : bob.id,
        type: "PUBLISHED",
      },
    });

    posts.push({ id: created.id, title, path, content: { ops: [{ insert: contentText }] }, authorId: created.authorId });
  }

  // Now generate tags dynamically from post content (extract candidate words)
  const stopwords = new Set(["the", "and", "for", "with", "that", "this", "are", "is", "in", "to", "of", "on", "a", "it", "we"]);
  const wordCount: Record<string, number> = {};

  for (const p of posts) {
    const text = `${p.title} ${p.content.ops.map((o: any) => o.insert).join(" ")}`;
    const words = text
      .replace(/[.,:&\/#!$%\^&\*;:{}=\-_`~()]/g, " ")
      .split(/\s+/)
      .map((w) => w.toLowerCase())
      .filter((w) => w.length > 2 && !stopwords.has(w));

    for (const w of words) wordCount[w] = (wordCount[w] || 0) + 1;
  }

  // Pick top 10 frequent words as tags
  const candidates = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map((t) => t[0]);

  const createdTags: Array<{ id: string; label: string; value: string }> = [];

  for (const val of candidates) {
    const label = val.charAt(0).toUpperCase() + val.slice(1);
    const value = val.replace(/\s+/g, "-").toLowerCase();
    const color = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`;
    const tag = await prisma.tag.create({ data: { label, value, description: `${label} related posts`, color } });
    createdTags.push({ id: tag.id, label: tag.label, value: tag.value });
  }

  // Attach tags to posts: find tags that match words in post content, otherwise assign random tags
  for (const p of posts) {
    const text = `${p.title} ${p.content.ops.map((o: any) => o.insert).join(" ")}`.toLowerCase();
    const matching = createdTags.filter((t) => text.includes(t.value));
    const toConnect = new Set<string>();
    if (matching.length > 0) matching.slice(0, 3).forEach((m) => toConnect.add(m.id));
    while (toConnect.size < 2 && createdTags.length > 0) {
      toConnect.add(random(createdTags).id);
    }

    await prisma.post.update({ where: { id: p.id! }, data: { tags: { connect: Array.from(toConnect).map((id) => ({ id })) } } });
  }

  // Saved posts
  await prisma.savedPost.create({ data: { userId: alice.id, postId: posts[1].id! } });

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

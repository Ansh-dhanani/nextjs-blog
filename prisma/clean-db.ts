import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting database cleanup...');

  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database');

    // Delete records in reverse dependency order to avoid constraint violations
    await prisma.$transaction(async (tx) => {
      // 1. Delete dependent records first
      console.log('🗑️  Deleting comment likes...');
      await tx.commentLike.deleteMany({});

      console.log('🗑️  Deleting post likes...');
      await tx.postLike.deleteMany({});

      console.log('🗑️  Deleting notifications...');
      await tx.notification.deleteMany({});

      console.log('🗑️  Deleting saved posts...');
      await tx.savedPost.deleteMany({});

      // 2. Handle comments (self-referencing relationship)
      // Delete replies first (comments with parentId), then top-level comments
      console.log('🗑️  Deleting comment replies...');
      await tx.comment.deleteMany({
        where: { parentId: { not: null } }
      });

      console.log('🗑️  Deleting top-level comments...');
      await tx.comment.deleteMany({
        where: { parentId: null }
      });

      // 3. Delete posts (after comments are gone)
      console.log('🗑️  Deleting posts...');
      await tx.post.deleteMany({});

      // 4. Delete users (after posts and related data are gone)
      console.log('🗑️  Deleting users...');
      await tx.user.deleteMany({});

      // 5. Delete tags (after users and posts are gone)
      console.log('🗑️  Deleting tags...');
      await tx.tag.deleteMany({});
    });

    console.log('🎉 Database cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Disconnected from database');
  });

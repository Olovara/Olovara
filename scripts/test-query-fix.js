const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testQueryFix() {
  try {
    console.log('=== TESTING DIFFERENT QUERY APPROACHES ===\n');

    const sellerUserId = '681b66e63eedae13b466a941';

    // Test 1: Original failing query
    console.log('Test 1: Original failing query');
    const originalQuery = {
      AND: [
        { status: "ACTIVE" },
        {
          seller: {
            user: {
              status: "ACTIVE"
            }
          }
        }
      ]
    };

    const originalResults = await prisma.product.findMany({
      where: originalQuery,
      select: {
        id: true,
        name: true,
        isTestProduct: true
      }
    });

    console.log(`Original query results: ${originalResults.length}`);
    originalResults.forEach(p => console.log(`- ${p.name} (test: ${p.isTestProduct})`));

    // Test 2: Query with explicit include
    console.log('\nTest 2: Query with explicit include');
    const includeResults = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: {
        seller: {
          include: {
            user: true
          }
        }
      }
    });

    const activeSellers = includeResults.filter(p => 
      p.seller && p.seller.user && p.seller.user.status === "ACTIVE"
    );
    
    console.log(`Include query results: ${includeResults.length}`);
    console.log(`Products with active sellers: ${activeSellers.length}`);
    const testProductsWithActiveSellers = activeSellers.filter(p => p.isTestProduct);
    console.log(`Test products with active sellers: ${testProductsWithActiveSellers.length}`);
    testProductsWithActiveSellers.forEach(p => console.log(`- ${p.name}`));

    // Test 3: Query using userId directly
    console.log('\nTest 3: Query using userId directly');
    const directResults = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        userId: sellerUserId
      },
      select: {
        id: true,
        name: true,
        isTestProduct: true,
        userId: true
      }
    });

    console.log(`Direct userId query results: ${directResults.length}`);
    directResults.forEach(p => console.log(`- ${p.name} (test: ${p.isTestProduct})`));

    // Test 4: Query with seller existence check
    console.log('\nTest 4: Query with seller existence check');
    const sellerExistsResults = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        seller: {
          isNot: null
        }
      },
      include: {
        seller: {
          include: {
            user: true
          }
        }
      }
    });

    const activeSellerResults = sellerExistsResults.filter(p => 
      p.seller && p.seller.user && p.seller.user.status === "ACTIVE"
    );

    console.log(`Seller exists query results: ${sellerExistsResults.length}`);
    console.log(`Products with active sellers: ${activeSellerResults.length}`);
    const testProductsActiveSellers = activeSellerResults.filter(p => p.isTestProduct);
    console.log(`Test products with active sellers: ${testProductsActiveSellers.length}`);
    testProductsActiveSellers.forEach(p => console.log(`- ${p.name}`));

    // Test 5: Alternative approach - query by seller userId
    console.log('\nTest 5: Query by seller userId');
    const sellerUserIdResults = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        seller: {
          userId: sellerUserId
        }
      },
      select: {
        id: true,
        name: true,
        isTestProduct: true
      }
    });

    console.log(`Seller userId query results: ${sellerUserIdResults.length}`);
    sellerUserIdResults.forEach(p => console.log(`- ${p.name} (test: ${p.isTestProduct})`));

    // Test 6: Check if the user is actually active
    console.log('\nTest 6: Verify user status');
    const user = await prisma.user.findUnique({
      where: { id: sellerUserId },
      select: {
        id: true,
        email: true,
        status: true,
        role: true
      }
    });

    console.log('User details:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Status: ${user.status}`);
    console.log(`- Role: ${user.role}`);

    // Test 7: Check seller relationship
    console.log('\nTest 7: Check seller relationship');
    const seller = await prisma.seller.findUnique({
      where: { userId: sellerUserId },
      include: {
        user: true
      }
    });

    console.log('Seller details:');
    console.log(`- Seller ID: ${seller.id}`);
    console.log(`- Seller userId: ${seller.userId}`);
    console.log(`- User ID: ${seller.user.id}`);
    console.log(`- User status: ${seller.user.status}`);

  } catch (error) {
    console.error('Error testing queries:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQueryFix(); 
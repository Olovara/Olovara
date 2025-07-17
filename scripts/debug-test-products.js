const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugTestProducts() {
  try {
    console.log('=== DEBUGGING TEST PRODUCTS ===\n');

    // 1. Check all products with isTestProduct flag
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        isTestProduct: true,
        seller: {
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                role: true,
                status: true,
                canAccessTestEnvironment: true,
                admin: {
                  select: {
                    role: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log('All products:');
    allProducts.forEach(product => {
      console.log(`- ${product.name} (ID: ${product.id})`);
      console.log(`  Status: ${product.status}`);
      console.log(`  isTestProduct: ${product.isTestProduct}`);
      console.log(`  Seller: ${product.seller?.userId || 'No seller'}`);
      console.log(`  Seller Role: ${product.seller?.user?.role || 'No role'}`);
      console.log(`  Seller Status: ${product.seller?.user?.status || 'No status'}`);
      console.log(`  Seller Test Access: ${product.seller?.user?.canAccessTestEnvironment || false}`);
      console.log(`  Seller Admin Role: ${product.seller?.user?.admin?.role || 'No admin role'}`);
      console.log('');
    });

    // 2. Check specifically for test products
    const testProducts = allProducts.filter(p => p.isTestProduct);
    console.log(`\nTest products found: ${testProducts.length}`);
    testProducts.forEach(product => {
      console.log(`- ${product.name} (ID: ${product.id})`);
    });

    // 3. Check active test products
    const activeTestProducts = testProducts.filter(p => p.status === 'ACTIVE');
    console.log(`\nActive test products: ${activeTestProducts.length}`);
    activeTestProducts.forEach(product => {
      console.log(`- ${product.name} (ID: ${product.id})`);
    });

    // 4. Check super admin users
    const superAdmins = await prisma.user.findMany({
      where: {
        role: 'SUPER_ADMIN'
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        canAccessTestEnvironment: true
      }
    });

    console.log(`\nSuper admin users: ${superAdmins.length}`);
    superAdmins.forEach(admin => {
      console.log(`- ${admin.email} (ID: ${admin.id})`);
      console.log(`  Role: ${admin.role}`);
      console.log(`  Status: ${admin.status}`);
      console.log(`  Test Access: ${admin.canAccessTestEnvironment}`);
    });

    // 5. Simulate the filtering logic
    if (superAdmins.length > 0) {
      const testAdmin = superAdmins[0];
      console.log(`\n=== SIMULATING FILTERING FOR SUPER ADMIN: ${testAdmin.email} ===`);
      
      // Simulate the where clause that would be created
      const whereClause = {
        AND: [
          { status: "ACTIVE" },
          // Test product filtering - should be empty array for super admin
          [], // This is what should happen when canAccessTest is true
          {
            seller: {
              user: {
                status: "ACTIVE"
              }
            }
          }
        ]
      };

      console.log('Where clause for super admin:', JSON.stringify(whereClause, null, 2));

      // Test the actual query
      const productsForAdmin = await prisma.product.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          status: true,
          isTestProduct: true
        }
      });

      console.log(`\nProducts visible to super admin: ${productsForAdmin.length}`);
      const testProductsForAdmin = productsForAdmin.filter(p => p.isTestProduct);
      console.log(`Test products visible to super admin: ${testProductsForAdmin.length}`);
      testProductsForAdmin.forEach(product => {
        console.log(`- ${product.name} (ID: ${product.id})`);
      });
    }

  } catch (error) {
    console.error('Error debugging test products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTestProducts(); 
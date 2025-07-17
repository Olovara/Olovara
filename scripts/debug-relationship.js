const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugRelationship() {
  try {
    console.log('=== DEBUGGING PRODUCT-SELLER RELATIONSHIP ===\n');

    const sellerUserId = '681b66e63eedae13b466a941';

    // 1. Get the test product with full seller relationship
    const testProduct = await prisma.product.findFirst({
      where: { isTestProduct: true },
      include: {
        seller: {
          include: {
            user: true
          }
        }
      }
    });

    console.log('Test Product Details:');
    if (testProduct) {
      console.log(`- Product ID: ${testProduct.id}`);
      console.log(`- Product Name: ${testProduct.name}`);
      console.log(`- Product userId: ${testProduct.userId}`);
      console.log(`- Product Status: ${testProduct.status}`);
      console.log(`- isTestProduct: ${testProduct.isTestProduct}`);
      console.log(`- Seller exists: ${!!testProduct.seller}`);
      
      if (testProduct.seller) {
        console.log(`- Seller userId: ${testProduct.seller.userId}`);
        console.log(`- Seller shopName: ${testProduct.seller.shopName}`);
        console.log(`- Seller user ID: ${testProduct.seller.user.id}`);
        console.log(`- Seller user status: ${testProduct.seller.user.status}`);
        console.log(`- Seller user role: ${testProduct.seller.user.role}`);
      }
    } else {
      console.log('❌ No test product found!');
      return;
    }

    // 2. Check if there's a mismatch
    if (testProduct.userId !== testProduct.seller?.userId) {
      console.log('\n❌ MISMATCH DETECTED!');
      console.log(`Product userId: ${testProduct.userId}`);
      console.log(`Seller userId: ${testProduct.seller?.userId}`);
      console.log('The product and seller have different userIds!');
    } else {
      console.log('\n✅ Product userId matches seller userId');
    }

    // 3. Test the exact query that's failing
    console.log('\n=== TESTING THE EXACT QUERY ===');
    
    const whereClause = {
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

    console.log('Where clause:', JSON.stringify(whereClause, null, 2));

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        seller: {
          include: {
            user: true
          }
        }
      }
    });

    console.log(`\nProducts returned: ${products.length}`);
    products.forEach(product => {
      console.log(`- ${product.name} (ID: ${product.id})`);
      console.log(`  Product userId: ${product.userId}`);
      console.log(`  Seller userId: ${product.seller?.userId || 'No seller'}`);
      console.log(`  Seller user status: ${product.seller?.user?.status || 'No user'}`);
      console.log(`  isTestProduct: ${product.isTestProduct}`);
    });

    const testProducts = products.filter(p => p.isTestProduct);
    console.log(`\nTest products in results: ${testProducts.length}`);

    // 4. If still no results, let's try a simpler query
    if (testProducts.length === 0) {
      console.log('\n=== TRYING SIMPLER QUERIES ===');
      
      // Query 1: Just active products
      const activeProducts = await prisma.product.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          isTestProduct: true,
          userId: true
        }
      });
      
      console.log(`Active products: ${activeProducts.length}`);
      const activeTestProducts = activeProducts.filter(p => p.isTestProduct);
      console.log(`Active test products: ${activeTestProducts.length}`);
      activeTestProducts.forEach(p => console.log(`- ${p.name} (userId: ${p.userId})`));

      // Query 2: Products with sellers
      const productsWithSellers = await prisma.product.findMany({
        where: {
          status: "ACTIVE",
          seller: {
            isNot: null
          }
        },
        select: {
          id: true,
          name: true,
          isTestProduct: true,
          userId: true,
          seller: {
            select: {
              userId: true,
              user: {
                select: {
                  status: true
                }
              }
            }
          }
        }
      });
      
      console.log(`\nProducts with sellers: ${productsWithSellers.length}`);
      const testProductsWithSellers = productsWithSellers.filter(p => p.isTestProduct);
      console.log(`Test products with sellers: ${testProductsWithSellers.length}`);
      testProductsWithSellers.forEach(p => {
        console.log(`- ${p.name}`);
        console.log(`  Product userId: ${p.userId}`);
        console.log(`  Seller userId: ${p.seller?.userId || 'No seller'}`);
        console.log(`  Seller user status: ${p.seller?.user?.status || 'No user'}`);
      });
    }

  } catch (error) {
    console.error('Error debugging relationship:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRelationship(); 
// MongoDB script to remove discountEndDate and discountEndTime fields from all products
// Run this script using: mongosh <connection-string> <database-name> remove-discount-end-fields.mongosh.js

// Connect to your database (adjust connection string as needed)
// Example: mongosh "mongodb://localhost:27017" yarnnu remove-discount-end-fields.mongosh.js

print("Starting removal of discountEndDate and discountEndTime fields from products...");

// Remove discountEndDate field from all products
const resultDate = db.products.updateMany(
  {},
  { $unset: { discountEndDate: "" } }
);

print(`Removed discountEndDate from ${resultDate.modifiedCount} products`);

// Remove discountEndTime field from all products
const resultTime = db.products.updateMany(
  {},
  { $unset: { discountEndTime: "" } }
);

print(`Removed discountEndTime from ${resultTime.modifiedCount} products`);

print("Cleanup complete!");
print(`Total products modified: ${Math.max(resultDate.modifiedCount, resultTime.modifiedCount)}`);


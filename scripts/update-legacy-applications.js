// MongoDB script to update legacy seller applications to new simplified schema
// Run this in MongoDB Compass or mongosh

// Update the specific legacy application you mentioned
db.getCollection('SellerApplication').updateOne(
  { _id: ObjectId("681b687e3eedae13b466a943") },
  {
    $set: {
      // Remove old fields and add new simplified structure
      productTypes: "Legacy Application - Product Types",
      onlinePresence: "Legacy Application - Online Presence",
      yearsOfExperience: "Legacy Application - Experience",
      birthdate: "Legacy Application - Birthdate",
      agreeToHandmadePolicy: false,
      certifyOver18: false,
      agreeToTerms: false
    },
    $unset: {
      // Remove old fields that are no longer used
      portfolio: "",
      websiteOrShopLinks: "",
      socialMediaProfiles: "",
      location: ""
    }
  }
)

// Optional: Update ALL legacy applications that don't have the new fields
db.getCollection('SellerApplication').updateMany(
  {
    $or: [
      { productTypes: { $exists: false } },
      { onlinePresence: { $exists: false } },
      { yearsOfExperience: { $exists: false } },
      { birthdate: { $exists: false } },
      { agreeToHandmadePolicy: { $exists: false } },
      { certifyOver18: { $exists: false } },
      { agreeToTerms: { $exists: false } }
    ]
  },
  {
    $set: {
      productTypes: "Legacy Application - Product Types",
      onlinePresence: "Legacy Application - Online Presence", 
      yearsOfExperience: "Legacy Application - Experience",
      birthdate: "Legacy Application - Birthdate",
      agreeToHandmadePolicy: false,
      certifyOver18: false,
      agreeToTerms: false
    },
    $unset: {
      portfolio: "",
      websiteOrShopLinks: "",
      socialMediaProfiles: "",
      location: ""
    }
  }
)

// Verify the update worked
db.getCollection('SellerApplication').findOne({ _id: ObjectId("681b687e3eedae13b466a943") }) 
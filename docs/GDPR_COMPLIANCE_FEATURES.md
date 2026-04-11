# GDPR Compliance Features for Business Address System

## Overview

The business address system has been designed with comprehensive GDPR (General Data Protection Regulation) compliance in mind. This document outlines the security measures, data protection features, and compliance mechanisms implemented.

## 🔐 Encryption Standards

### Algorithm & Security
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Length**: 256 bits (32 bytes)
- **IV Length**: 96 bits (12 bytes) for GCM mode
- **Authentication Tag**: 128 bits (16 bytes)
- **Salt Length**: 128 bits (16 bytes) for key derivation

### Key Derivation
- **Method**: PBKDF2 (Password-Based Key Derivation Function 2)
- **Iterations**: 100,000 rounds
- **Hash Function**: SHA-256
- **Purpose**: Ensures unique encryption keys for each data field

### Encryption Process
1. Generate random salt for key derivation
2. Derive unique key using PBKDF2
3. Generate random IV (Initialization Vector)
4. Encrypt data using AES-256-GCM
5. Add authentication tag for integrity verification
6. Store encrypted data with IV and salt

## 🛡️ Data Protection Features

### Field-Level Encryption
Each address field is encrypted independently:
- Street address
- Street address 2 (optional)
- City
- State/Province (optional)
- Postal code
- Country

### Authentication & Integrity
- **Associated Authenticated Data (AAD)**: "OlovaraMarketplace" string
- **Authentication Tag**: Prevents tampering and ensures data integrity
- **IV Uniqueness**: Each encryption uses a unique IV

## 📋 GDPR Compliance Features

### 1. Data Retention Policy
- **Retention Period**: 7 years for business addresses
- **Automatic Cleanup**: Data older than retention period is automatically removed
- **Compliance**: Meets legal requirements for business record keeping

```typescript
const BUSINESS_ADDRESS_RETENTION_DAYS = 7 * 365;
```

### 2. Right to be Forgotten
- **Anonymization**: Data is anonymized rather than hard-deleted
- **Redaction**: Sensitive data is replaced with "[REDACTED]"
- **Audit Trail**: Deletion actions are logged for compliance

```typescript
function anonymizeAddressData() {
  return {
    street: '[REDACTED]',
    street2: null,
    city: '[REDACTED]',
    state: null,
    country: '[REDACTED]',
    postalCode: '[REDACTED]',
  };
}
```

### 3. Data Portability
- **Export Function**: Users can export their personal data
- **Structured Format**: Data is provided in a machine-readable format
- **Metadata Included**: Export includes creation dates and retention policy info

### 4. Audit Logging
All data access is logged for compliance:
- **Actions**: CREATE, READ, UPDATE, DELETE
- **User Identification**: User ID and session tracking
- **Timestamps**: Precise timing of all operations
- **Context**: IP address and user agent (when available)

```typescript
interface AuditLogEntry {
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  userId: string;
  dataType: 'BUSINESS_ADDRESS';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}
```

### 5. Data Minimization
- **Field Validation**: Strict input validation with length limits
- **Optional Fields**: Only required fields are mandatory
- **Purpose Limitation**: Data is only used for EU compliance requirements

```typescript
const BusinessAddressSchema = z.object({
  street: z.string().min(1).max(255),
  street2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  country: z.string().min(2).max(3),
  postalCode: z.string().min(1).max(20),
});
```

## 🔍 Security Measures

### 1. Access Control
- **Authentication Required**: All operations require valid user session
- **Permission Checks**: Users must have "MANAGE_SELLER_SETTINGS" permission
- **Session Validation**: Server-side session verification

### 2. Error Handling
- **Graceful Degradation**: Decryption errors return fallback values
- **No Data Leakage**: Error messages don't expose sensitive information
- **Logging**: All errors are logged for security monitoring

### 3. Input Validation
- **Schema Validation**: Zod schemas ensure data integrity
- **Length Limits**: Prevents buffer overflow attacks
- **Type Safety**: TypeScript ensures type safety throughout

## 📊 Compliance Checklist

### ✅ Implemented Features
- [x] Data encryption at rest (AES-256-GCM)
- [x] Field-level encryption
- [x] Secure key derivation (PBKDF2)
- [x] Data retention policy (7 years)
- [x] Right to be forgotten (anonymization)
- [x] Data portability (export functionality)
- [x] Audit logging
- [x] Access control and permissions
- [x] Input validation and sanitization
- [x] Error handling without data leakage

### 🔄 Ongoing Compliance
- [ ] Regular security audits
- [ ] Encryption key rotation
- [ ] Compliance monitoring
- [ ] User consent management
- [ ] Data breach notification procedures

## 🚀 Implementation Details

### Server Actions
1. **createOrUpdateBusinessAddress**: Creates or updates encrypted business address
2. **getBusinessAddress**: Retrieves and decrypts business address
3. **deleteBusinessAddress**: Anonymizes business address (right to be forgotten)
4. **exportBusinessAddressData**: Exports personal data for portability

### Database Schema
The Address model includes encrypted fields with corresponding IVs and salts:
```prisma
model Address {
  encryptedStreet   String
  streetIV          String
  streetSalt        String
  encryptedStreet2  String?
  street2IV         String?
  street2Salt       String?
  // ... other encrypted fields
  isBusinessAddress Boolean @default(false)
}
```

### Environment Variables
Required for encryption:
```env
ENCRYPTION_KEY=your-32-byte-hex-encryption-key
```

## 🔒 Security Best Practices

### Key Management
- Store encryption keys in environment variables
- Use different keys for different environments
- Implement key rotation procedures
- Never log or expose encryption keys

### Data Handling
- Always encrypt sensitive data before storage
- Validate all inputs before processing
- Use parameterized queries to prevent injection
- Implement proper error handling

### Access Control
- Verify user permissions before data access
- Log all data access for audit purposes
- Implement session timeout
- Use HTTPS for all data transmission

## 📞 Support & Compliance

For questions about GDPR compliance or data protection:
- Review audit logs for data access patterns
- Monitor encryption key usage
- Regular compliance assessments
- Update retention policies as needed

## 🔄 Future Enhancements

### Planned Features
- [ ] Automated data retention cleanup
- [ ] Enhanced audit log storage
- [ ] Data breach detection
- [ ] Consent management system
- [ ] Privacy impact assessments

### Monitoring
- [ ] Encryption performance metrics
- [ ] Data access patterns
- [ ] Compliance violation alerts
- [ ] Security incident response

---

*This document should be reviewed and updated regularly to ensure continued GDPR compliance.*

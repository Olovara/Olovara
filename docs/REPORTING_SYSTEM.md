# Reporting System

The Yarnnu marketplace includes a comprehensive reporting system that allows users to report sellers and products for various violations. This system helps maintain quality standards and community safety.

## Overview

The reporting system consists of:

1. **User-facing components**: Report buttons on shop and product pages
2. **Report modal**: A comprehensive form for submitting reports
3. **Admin dashboard**: Interface for managing and reviewing reports
4. **API endpoints**: Backend functionality for report submission and management
5. **Database model**: Storage and tracking of all reports

## Features

### For Users

- **Easy reporting**: One-click report buttons on shop and product pages
- **Comprehensive categories**: Multiple report categories with sub-reasons
- **Anonymous reporting**: Option to report without creating an account
- **Evidence submission**: Ability to provide additional context and evidence
- **Contact information**: Optional contact details for follow-up

### For Admins

- **Report management**: View, filter, and update report status
- **Categorization**: Automatic severity assignment based on report type
- **Workflow tracking**: Status progression from pending to resolved
- **Pattern detection**: Track related reports and identify trends
- **Resolution notes**: Internal notes and resolution tracking

## Report Categories

The system supports the following report categories:

| Category | Description | Severity | Sub-reasons |
|----------|-------------|----------|-------------|
| **Inappropriate Content** | Content that violates community guidelines | HIGH | Explicit content, Violence, Hate speech, Discrimination, Adult content |
| **Copyright Infringement** | Unauthorized use of copyrighted material | HIGH | Unauthorized brand use, Stolen designs, Trademark violation, Patent infringement |
| **Misleading Information** | False or deceptive product descriptions | MEDIUM | False product claims, Misleading images, Incorrect materials, Fake reviews |
| **Poor Quality** | Products that don't meet quality standards | MEDIUM | Defective items, Poor craftsmanship, Incorrect sizing, Damaged goods |
| **Fake/Counterfeit Products** | Products that are not authentic | CRITICAL | Counterfeit items, Knock-off products, Fake designer goods, Unauthorized replicas |
| **Harassment** | Bullying, threats, or abusive behavior | CRITICAL | Bullying, Threats, Abusive language, Stalking behavior |
| **Spam** | Excessive promotional content or unwanted messages | LOW | Excessive messaging, Unwanted promotions, Bot activity, Repeated content |
| **Other** | Other issues not covered above | MEDIUM | Policy violation, Safety concern, Legal issue, Other |

## Report Status Workflow

Reports follow this status progression:

1. **PENDING** - Initial status when report is submitted
2. **UNDER_REVIEW** - Admin is actively reviewing the report
3. **RESOLVED** - Issue has been resolved
4. **DISMISSED** - Report was found to be invalid or unfounded
5. **ESCALATED** - Report requires higher-level attention

## Implementation Details

### Database Schema

The `Report` model includes:

- **Basic info**: Report type, target ID/name, reporter info
- **Content**: Reason, sub-reason, description, evidence
- **Metadata**: Category, severity, status, timestamps
- **Admin fields**: Notes, resolution info, admin tracking
- **Contact info**: Optional reporter contact details
- **Technical data**: IP address, user agent, location

### API Endpoints

- `POST /api/reports` - Submit a new report
- `GET /api/reports` - Admin: List reports with filtering
- `GET /api/reports/[id]` - Admin: Get specific report details
- `PATCH /api/reports/[id]` - Admin: Update report status

### Components

- `ReportButton` - Reusable button component
- `ReportModal` - Comprehensive report submission form
- `ReportsPage` - Admin dashboard for report management

## Usage

### For Users

1. Navigate to a shop or product page
2. Click the "Report" button
3. Select the appropriate category and sub-reason
4. Provide a detailed description
5. Optionally add evidence and contact information
6. Submit the report

### For Admins

1. Access the admin dashboard at `/admin/dashboard/reports`
2. Use filters to find specific reports
3. Click "View" to see full report details
4. Click "Update" to change status and add notes
5. Track resolution progress

## Security Features

- **Duplicate prevention**: Users can only report the same item once per 24 hours
- **Admin-only access**: Report management requires admin privileges
- **IP tracking**: All reports include IP address for fraud detection
- **Validation**: Comprehensive input validation on all endpoints
- **Audit trail**: Full tracking of status changes and admin actions

## Integration Points

The reporting system integrates with:

- **Shop pages**: Report buttons in shop headers
- **Product pages**: Report buttons in product action sections
- **Admin dashboard**: Dedicated reports management interface
- **Analytics**: Report data feeds into fraud detection and analytics
- **User management**: Links reports to user accounts when available

## Future Enhancements

Potential improvements include:

- **Automated moderation**: AI-powered initial review of reports
- **Report analytics**: Dashboard showing report trends and patterns
- **Email notifications**: Automated notifications for high-priority reports
- **Bulk actions**: Admin tools for handling multiple similar reports
- **Report templates**: Pre-defined report templates for common issues
- **Integration with external services**: Connect with copyright detection services

## Testing

The system includes comprehensive tests covering:

- Report creation with various categories
- Anonymous vs. authenticated reporting
- Status management and workflow
- Severity assignment logic
- Data validation and error handling

Run tests with: `npm test -- report-system.test.ts` 
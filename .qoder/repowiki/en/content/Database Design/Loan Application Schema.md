# Loan Application Schema

<cite>
**Referenced Files in This Document**
- [schema.ts](file://backend/src/db/schema.ts)
- [0000_snapshot.json](file://backend/drizzle/meta/0000_snapshot.json)
- [applications.ts](file://backend/src/routes/applications.ts)
- [apply.tsx](file://app/(tabs)/apply.tsx)
- [LoanContext.tsx](file://contexts/LoanContext.tsx)
- [applications.tsx](file://app/admin/(tabs)/applications.tsx)
- [AdminContext.tsx](file://contexts/AdminContext.tsx)
- [migrate.sql](file://backend/migrate.sql)
- [update-schema.sql](file://backend/update-schema.sql)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document provides comprehensive data model documentation for the Loan Application schema in PHOENIX. It details the loan_applications table structure, application-specific fields, status workflow, administrative review process, relationships with users and loans tables, validation rules, and practical examples of the complete application lifecycle.

## Project Structure
The PHOENIX application follows a clear separation between frontend and backend components, with the database schema defined in TypeScript using Drizzle ORM and PostgreSQL as the backend database.

```mermaid
graph TB
subgraph "Frontend"
A[Apply Screen<br/>apply.tsx]
B[Loan Context<br/>LoanContext.tsx]
C[Admin Applications<br/>applications.tsx]
D[Admin Context<br/>AdminContext.tsx]
end
subgraph "Backend"
E[Database Schema<br/>schema.ts]
F[Applications Routes<br/>applications.ts]
G[Drizzle Snapshot<br/>0000_snapshot.json]
end
subgraph "Database"
H[Users Table]
I[Loans Table]
J[Loan Applications Table]
K[Repayments Table]
end
A --> B
C --> D
B --> F
D --> F
F --> E
E --> H
E --> I
E --> J
E --> K
```

**Diagram sources**
- [apply.tsx](file://app/(tabs)/apply.tsx#L125-L255)
- [LoanContext.tsx:198-261](file://contexts/LoanContext.tsx#L198-L261)
- [applications.tsx](file://app/admin/(tabs)/applications.tsx#L155-L328)
- [AdminContext.tsx:311-361](file://contexts/AdminContext.tsx#L311-L361)
- [schema.ts:48-63](file://backend/src/db/schema.ts#L48-L63)

**Section sources**
- [schema.ts:1-146](file://backend/src/db/schema.ts#L1-L146)
- [0000_snapshot.json:6-140](file://backend/drizzle/meta/0000_snapshot.json#L6-L140)

## Core Components

### Loan Applications Table Structure
The loan_applications table serves as the central repository for loan application data with the following key fields:

**Primary Fields:**
- `id`: UUID primary key with auto-generated random values
- `userId`: Foreign key linking to users table
- `loanId`: Optional foreign key linking to loans table (nullable)

**Financial Information:**
- `amount`: Decimal field storing loan amount with precision 12, scale 2
- `employmentStatus`: String field with maximum 50 characters
- `monthlyIncome`: Decimal field with precision 12, scale 2 for monthly income verification

**Application Details:**
- `employerName`: Optional employer name up to 255 characters
- `reason`: Optional text field for application reason
- `status`: String field with default 'pending', supporting workflow states

**Administrative Review Fields:**
- `adminNotes`: Optional text field for reviewer comments
- `reviewedAt`: Timestamp for review completion
- `reviewedBy`: Foreign key linking to users table (reviewer)

**Timestamp Management:**
- `createdAt`: Automatic timestamp for record creation

**Section sources**
- [schema.ts:48-63](file://backend/src/db/schema.ts#L48-L63)
- [0000_snapshot.json:7-91](file://backend/drizzle/meta/0000_snapshot.json#L7-L91)

### Relationship Definitions
The schema establishes clear relationships between entities:

```mermaid
erDiagram
USERS {
uuid id PK
string email UK
string full_name
string phone
string dob
string national_id
string district
string area
string employment_status
string monthly_income
string role
boolean is_blacklisted
timestamp created_at
timestamp updated_at
}
LOAN_APPLICATIONS {
uuid id PK
uuid user_id FK
uuid loan_id FK
numeric amount
string employment_status
numeric monthly_income
string employer_name
text reason
string status
text admin_notes
timestamp created_at
timestamp reviewed_at
uuid reviewed_by FK
}
LOANS {
uuid id PK
uuid user_id FK
numeric amount
numeric interest_rate
integer term
string status
text purpose
timestamp disbursed_at
string disbursement_method
string disbursement_reference
timestamp repaid_at
numeric repayment_amount
string repayment_method
string repayment_reference
timestamp completed_at
text completion_notes
timestamp created_at
timestamp updated_at
}
USERS ||--o{ LOAN_APPLICATIONS : "creates"
USERS ||--o{ LOANS : "owns"
LOAN_APPLICATIONS ||--|| LOANS : "links to"
USERS ||--o{ LOANS : "reviewed by"
```

**Diagram sources**
- [schema.ts:4-46](file://backend/src/db/schema.ts#L4-L46)
- [schema.ts:48-63](file://backend/src/db/schema.ts#L48-L63)
- [schema.ts:98-126](file://backend/src/db/schema.ts#L98-L126)

**Section sources**
- [schema.ts:98-126](file://backend/src/db/schema.ts#L98-L126)

## Architecture Overview

### Application Lifecycle Workflow
The loan application process follows a structured workflow from submission to completion:

```mermaid
flowchart TD
A["User Submits Application<br/>apply.tsx"] --> B["Validation & Creation<br/>applications.ts"]
B --> C["Pending Status<br/>Default State"]
C --> D["Admin Review<br/>applications.tsx"]
D --> E{"Approval Decision"}
E --> |Approved| F["Update Status to Approved<br/>AdminContext.tsx"]
E --> |Rejected| G["Update Status to Rejected<br/>AdminContext.tsx"]
F --> H["Link to Loan Creation<br/>Loans Table"]
G --> I["Notify Applicant<br/>Notifications"]
H --> J["Loan Disbursement<br/>Admin Operations"]
J --> K["Repayment Tracking<br/>Repayments Table"]
K --> L["Loan Completion<br/>Final Status"]
```

**Diagram sources**
- [apply.tsx](file://app/(tabs)/apply.tsx#L209-L232)
- [applications.ts:111-138](file://backend/src/routes/applications.ts#L111-L138)
- [applications.tsx](file://app/admin/(tabs)/applications.tsx#L170-L204)
- [AdminContext.tsx:311-361](file://contexts/AdminContext.tsx#L311-L361)

### Frontend-Backend Integration
The system integrates frontend components with backend APIs through well-defined interfaces:

```mermaid
sequenceDiagram
participant User as "User Interface"
participant Apply as "Apply Screen"
participant Context as "Loan Context"
participant API as "Backend API"
participant DB as "Database"
User->>Apply : Fill Application Form
Apply->>Context : applyForLoan(data)
Context->>API : POST /applications
API->>DB : Insert loan_applications record
DB-->>API : New application ID
API-->>Context : Application response
Context-->>Apply : Success callback
Apply-->>User : Application submitted
```

**Diagram sources**
- [apply.tsx](file://app/(tabs)/apply.tsx#L209-L232)
- [LoanContext.tsx:198-261](file://contexts/LoanContext.tsx#L198-L261)
- [applications.ts:111-138](file://backend/src/routes/applications.ts#L111-L138)

**Section sources**
- [apply.tsx](file://app/(tabs)/apply.tsx#L125-L255)
- [LoanContext.tsx:198-261](file://contexts/LoanContext.tsx#L198-L261)
- [applications.ts:111-138](file://backend/src/routes/applications.ts#L111-L138)

## Detailed Component Analysis

### Data Validation Rules

#### Income Verification Validation
The system implements comprehensive validation for income verification:

```mermaid
flowchart TD
A["Income Submission"] --> B{"Monthly Income Provided?"}
B --> |No| C["Validation Error<br/>Required Field"]
B --> |Yes| D{"Format Valid?"}
D --> |No| E["Validation Error<br/>Invalid Format"]
D --> |Yes| F{"Amount Within Limits?"}
F --> |No| G["Validation Error<br/>Exceeds Limits"]
F --> |Yes| H["Validation Passed"]
```

**Diagram sources**
- [apply.tsx](file://app/(tabs)/apply.tsx#L163-L171)
- [LoanContext.tsx:213-219](file://contexts/LoanContext.tsx#L213-L219)

#### Employment Status Validation
Employment status validation ensures comprehensive coverage of employment categories:

**Supported Employment Categories:**
- Employed (Government)
- Employed (Private)
- Self-Employed / Business
- Freelancer
- Student
- Unemployed
- Other

**Section sources**
- [apply.tsx](file://app/(tabs)/apply.tsx#L35-L38)
- [apply.tsx](file://app/(tabs)/apply.tsx#L163-L171)

### Administrative Review Process

#### Review Workflow Implementation
The administrative review process follows a structured approach:

```mermaid
sequenceDiagram
participant Admin as "Admin Interface"
participant Context as "Admin Context"
participant API as "Backend API"
participant DB as "Database"
participant User as "Applicant"
Admin->>Context : Approve/Reject Application
Context->>API : PATCH /applications/ : id/review
API->>DB : Update loan_applications status
DB-->>API : Updated record
API-->>Context : Success response
Context->>User : Send Notification
Note over Admin,User : Status change triggers notifications
```

**Diagram sources**
- [applications.tsx](file://app/admin/(tabs)/applications.tsx#L170-L204)
- [AdminContext.tsx:311-361](file://contexts/AdminContext.tsx#L311-L361)
- [applications.ts:141-165](file://backend/src/routes/applications.ts#L141-L165)

#### Administrative Fields Management
The review process manages several administrative fields:

**Review Tracking Fields:**
- `reviewedAt`: Timestamp of review completion
- `reviewedBy`: Foreign key linking to reviewer user
- `adminNotes`: Optional reviewer comments
- `status`: Updated to approved or rejected

**Section sources**
- [applications.ts:141-165](file://backend/src/routes/applications.ts#L141-L165)
- [applications.tsx](file://app/admin/(tabs)/applications.tsx#L111-L128)

### Application Status Workflow

#### Status Transition States
The loan application follows a defined status workflow:

```mermaid
stateDiagram-v2
[*] --> Pending
Pending --> UnderReview : Admin Review Started
UnderReview --> Approved : Admin Approval
UnderReview --> Rejected : Admin Rejection
Approved --> Active : Loan Created
Approved --> Disbursed : Funds Disbursed
Disbursed --> Completed : Full Repayment
Rejected --> [*]
Active --> Completed : Full Repayment
Completed --> [*]
```

**Diagram sources**
- [applications.ts:19-22](file://backend/src/routes/applications.ts#L19-L22)
- [applications.tsx](file://app/admin/(tabs)/applications.tsx#L14-L23)

#### Status Mapping
The system maintains consistent status mapping between frontend and backend:

**Backend Status Values:** pending, under_review, approved, rejected
**Frontend Status Values:** submitted, under_review, approved, rejected, disbursed, active, completed

**Section sources**
- [applications.ts:19-22](file://backend/src/routes/applications.ts#L19-L22)
- [LoanContext.tsx:118-118](file://contexts/LoanContext.tsx#L118-L118)

### Relationship with Users and Loans Tables

#### User Relationship
Each loan application is associated with a user through the `userId` foreign key, establishing bidirectional relationships:

**User-Application Relationship:**
- One-to-many: Users can have multiple applications
- Application belongs to exactly one user
- User profile information is accessible through joins

#### Loan Linkage
The optional `loanId` foreign key creates a direct relationship to the loans table:

**Loan-Application Linkage:**
- Optional relationship (nullable)
- Allows applications to be linked to created loans
- Supports approval-to-disbursement workflow
- Enables audit trail of application-to-loan mapping

**Section sources**
- [schema.ts:48-63](file://backend/src/db/schema.ts#L48-L63)
- [schema.ts:113-126](file://backend/src/db/schema.ts#L113-L126)

## Dependency Analysis

### Database Schema Dependencies
The loan applications table has well-defined foreign key relationships:

```mermaid
graph LR
A[loan_applications] --> B[users]
A --> C[loans]
A --> D[users_reviewer]
B --> E[users.id]
C --> F[loans.id]
D --> G[users.id]
style A fill:#e1f5fe
style B fill:#f3e5f5
style C fill:#f3e5f5
style D fill:#f3e5f5
```

**Diagram sources**
- [schema.ts:48-63](file://backend/src/db/schema.ts#L48-L63)
- [0000_snapshot.json:94-133](file://backend/drizzle/meta/0000_snapshot.json#L94-L133)

### Frontend-Backend Data Flow
The system maintains consistent data flow between frontend and backend components:

```mermaid
flowchart LR
A[apply.tsx] --> B[LoanContext.tsx]
B --> C[applications.ts]
C --> D[schema.ts]
D --> E[Database]
F[applications.tsx] --> G[AdminContext.tsx]
G --> C
G --> H[Backend API]
H --> E
style A fill:#e8f5e8
style F fill:#ffe8e8
style E fill:#fff3e0
```

**Diagram sources**
- [apply.tsx](file://app/(tabs)/apply.tsx#L209-L232)
- [LoanContext.tsx:198-261](file://contexts/LoanContext.tsx#L198-L261)
- [applications.ts:111-138](file://backend/src/routes/applications.ts#L111-L138)
- [applications.tsx](file://app/admin/(tabs)/applications.tsx#L170-L204)
- [AdminContext.tsx:311-361](file://contexts/AdminContext.tsx#L311-L361)

**Section sources**
- [schema.ts:98-126](file://backend/src/db/schema.ts#L98-L126)
- [0000_snapshot.json:94-133](file://backend/drizzle/meta/0000_snapshot.json#L94-L133)

## Performance Considerations

### Database Indexing Strategy
The schema includes strategic foreign key indexing for optimal query performance:

**Indexed Foreign Keys:**
- `loan_applications.user_id` - User lookup performance
- `loan_applications.loan_id` - Application-to-loan relationships
- `loan_applications.reviewed_by` - Reviewer tracking
- `loans.user_id` - User-to-loan relationships

### Query Optimization
Recommended query patterns for optimal performance:

**Common Query Patterns:**
- Application listing with user and loan details
- User-specific application filtering
- Status-based filtering for admin dashboards
- Recent application sorting by creation date

### Data Type Optimization
The schema uses appropriate data types for optimal storage and performance:

**Decimal Precision:**
- Amount fields use numeric(12,2) for financial accuracy
- Interest rates use numeric(5,2) for percentage calculations
- Monthly income uses numeric(12,2) for income verification

## Troubleshooting Guide

### Common Validation Issues

#### Income Validation Errors
**Issue:** Income format validation failures
**Solution:** Ensure income is entered as a valid numeric value without special characters

#### Employment Status Validation
**Issue:** Employment status not in accepted list
**Solution:** Select from the predefined employment categories list

#### Application Submission Failures
**Issue:** Backend submission errors
**Solution:** Check network connectivity and verify user authentication headers

### Administrative Review Issues

#### Status Update Failures
**Issue:** Review status not updating
**Solution:** Verify admin credentials and ensure proper API endpoint access

#### Notification Delivery Problems
**Issue:** Applicant notifications not received
**Solution:** Check notification service configuration and user contact information

### Database Migration Issues

#### Schema Version Conflicts
**Issue:** Migration conflicts between development and production
**Solution:** Run database migrations in proper sequence using the migration scripts

**Section sources**
- [apply.tsx](file://app/(tabs)/apply.tsx#L163-L182)
- [applications.ts:141-165](file://backend/src/routes/applications.ts#L141-L165)
- [AdminContext.tsx:311-361](file://contexts/AdminContext.tsx#L311-L361)

## Conclusion

The PHOENIX loan application schema provides a robust foundation for loan processing with comprehensive validation, clear administrative workflows, and well-defined relationships between users, applications, and loans. The system supports the complete loan lifecycle from application submission through approval, disbursement, and repayment tracking.

Key strengths of the schema include:
- Comprehensive validation rules for income verification
- Structured administrative review process
- Clear status workflow transitions
- Well-defined foreign key relationships
- Scalable data types for financial accuracy
- Complete audit trail through timestamps and reviewer tracking

The implementation demonstrates best practices in database design, API integration, and user experience, providing a solid foundation for the PHOENIX lending platform.
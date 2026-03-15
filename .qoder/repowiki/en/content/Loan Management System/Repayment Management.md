# Repayment Management

<cite>
**Referenced Files in This Document**
- [repay.tsx](file://app/(tabs)/repay.tsx)
- [LoanContext.tsx](file://contexts/LoanContext.tsx)
- [NotificationService.ts](file://services/NotificationService.ts)
- [loans.tsx](file://app/(tabs)/loans.tsx)
- [loans.ts](file://backend/src/routes/loans.ts)
- [applications.ts](file://backend/src/routes/applications.ts)
- [notifications.ts](file://backend/src/routes/notifications.ts)
- [schema.ts](file://backend/src/db/schema.ts)
- [auth.ts](file://backend/src/middleware/auth.ts)
- [0000_snapshot.json](file://backend/drizzle/meta/0000_snapshot.json)
- [add_loan_columns.sql](file://backend/add_loan_columns.sql)
- [create-notifications-table.sql](file://backend/create-notifications-table.sql)
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
This document describes the repayment management system for the Phoenix loan platform. It covers the end-to-end repayment workflow from active loan status through payment verification to loan completion, including payment proof upload, verification mechanisms, automated status updates, calculation of repayment amounts, interest accrual, late payment handling, user notifications, and integration with loan status management. It also documents error handling, retry mechanisms, and customer support workflows.

## Project Structure
The repayment system spans three primary areas:
- Frontend screens and state management for user interactions
- Backend APIs for loan lifecycle and notifications
- Database schema supporting loan, application, repayment, and notification records

```mermaid
graph TB
subgraph "Frontend"
A["Repay Screen<br/>(app/(tabs)/repay.tsx)"]
B["Loan Context<br/>(contexts/LoanContext.tsx)"]
C["Notification Service<br/>(services/NotificationService.ts)"]
D["Loans Screen<br/>(app/(tabs)/loans.tsx)"]
end
subgraph "Backend"
E["Loans Routes<br/>(backend/src/routes/loans.ts)"]
F["Applications Routes<br/>(backend/src/routes/applications.ts)"]
G["Notifications Routes<br/>(backend/src/routes/notifications.ts)"]
H["Auth Middleware<br/>(backend/src/middleware/auth.ts)"]
end
subgraph "Database"
I["Schema Definitions<br/>(backend/src/db/schema.ts)"]
J["Drizzle Snapshot<br/>(backend/drizzle/meta/0000_snapshot.json)"]
end
A --> B
D --> B
B --> C
B --> E
B --> F
B --> G
E --> H
F --> H
G --> H
E --> I
F --> I
G --> I
I --> J
```

**Diagram sources**
- [repay.tsx](file://app/(tabs)/repay.tsx#L225-L450)
- [LoanContext.tsx:82-336](file://contexts/LoanContext.tsx#L82-L336)
- [NotificationService.ts:1-135](file://services/NotificationService.ts#L1-L135)
- [loans.tsx](file://app/(tabs)/loans.tsx#L309-L441)
- [loans.ts:1-320](file://backend/src/routes/loans.ts#L1-L320)
- [applications.ts:1-168](file://backend/src/routes/applications.ts#L1-L168)
- [notifications.ts:1-106](file://backend/src/routes/notifications.ts#L1-L106)
- [schema.ts:23-88](file://backend/src/db/schema.ts#L23-L88)
- [auth.ts:10-47](file://backend/src/middleware/auth.ts#L10-L47)
- [0000_snapshot.json:141-279](file://backend/drizzle/meta/0000_snapshot.json#L141-L279)

**Section sources**
- [repay.tsx](file://app/(tabs)/repay.tsx#L1-L671)
- [LoanContext.tsx:1-336](file://contexts/LoanContext.tsx#L1-L336)
- [NotificationService.ts:1-135](file://services/NotificationService.ts#L1-L135)
- [loans.tsx](file://app/(tabs)/loans.tsx#L1-L545)
- [loans.ts:1-320](file://backend/src/routes/loans.ts#L1-L320)
- [applications.ts:1-168](file://backend/src/routes/applications.ts#L1-L168)
- [notifications.ts:1-106](file://backend/src/routes/notifications.ts#L1-L106)
- [schema.ts:1-146](file://backend/src/db/schema.ts#L1-L146)
- [auth.ts:1-48](file://backend/src/middleware/auth.ts#L1-L48)
- [0000_snapshot.json:1-617](file://backend/drizzle/meta/0000_snapshot.json#L1-L617)

## Core Components
- Repayment UI and workflow:
  - Payment method selection and instructions
  - Payment proof upload with image picker
  - Countdown timer and overdue warnings
  - Payment history and rating after completion
- Loan state management:
  - Local state updates for payment proof uploads
  - Notification dispatch for payment events
  - Active loan filtering and due date calculations
- Backend loan lifecycle:
  - Disbursement and repayment marking endpoints
  - Repayment record creation
  - Status transitions and audit timestamps
- Notifications:
  - Local and backend notification persistence
  - Push notification delivery and channels
- Database schema:
  - Loans, loan applications, repayments, and notifications tables
  - Supporting columns for disbursement, repayment, and completion tracking

**Section sources**
- [repay.tsx](file://app/(tabs)/repay.tsx#L17-L59)
- [repay.tsx](file://app/(tabs)/repay.tsx#L225-L450)
- [LoanContext.tsx:263-273](file://contexts/LoanContext.tsx#L263-L273)
- [LoanContext.tsx:315-318](file://contexts/LoanContext.tsx#L315-L318)
- [loans.ts:224-290](file://backend/src/routes/loans.ts#L224-L290)
- [schema.ts:23-88](file://backend/src/db/schema.ts#L23-L88)
- [NotificationService.ts:93-134](file://services/NotificationService.ts#L93-L134)

## Architecture Overview
The repayment workflow integrates frontend and backend components to manage payment proof uploads, verification, and status updates. The frontend captures user intent and uploads proofs, while the backend validates and persists loan and repayment records. Notifications bridge user awareness and system actions.

```mermaid
sequenceDiagram
participant U as "User"
participant UI as "Repay Screen<br/>(repay.tsx)"
participant LC as "Loan Context<br/>(LoanContext.tsx)"
participant NS as "Notification Service<br/>(NotificationService.ts)"
participant LR as "Loans Route<br/>(loans.ts)"
participant DB as "Database Schema<br/>(schema.ts)"
U->>UI : Select payment method and open image picker
UI->>UI : Launch media library and pick image
UI->>LC : uploadRepaymentProof(loanId)
LC->>LC : Update local state (paymentProofUploaded=true, status=completed)
LC->>NS : sendNotification(title, message, type)
NS-->>U : Local notification shown
Note over LC,NS : Backend persistence handled by admin workflow
U->>LR : Admin marks loan as repaid (via backend)
LR->>DB : Update loans and insert repayment record
LR-->>U : Success response with updated loan
```

**Diagram sources**
- [repay.tsx](file://app/(tabs)/repay.tsx#L238-L260)
- [LoanContext.tsx:263-273](file://contexts/LoanContext.tsx#L263-L273)
- [NotificationService.ts:116-134](file://services/NotificationService.ts#L116-L134)
- [loans.ts:252-290](file://backend/src/routes/loans.ts#L252-L290)
- [schema.ts:23-88](file://backend/src/db/schema.ts#L23-L88)

## Detailed Component Analysis

### Repayment UI and Workflow
The repayment screen presents:
- Active loan summary with principal, interest, due date, and countdown
- Payment method cards and step-by-step instructions
- Payment proof upload with accepted formats
- Payment history and rating flow

Key behaviors:
- Countdown turns warning/error when overdue; displays penalty banner
- Payment proof upload triggers local state update and success notification
- Rating modal allows post-completion feedback

```mermaid
flowchart TD
Start(["Open Repay Screen"]) --> HasActive{"Has active/disbursed loan?"}
HasActive --> |No| ShowEmpty["Show 'No Active Loans' state"]
HasActive --> |Yes| ShowSummary["Display active loan summary and countdown"]
ShowSummary --> SelectMethod["Select payment method"]
SelectMethod --> ShowInstructions["Show payment instructions"]
ShowInstructions --> Upload["Upload payment proof"]
Upload --> LocalUpdate["Local state: paymentProofUploaded=true,<br/>status=completed"]
LocalUpdate --> Notify["Send success notification"]
Notify --> RatingFlow{"Rate after completion?"}
RatingFlow --> |Yes| ShowRating["Open rating modal"]
RatingFlow --> |No| End(["Done"])
ShowRating --> End
```

**Diagram sources**
- [repay.tsx](file://app/(tabs)/repay.tsx#L225-L450)
- [LoanContext.tsx:263-273](file://contexts/LoanContext.tsx#L263-L273)
- [NotificationService.ts:116-134](file://services/NotificationService.ts#L116-L134)

**Section sources**
- [repay.tsx](file://app/(tabs)/repay.tsx#L17-L59)
- [repay.tsx](file://app/(tabs)/repay.tsx#L225-L450)

### Loan Context and State Updates
The Loan Context manages:
- Local state for loans and notifications
- Payment proof upload handler that sets paymentProofUploaded and status
- Notification dispatch for payment-related events
- Active loan derivation from status filters

```mermaid
classDiagram
class LoanContext {
+loans : LoanApplication[]
+notifications : Notification[]
+isLoading : boolean
+applyForLoan(data) Promise~string~
+uploadRepaymentProof(loanId) Promise~void~
+rateLoan(loanId, rating, review) Promise~void~
+markNotificationRead(id) Promise~void~
+markAllRead() Promise~void~
+unreadCount : number
+activeLoan : LoanApplication|null
+refreshLoans() Promise~void~
}
class NotificationService {
+registerForPushNotificationsAsync() Promise~string|null~
+sendLocalNotification(title, body, data?) Promise~void~
+postNotificationToBackend(title, message, type) Promise~void~
+sendNotification(title, message, type, data?) Promise~void~
}
LoanContext --> NotificationService : "uses"
```

**Diagram sources**
- [LoanContext.tsx:50-62](file://contexts/LoanContext.tsx#L50-L62)
- [NotificationService.ts:26-134](file://services/NotificationService.ts#L26-L134)

**Section sources**
- [LoanContext.tsx:82-336](file://contexts/LoanContext.tsx#L82-L336)
- [NotificationService.ts:1-135](file://services/NotificationService.ts#L1-L135)

### Backend Loan Lifecycle and Repayment
Backend endpoints support:
- Disbursement: sets status to disbursed and records disbursement metadata
- Repayment: marks loan as repaid, stores repayment details, and inserts a repayment record
- Completion: finalizes loan with completion notes and timestamps

```mermaid
sequenceDiagram
participant Admin as "Admin"
participant API as "Loans Route<br/>(loans.ts)"
participant DB as "Database Schema<br/>(schema.ts)"
Admin->>API : PATCH / : id/disburse {method, reference}
API->>DB : Update loans.disbursed_at, disbursement_method/reference
API-->>Admin : Updated loan
Admin->>API : PATCH / : id/repaid {amount, method, reference}
API->>DB : Update loans.repaid_at, repayment_* fields
API->>DB : Insert repayment record
API-->>Admin : Updated loan
Admin->>API : PATCH / : id/complete {notes}
API->>DB : Update loans.completed_at, completion_notes
API-->>Admin : Updated loan
```

**Diagram sources**
- [loans.ts:224-290](file://backend/src/routes/loans.ts#L224-L290)
- [schema.ts:23-88](file://backend/src/db/schema.ts#L23-L88)

**Section sources**
- [loans.ts:224-290](file://backend/src/routes/loans.ts#L224-L290)
- [schema.ts:23-88](file://backend/src/db/schema.ts#L23-L88)

### Notifications and User Awareness
The notification system supports:
- Local notifications for immediate user feedback
- Backend persistence for historical tracking
- Channel configuration and permission handling

```mermaid
sequenceDiagram
participant LC as "Loan Context<br/>(LoanContext.tsx)"
participant NS as "Notification Service<br/>(NotificationService.ts)"
participant API as "Notifications Route<br/>(notifications.ts)"
participant DB as "Database Schema<br/>(schema.ts)"
LC->>NS : sendNotification(title, message, type)
NS->>NS : sendLocalNotification(...)
NS->>API : POST /notifications {title, message, type}
API->>DB : Insert notification row
API-->>NS : Created notification
```

**Diagram sources**
- [LoanContext.tsx:183-196](file://contexts/LoanContext.tsx#L183-L196)
- [NotificationService.ts:93-134](file://services/NotificationService.ts#L93-L134)
- [notifications.ts:72-90](file://backend/src/routes/notifications.ts#L72-L90)
- [schema.ts:79-88](file://backend/src/db/schema.ts#L79-L88)

**Section sources**
- [LoanContext.tsx:183-196](file://contexts/LoanContext.tsx#L183-L196)
- [NotificationService.ts:93-134](file://services/NotificationService.ts#L93-L134)
- [notifications.ts:1-106](file://backend/src/routes/notifications.ts#L1-L106)
- [schema.ts:79-88](file://backend/src/db/schema.ts#L79-L88)

### Database Schema and Migration Support
The schema defines:
- Loans with disbursement, repayment, and completion fields
- Repayments with due/paid dates and status
- Notifications with read/unread tracking
- Migrations and snapshot files ensure consistent schema across environments

```mermaid
erDiagram
USERS {
uuid id PK
string email UK
string full_name
string role
}
LOAN_APPLICATIONS {
uuid id PK
uuid user_id FK
uuid loan_id FK
numeric amount
string employment_status
numeric monthly_income
string reason
string status
}
LOANS {
uuid id PK
uuid user_id FK
numeric amount
numeric interest_rate
integer term
string status
timestamp disbursed_at
string disbursement_method
string disbursement_reference
timestamp repaid_at
numeric repayment_amount
string repayment_method
string repayment_reference
timestamp completed_at
text completion_notes
}
REPAYMENTS {
uuid id PK
uuid loan_id FK
numeric amount
timestamp due_date
timestamp paid_date
string status
string payment_method
string reference
timestamp paid_at
}
NOTIFICATIONS {
uuid id PK
uuid user_id FK
string title
text message
string type
boolean is_read
timestamp created_at
}
USERS ||--o{ LOAN_APPLICATIONS : "has"
USERS ||--o{ LOANS : "has"
LOAN_APPLICATIONS ||--o{ LOANS : "creates"
LOANS ||--o{ REPAYMENTS : "has"
USERS ||--o{ NOTIFICATIONS : "receives"
```

**Diagram sources**
- [schema.ts:4-88](file://backend/src/db/schema.ts#L4-L88)
- [0000_snapshot.json:6-441](file://backend/drizzle/meta/0000_snapshot.json#L6-L441)

**Section sources**
- [schema.ts:23-88](file://backend/src/db/schema.ts#L23-L88)
- [0000_snapshot.json:141-279](file://backend/drizzle/meta/0000_snapshot.json#L141-L279)
- [add_loan_columns.sql:1-12](file://backend/add_loan_columns.sql#L1-L12)
- [create-notifications-table.sql:1-30](file://backend/create-notifications-table.sql#L1-L30)

## Dependency Analysis
- Frontend-to-backend:
  - Repayment UI calls Loan Context for state updates
  - Loan Context triggers Notification Service and backend routes
  - Backend routes depend on schema definitions and auth middleware
- Data consistency:
  - Loans endpoint updates multiple fields for lifecycle tracking
  - Repayment endpoint creates a child record linking to the loan
- Security:
  - Auth middleware enforces token-based access for protected routes

```mermaid
graph TB
UI["Repay Screen<br/>(repay.tsx)"] --> LC["Loan Context<br/>(LoanContext.tsx)"]
LC --> NS["Notification Service<br/>(NotificationService.ts)"]
LC --> LR["Loans Route<br/>(loans.ts)"]
LR --> AUTH["Auth Middleware<br/>(auth.ts)"]
LR --> SCHEMA["Schema<br/>(schema.ts)"]
SCHEMA --> SNAPSHOT["Snapshot<br/>(0000_snapshot.json)"]
```

**Diagram sources**
- [repay.tsx](file://app/(tabs)/repay.tsx#L225-L450)
- [LoanContext.tsx:82-336](file://contexts/LoanContext.tsx#L82-L336)
- [NotificationService.ts:1-135](file://services/NotificationService.ts#L1-L135)
- [loans.ts:1-320](file://backend/src/routes/loans.ts#L1-L320)
- [auth.ts:10-47](file://backend/src/middleware/auth.ts#L10-L47)
- [schema.ts:23-88](file://backend/src/db/schema.ts#L23-L88)
- [0000_snapshot.json:141-279](file://backend/drizzle/meta/0000_snapshot.json#L141-L279)

**Section sources**
- [repay.tsx](file://app/(tabs)/repay.tsx#L225-L450)
- [LoanContext.tsx:82-336](file://contexts/LoanContext.tsx#L82-L336)
- [loans.ts:1-320](file://backend/src/routes/loans.ts#L1-L320)
- [auth.ts:10-47](file://backend/src/middleware/auth.ts#L10-L47)
- [schema.ts:23-88](file://backend/src/db/schema.ts#L23-L88)

## Performance Considerations
- Local-first UX:
  - Immediate UI updates for payment proof uploads reduce perceived latency
  - Notifications are sent locally first, with backend persistence as a fallback
- Database indexing:
  - Indexes on notifications improve retrieval performance for user-specific queries
- Network efficiency:
  - Minimal payload sizes for status updates and notifications
  - Batch operations for notification reads when supported by backend

## Troubleshooting Guide
Common issues and resolutions:
- Payment proof upload permissions:
  - If media library permission is denied, the UI prompts the user to grant access
- Backend connectivity:
  - Notification posting to backend may fail; local notifications still deliver
  - Loan status updates require proper authentication tokens
- Schema mismatches:
  - Ensure migrations are applied to add missing loan columns and notifications table
- Overdue handling:
  - Countdown banner indicates overdue state; UI displays penalty notice

Operational checks:
- Verify JWT secret and auth middleware configuration
- Confirm notification channel setup and device permissions
- Validate repayment endpoint payloads (amount, method, reference)

**Section sources**
- [repay.tsx](file://app/(tabs)/repay.tsx#L241-L245)
- [NotificationService.ts:26-69](file://services/NotificationService.ts#L26-L69)
- [auth.ts:10-36](file://backend/src/middleware/auth.ts#L10-L36)
- [add_loan_columns.sql:1-12](file://backend/add_loan_columns.sql#L1-L12)
- [create-notifications-table.sql:1-30](file://backend/create-notifications-table.sql#L1-L30)

## Conclusion
The repayment management system combines a responsive frontend with robust backend endpoints and a well-structured database schema. It enables users to upload payment proofs, receive timely notifications, and track repayment progress, while administrators can finalize loans and maintain audit trails. The design balances user experience with operational reliability, including graceful handling of network failures and schema evolution.
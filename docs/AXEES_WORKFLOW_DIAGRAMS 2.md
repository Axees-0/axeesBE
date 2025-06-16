# Axees Platform - Complete Workflow Diagrams

## 1. Overall System Architecture

```mermaid
graph TB
    subgraph "User Types"
        M[Marketer]
        C[Creator]
        T[TempUser/AI]
    end
    
    subgraph "Core Modules"
        AUTH[Authentication System]
        USERS[User Management]
        OFFERS[Offer System]
        DEALS[Deal Management]
        CHAT[Chat System]
        PAY[Payment System]
        AI[AI Discovery]
    end
    
    subgraph "External Services"
        STRIPE[Stripe Payments]
        FIREBASE[Firebase Push]
        TWILIO[Twilio SMS]
        OPENAI[OpenAI API]
        AWS[AWS S3 Storage]
    end
    
    M --> AUTH
    C --> AUTH
    T --> AI
    
    AUTH --> USERS
    USERS --> OFFERS
    OFFERS --> CHAT
    OFFERS --> DEALS
    DEALS --> PAY
    
    PAY --> STRIPE
    AUTH --> TWILIO
    CHAT --> FIREBASE
    AI --> OPENAI
    OFFERS --> AWS
    DEALS --> AWS
```

## 2. User Registration & Onboarding Flow

```mermaid
sequenceDiagram
    participant U as User
    participant API as Axees API
    participant SMS as Twilio SMS
    participant DB as Database
    
    U->>API: POST /api/auth/check-phone
    API->>DB: Check if phone exists
    DB-->>API: Phone status
    API-->>U: Phone availability
    
    U->>API: POST /api/auth/register/start
    API->>SMS: Send OTP
    SMS-->>U: OTP Code
    API-->>U: OTP sent confirmation
    
    U->>API: POST /api/auth/register/verify-otp
    API->>DB: Create temp user
    DB-->>API: User created
    API-->>U: User ID + token
    
    U->>API: POST /api/account/register/set-profile
    API->>DB: Update user profile
    DB-->>API: Profile updated
    API-->>U: Profile set
    
    U->>API: POST /api/account/set-email
    API->>DB: Update email
    DB-->>API: Email updated
    API-->>U: Email set
    
    U->>API: POST /api/account/set-password
    API->>DB: Activate user account
    DB-->>API: Account activated
    API-->>U: Registration complete
```

## 3. Complete Offer-to-Deal Workflow

```mermaid
flowchart TD
    START([User Logged In]) --> ROLE{User Role?}
    
    %% Marketer Flow
    ROLE -->|Marketer| M_SEARCH[Search Creators]
    M_SEARCH --> M_FIND[Find Creator Profile]
    M_FIND --> M_DRAFT[Create Offer Draft]
    M_DRAFT --> M_REVIEW[Review Draft]
    M_REVIEW --> M_SEND[Send Offer to Creator]
    
    %% Creator Discovery
    M_SEARCH --> AI_SEARCH[AI Creator Discovery]
    AI_SEARCH --> TEMP_USERS[Browse AI Profiles]
    TEMP_USERS --> M_FIND
    
    %% Creator Flow
    ROLE -->|Creator| C_OFFERS[View Received Offers]
    C_OFFERS --> C_REVIEW[Review Offer Details]
    
    %% Offer Sent State
    M_SEND --> OFFER_SENT[Offer Status: Sent]
    OFFER_SENT --> NOTIFY_C[Notify Creator]
    NOTIFY_C --> C_REVIEW
    
    %% Negotiation Loop
    C_REVIEW --> C_DECISION{Creator Decision}
    C_DECISION -->|Accept| C_ACCEPT[Accept Offer]
    C_DECISION -->|Counter| C_COUNTER[Create Counter Offer]
    C_DECISION -->|Reject| C_REJECT[Reject Offer]
    
    C_COUNTER --> NOTIFY_M[Notify Marketer]
    NOTIFY_M --> M_COUNTER_REVIEW[Review Counter]
    M_COUNTER_REVIEW --> M_DECISION{Marketer Decision}
    M_DECISION -->|Accept| M_ACCEPT[Accept Counter]
    M_DECISION -->|Counter| M_COUNTER[Create Counter]
    M_DECISION -->|Reject| M_REJECT[Reject Counter]
    
    M_COUNTER --> C_REVIEW
    
    %% Deal Creation
    C_ACCEPT --> CREATE_DEAL[Create Deal]
    M_ACCEPT --> CREATE_DEAL
    
    CREATE_DEAL --> CHAT_CREATE[Auto-create Chat Room]
    CREATE_DEAL --> DEAL_ACTIVE[Deal Status: Active]
    
    %% Deal Management
    DEAL_ACTIVE --> MILESTONES[Setup Milestones]
    MILESTONES --> FUND_MILESTONE[Fund Milestone]
    FUND_MILESTONE --> WORK_PHASE[Work Submission Phase]
    WORK_PHASE --> CONTENT_PHASE[Content Approval Phase]
    CONTENT_PHASE --> PROOF_PHASE[Proof Submission Phase]
    PROOF_PHASE --> PAYMENT_RELEASE[Payment Release]
    PAYMENT_RELEASE --> DEAL_COMPLETE[Deal Complete]
    
    %% Termination States
    C_REJECT --> OFFER_END[Offer Ended]
    M_REJECT --> OFFER_END
    
    style START fill:#e1f5fe
    style CREATE_DEAL fill:#c8e6c9
    style DEAL_COMPLETE fill:#4caf50
    style OFFER_END fill:#ffcdd2
```

## 4. Deal Execution & Milestone Management

```mermaid
stateDiagram-v2
    [*] --> DealCreated : Offer Accepted
    
    DealCreated --> MilestoneSetup : Setup Milestones
    MilestoneSetup --> MilestonePending : Milestone Created
    
    MilestonePending --> MilestoneFunded : Marketer Funds
    MilestoneFunded --> WorkInProgress : Creator Starts Work
    WorkInProgress --> WorkSubmitted : Creator Submits
    
    WorkSubmitted --> WorkApproved : Marketer Approves
    WorkSubmitted --> WorkRevision : Marketer Requests Changes
    WorkRevision --> WorkInProgress : Creator Revises
    
    WorkApproved --> ContentSubmission : Submit Content for Approval
    ContentSubmission --> ContentApproved : Marketer Approves Content
    ContentSubmission --> ContentRevision : Request Content Changes
    ContentRevision --> ContentSubmission : Creator Revises Content
    
    ContentApproved --> ProofSubmission : Creator Posts & Submits Proof
    ProofSubmission --> ProofApproved : Marketer Verifies
    ProofSubmission --> ProofRevision : Proof Rejected
    ProofRevision --> ProofSubmission : Resubmit Proof
    
    ProofApproved --> PaymentReleased : Release Escrow Payment
    PaymentReleased --> MilestoneComplete : Milestone Completed
    
    MilestoneComplete --> MilestoneSetup : Next Milestone
    MilestoneComplete --> DealComplete : All Milestones Done
    
    DealCreated --> DealCancelled : Cancel Deal
    WorkInProgress --> DealCancelled : Cancel Deal
    
    DealComplete --> [*]
    DealCancelled --> [*]
```

## 5. Payment & Escrow System Flow

```mermaid
sequenceDiagram
    participant M as Marketer
    participant API as Axees API
    participant STRIPE as Stripe
    participant ESCROW as Escrow Account
    participant C as Creator
    participant BANK as Creator Bank
    
    Note over M,BANK: Milestone Funding Phase
    M->>API: Fund Milestone
    API->>STRIPE: Create Payment Intent
    STRIPE-->>API: Payment Intent ID
    API-->>M: Checkout Session
    
    M->>STRIPE: Complete Payment
    STRIPE->>ESCROW: Transfer to Escrow
    STRIPE->>API: Webhook: Payment Success
    API->>API: Update Milestone Status: Funded
    
    Note over M,BANK: Work Completion Phase
    C->>API: Submit Work
    API-->>M: Notify Marketer
    M->>API: Approve Work
    API->>API: Update Status: Approved
    
    Note over M,BANK: Payment Release Phase
    M->>API: Release Payment
    API->>STRIPE: Transfer from Escrow
    STRIPE->>BANK: Transfer to Creator
    STRIPE->>API: Webhook: Transfer Complete
    API->>API: Record Earning
    API-->>C: Payment Notification
    
    Note over M,BANK: Withdrawal Process
    C->>API: Request Withdrawal
    API->>STRIPE: Create Payout
    STRIPE->>BANK: Direct Transfer
    STRIPE->>API: Webhook: Payout Complete
    API-->>C: Withdrawal Complete
```

## 6. Real-time Chat & Communication Flow

```mermaid
sequenceDiagram
    participant U1 as User 1
    participant API as Axees API
    participant SSE as SSE Stream
    participant DB as Database
    participant FIREBASE as Firebase
    participant U2 as User 2
    
    Note over U1,U2: Chat Initialization
    U1->>API: GET /api/chats
    API->>DB: Get chat rooms
    DB-->>API: Chat list
    API-->>U1: Chat rooms
    
    U1->>API: GET /api/chats/:chatId/stream
    API->>SSE: Establish SSE connection
    SSE-->>U1: Connected
    
    Note over U1,U2: Message Sending
    U1->>API: POST /api/chats/:chatId/messages
    API->>DB: Save message
    DB-->>API: Message saved
    API->>SSE: Broadcast to connected users
    SSE-->>U2: New message event
    
    Note over U1,U2: Push Notification (2min delay)
    API->>API: Schedule notification job
    API->>FIREBASE: Send push notification
    FIREBASE-->>U2: Push notification
    
    Note over U1,U2: File Sharing
    U1->>API: POST /api/chats/:chatId/messages (with file)
    API->>API: Upload to AWS S3
    API->>DB: Save message with file URL
    API->>SSE: Broadcast message
    SSE-->>U2: File message
    
    Note over U1,U2: Read Status
    U2->>API: POST /api/chats/:chatId/mark-read
    API->>DB: Update read status
    API->>SSE: Broadcast read status
    SSE-->>U1: Messages marked read
```

## 7. AI Creator Discovery System

```mermaid
flowchart TD
    SEARCH_START([Marketer Searches Creators]) --> QUERY[Search Query Processing]
    
    QUERY --> DB_SEARCH[Search Real Users]
    DB_SEARCH --> DB_RESULTS[Real User Results]
    
    QUERY --> AI_CHECK{Need AI Backfill?}
    AI_CHECK -->|Yes| AI_SEARCH[Query OpenAI]
    AI_CHECK -->|No| COMBINE_RESULTS
    
    AI_SEARCH --> APIFY_EXTRACT[Extract Social Data via Apify]
    APIFY_EXTRACT --> AI_PROFILES[Generate AI Profiles]
    AI_PROFILES --> TEMP_DB[Save as TempUsers]
    TEMP_DB --> AI_RESULTS[AI Generated Results]
    
    DB_RESULTS --> COMBINE_RESULTS[Combine Results]
    AI_RESULTS --> COMBINE_RESULTS
    
    COMBINE_RESULTS --> FILTER[Apply Filters & Preferences]
    FILTER --> RANK[Rank by Relevance]
    RANK --> FINAL_RESULTS[Return to Marketer]
    
    FINAL_RESULTS --> SELECT_CREATOR[Marketer Selects Creator]
    SELECT_CREATOR --> CONVERT_CHECK{Is TempUser?}
    CONVERT_CHECK -->|Yes| CONVERT_TEMP[Convert to Real User]
    CONVERT_CHECK -->|No| CREATE_OFFER[Create Offer]
    
    CONVERT_TEMP --> CREATE_OFFER
    CREATE_OFFER --> OFFER_FLOW[Continue Offer Flow]
    
    style AI_SEARCH fill:#fff3e0
    style AI_PROFILES fill:#fff3e0
    style TEMP_DB fill:#fff3e0
    style CONVERT_TEMP fill:#e8f5e8
```

## 8. Complete API Endpoint Mapping

```mermaid
mindmap
  root((Axees API))
    Authentication
      /api/auth
        login
        register/start
        register/verify-otp
        check-phone
        password-reset
        resend-otp
    Account Management
      /api/account
        register/set-profile
        update-name
        update-username
        set-email
        set-password
        profile/:userId
        :userId/avatar
        :userId/media-package
        creator/:userId
        marketer/:userId
        creator/:userId/social-handles
        creator/:userId/portfolio
    User Management
      /api/users
        getAllUsers
        createUser
        :userId
        :userId/favorites
        :viewerId/hide
    Offer System
      /api/marketer/offers
        payment-status
        create/get/update/delete
        :offerId/send
        :offerId/counter
        :offerId/accept
        :offerId/reject
        :offerId/cancel
        drafts
        :offerId/viewed/:role
    Deal Management
      /api/marketer/deals
        create
        getDeals
        :dealId/milestones
        :dealId/milestones/:milestoneId/fund
        :dealId/milestones/:milestoneId/submit
        :dealId/milestones/:milestoneId/review
        :dealId/offer-content
        :dealId/approve-offer-content
        :dealId/submit-proof
        :dealId/proofs/:proofId/review
        :dealId/release-first-half
        :dealId/cancel
    Chat System
      /api/chats
        getChatRooms
        :chatId/messages
        :chatId/stream
        :chatId/mark-read
        messages/:id/read
        search
        unread-count
    Payment System
      /api/payments
        create-checkout-session
        session-status
        paymentmethod
        withdraw
        withdrawals/history
        earnings
        earnings/summary
        refund
        webhook
    AI Discovery
      /api/find
        searchCreators
        refresh
    Connect Integration
      /api/connect
        onboard
        verify/:connectId
    Invitations
      /api/invite
        create
        my-invites
        status/:inviteToken
        accept
        :inviteId
    Notifications
      /api/notifications
        getNotifications
        mark-read
        delete
    Temp Users
      /api/temp-users
        convert/:userName
        status/:userName
        cleanup
```

## 9. Data Model Relationships

```mermaid
erDiagram
    USER {
        string _id
        string phone
        string email
        string userType
        object creatorData
        object marketerData
        array socialHandles
        array portfolio
        array favorites
        boolean isActive
        date createdAt
    }
    
    OFFER {
        string _id
        string marketerId
        string creatorId
        string status
        object details
        number budget
        array attachments
        date deadline
        array negotiationHistory
        date createdAt
    }
    
    DEAL {
        string _id
        string offerId
        string marketerId
        string creatorId
        string status
        array milestones
        array proofSubmissions
        array contentSubmissions
        object paymentInfo
        date createdAt
    }
    
    CHATROOM {
        string _id
        array participants
        string offerId
        object lastMessage
        object unreadCounts
        date createdAt
    }
    
    MESSAGE {
        string _id
        string chatId
        string senderId
        string content
        array attachments
        boolean isRead
        date createdAt
    }
    
    TEMPUSER {
        string _id
        string userName
        string status
        object profile
        array socialHandles
        date expiresAt
        date createdAt
    }
    
    EARNING {
        string _id
        string userId
        string dealId
        number amount
        string status
        string paymentMethod
        date createdAt
    }
    
    PAYOUT {
        string _id
        string marketerId
        string offerId
        number amount
        string status
        string stripePaymentId
        date createdAt
    }
    
    NOTIFICATION {
        string _id
        string userId
        string type
        string title
        string message
        object data
        boolean isRead
        date createdAt
    }
    
    USER ||--o{ OFFER : "creates/receives"
    OFFER ||--|| DEAL : "becomes"
    OFFER ||--|| CHATROOM : "triggers"
    USER ||--o{ MESSAGE : "sends"
    CHATROOM ||--o{ MESSAGE : "contains"
    DEAL ||--o{ EARNING : "generates"
    OFFER ||--|| PAYOUT : "requires"
    USER ||--o{ NOTIFICATION : "receives"
    TEMPUSER ||--o| USER : "converts to"
```

## 10. Error Handling & Status Flow

```mermaid
flowchart TD
    REQUEST[API Request] --> VALIDATE[Validate Input]
    VALIDATE -->|Valid| AUTH_CHECK[Check Authentication]
    VALIDATE -->|Invalid| ERROR_400[400 Bad Request]
    
    AUTH_CHECK -->|Authenticated| AUTHORIZE[Check Authorization]
    AUTH_CHECK -->|Not Authenticated| ERROR_401[401 Unauthorized]
    
    AUTHORIZE -->|Authorized| PROCESS[Process Request]
    AUTHORIZE -->|Not Authorized| ERROR_403[403 Forbidden]
    
    PROCESS -->|Success| SUCCESS_200[200 Success]
    PROCESS -->|Resource Not Found| ERROR_404[404 Not Found]
    PROCESS -->|Server Error| ERROR_500[500 Internal Error]
    PROCESS -->|Business Logic Error| ERROR_422[422 Unprocessable]
    
    SUCCESS_200 --> LOG_SUCCESS[Log Success]
    ERROR_400 --> LOG_ERROR[Log Error]
    ERROR_401 --> LOG_ERROR
    ERROR_403 --> LOG_ERROR
    ERROR_404 --> LOG_ERROR
    ERROR_422 --> LOG_ERROR
    ERROR_500 --> LOG_ERROR
    
    LOG_SUCCESS --> RESPONSE[Return Response]
    LOG_ERROR --> RESPONSE
    
    style SUCCESS_200 fill:#c8e6c9
    style ERROR_400 fill:#ffcdd2
    style ERROR_401 fill:#ffcdd2
    style ERROR_403 fill:#ffcdd2
    style ERROR_404 fill:#ffcdd2
    style ERROR_422 fill:#ffcdd2
    style ERROR_500 fill:#ffcdd2
```

---

## Summary

The Axees platform is a comprehensive influencer marketing platform with the following key characteristics:

### **Core Workflows:**
1. **User Onboarding** - Multi-step registration with OTP verification
2. **Creator Discovery** - AI-powered search with real-time backfill
3. **Offer Management** - Complex negotiation system with status tracking
4. **Deal Execution** - Milestone-based project management
5. **Payment Processing** - Escrow system with Stripe integration
6. **Real-time Communication** - Chat system with file sharing
7. **Content Management** - Approval workflows for deliverables

### **Technical Features:**
- **110+ API Endpoints** across 11 major modules
- **Real-time messaging** with Server-Sent Events
- **AI Integration** for creator discovery and profile generation
- **Comprehensive payment system** with escrow and automated payouts
- **Multi-stage approval workflows** for content and proof verification
- **Advanced notification system** with push notifications

### **Data Flow:**
- **User-centric design** with role-based permissions (Marketer/Creator)
- **Event-driven architecture** with status transitions
- **Comprehensive audit trails** for all transactions
- **Integration with external services** (Stripe, Firebase, Twilio, OpenAI)

This represents a production-ready, enterprise-grade platform for managing the complete influencer marketing lifecycle.
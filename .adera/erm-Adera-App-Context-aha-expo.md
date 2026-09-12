
 (By: Ermias Dejene Abesha - The MBet/MBet-Adera team)
---

### **1. Elaborate the Business Context in Explicit Details**

**Adera** is a unified, separately-independent, hybrid, dual-purpose platform running in native and web platforms identically and combining:

* **PTP (Peer-to-Peer) Parcel Delivery and Tracking System** -- "Adera-PTP"
* **E-Commerce Subsystem for Partner Shops** -- "Adera-Shops"

It is **designed for Addis Ababa**, optimized for low digital infrastructure, local languages, and common payment methods (cash, in-app wallet, Telebirr, Chapa, ArifPay). The system connects **senders**, **recipients**, **drivers**, **partners (pickup/drop-off shops)**, **sorting facility staff**, and **admins** in a role-based, trackable logistics flow. The added innovation is giving **partners** the ability to open **mini e-shops inside Adera**, promoting and selling their products via the Adera-shop platform.

The platform will:

* Allow parcel creation and real-time tracking
* Use QR codes and GPS for secure, verifiable logistics
* Support multilingual UI: English(Default), Amharic
* Offer a centralized, mini e-commerce platform for businesses to:
  * Sell items directly
  * Manage their inventory and earnings
* Integrate local payments and in-app wallet functionalities with fallback options (SMS, manual overrides)
* Operate in a **hub-and-spoke model** using verified Partners as micro-hubs

This hybrid system **increases demand** by serving multiple needs: logistics and commerce—making it more viable in Addis Ababa.

---

### **2. What Features Should Be Added to Make the App Efficient and Valuable?**

#### **Logistics Enhancements**
w
* **Dynamic pricing model**: Based on distance, weight, urgency
* **Route optimization for drivers** using React-native maps &/or OpenStreetMaps
* **Dispute resolution UI**: Media attachments, timelines
* **Real-time driver tracking on map** for customers

#### **E-Commerce Subsystem Features**

* The E-commerce platform of this System (i.e. 'Adera-Shops') is open for anyone, even for not signed-up users of Adera. (view shops on 'Guest-mode')

* However, for using the shop functionalities such as adding to Wishlist, Buy items/Checkouts, Reviewing & Rating, use Adera Delivery while purchasing items, ... - the user has to be prompted to register and necessarily has to be logged in.

* During checking out along with the option for using Adera Delivery services for the purchased items, the system shall automatically allow the customer, being the recipient, to raise/create the delivery order (which is an exceptional rule to our business policy for Adera-PTP parcel creation logic that defines the sender to be the only one entitled to trigger the parcel delivery order creation.)

* Partner shops can:
  * Upload items (image, price, category, ... )
  * Integrate their inventory with Adera logistics (autofill delivery creation)
  * Create/View/Update/Delete - CRUD operations for their market (shop) profile
  (- Here, they can define their available bank accounts &/or TeleBirr account for customers to purchase items from their shops via the payment gateways other than the in-app wallet transaction.)

* Support for:
  * Product reviews and ratings
  * Local promotion ads within Adera
  * Limited-time offers or flash sales

* Commission-based marketplace logic (Adera takes a 4% per item sold) and/or delivery fees
  (- Here, the commission fee shall be split between the buyer and the seller as 2% each.
  - The price of items will automatically include the commission fee before it appears on the shop for display.
  - This pricing details shall be clearly and transparently notified to both parties- the seller and the buyer
    - The seller(partner) has to see the pricing detail at every creation of shop items before posting it to the shop.
    - And the buyer(customer) has to be notified during explicitly during the checkout.)


#### **Business Analytics & Engagement**

* **Admin dashboard analytics**: sales trends, partner performance, heatmaps, ERP modules
* **Partner dashboards**: orders, traffic, sales conversion, earnings
* **Gamification for drivers/partners**: badges, ratings, performance tiers

---

### **3. Who Are the Potential Customers or Stakeholders? Ideal Market Niche?**

#### **Target Customers**

* Urban dwellers with busy schedules
* Small to medium merchants
* Online sellers using Telegram/Facebook who need fulfillment
* Adults mobile-first users (age 18–65)

#### **Primary Stakeholders**

* **Customers (Senders & Receivers)**
* **Partners**: small shops, stores, minimarkets
* **Drivers/Drivers**
* **Admins & Facility Staff**
* **Investors or future franchisees**

#### **Market Niche**

* Local commerce enablement via delivery (Shop + Ship)
* Offline-to-online conversion for small merchants in Ethiopia

---

### **4. Potential Risks or Negative Factors**

| Risk                                                         | Mitigation                                                       |
| ------------------------------------------------------------ | ---------------------------------------------------------------- |
| **Low initial demand**                                       | Incentivize referrals and early use with credits                 |
| **Competition from giants (e.g., Tolo, Eshi Delivery, DHL)** | Focus on underserved localities and partner integrations         |
| **Cash-based culture**                                       | Strong COD + in-app wallet + SMS fallback system                        |
| **Limited tech infrastructure**                              | Offline mode for scanning + SMS verification                     |
| **Partner drop-out or lack of trust**                        | Clear commission model, performance incentives, and transparency |
| **Parcel loss/disputes**                                     | QR + photo upload at every stage + receiver verification code    |
| **Language barriers**                                        | Full multilingual interface and localized UX                     |

---

### **5. Well-Defined Structure, Future Cases, and Business Growth**

#### **Core Structure**

* **Adera Platform = Logistics + E-Commerce**
* Modular, scalable with dedicated microservices for:

  * Parcel tracking
  * Partner store management
  * Real-time communication
  * Payments & commissions
* **Supabase**: Auth, DB, policies, storage, real-time chat
* **Frontend**: Expo-based cross-platform app with parallax-enhanced web app

#### **Future Development Scenarios**

* Expand to **B2B logistics**
* Franchise Adera micro-hubs across regions
* Last-mile delivery & micro-logistics in dense urban neighborhoods
* Offer **white-label delivery tech** to third parties
* Become a logistics API provider (e.g., delivery-as-a-service)
* Add features like **group orders (Bulk Orders)**, **scheduled deliveries**, or **multi-sender pooling**

---


#### **Core Business Processes**

| Operation          | Workflow                                                                                                                                 |
| ------------------ | -----------------------------------------------------------------------------------------------------------------------------------      |
| **Send Parcel**    | Customer → Select drop-off → Pay → Driver notified → Drop-off → Sort → Pickup → Delivery                                                |
| **Receive Parcel** | Beza(either a Customer or Walking Customer) gets tracking ID → Pickup code sent → Shows ID + code → Partner verifies + hands over        |
| **E-Shop Order**   | Buyer browses shop → Adds to cart → Checkout via Telebirr/Chapa → Item packed & shipped via Adera                                        |
| **Partner Payout** | Parcel/Item scanned → Status complete → Commission accrued → Auto payout weekly via API                                                  |

---

### **Final: Exhaustive Implementation Workflow**

#### 🔧 **Backend**

* Design Supabase tables: `users`, `parcels`, `events_log`, `partners`, `shops`, `items`, `orders`, `transactions`
* Configure RLS policies
* Implement tracking, QR logic, image storage
* Set up Supabase channels for real-time updates

#### 💻 **Frontend**

* Design role-based flows (Sender/Customer, Partner, Driver, Admin/, Staff/)
* UI/UX for parcel wizard, live map, shop creation
* Language JSONs + locale switching

#### 🧪 **Testing**

* Write unit tests for parcel creation, status updates
* Use Detox/E2E tests for delivery scenarios
* Simulate cases (COD decline, failed handoff, complaint filed)

#### 🚀 **Go-Live**

* Beta with 15–20 active partners
* Feedback loop with test users
* Public rollout with ad campaign + incentive (free deliveries, etc.) ....

---

======================================================================================================================================================================
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++



📲 Simulated User Flows

1. Parcel Sender (Alex's) Flow


- Opens Adera app → logs in

- Clicks “Send Parcel”

- Fills form: recipient name/phone, selects item type, adds photos

- Picks Drop-off & Pickup partners on map

- Selects payment method (e.g., wallet)

- Pays → Receives Tracking Code + QR

- Drops parcel at Drop-off Partner

- Gets real-time updates until delivery




2. Parcel Recipient (Beza's) Flow


- Gets SMS with tracking code

- Opens app or link → tracks parcel progress

- Gets notified when parcel is ready at Pickup Partner

- Goes to location → shows QR or code sent

- Verifies with partner → receives parcel

- Rates experience



3. Partner Shop Flow


- Registers via Partner Portal

- Gets dashboard: pending parcels, earnings, inventory

- Offers drop-off/pickup service

- Starts e-shop setup:

- Adds item listings

- Sets prices & delivery options

- Manages orders → ships via Adera system



4. Driver Flow


- Logs in → sees assigned pickups/deliveries

- Uses in-app map for navigation

- Scans parcels at every stage

- Marks deliveries, logs issues with photo evidence

- Earns commission → tracked in wallet



5. Admin Flow


- Logs in to web dashboard

- Sees KPIs: parcels, users, earnings, disputes

- Approves new partners

- Reviews flagged issues/disputes

- Manages automated payouts, promotions, system settings



======





---

## ✅ 1. **Partner Onboarding & E-Shop Setup Forms**

### 🔹 **Partner Registration Form**

| Field                       | Type                   | Required | Notes                               |
| --------------------------- | ---------------------- | -------- | ----------------------------------- |
| Business Name               | Text                   | ✅        | Displayed on storefront             |
| Legal Representative Name   | Text                   | ✅        | Person authorized to register       |
| Phone Number                | Phone                  | ✅        | Used for SMS verification           |
| Email Address               | Email                  | ✅        | Login and notifications             |
| Password / Confirm Password | Password               | ✅        | For secured access                  |
| Business Category           | Dropdown               | ✅        | Grocery, Fashion, Electronics, etc. |
| Shop Location               | Map Pin + Address Text | ✅        | Geo-coordinates for OSM integration |
| Operating Hours             | Time Range             | ✅        | Eg. Mon–Fri: 9am–7pm                |
| Accepted Payment Methods    | Checkboxes             | ✅        | COD, Telebirr, Chapa, ArifPay       |
| Accept Terms & Conditions   | Checkbox               | ✅        | Must be agreed                      |
| Upload Business License     | File (Image/PDF)       | Optional | Verification purpose                |
| Partner Logo                | Image Upload           | Optional | For storefront profile              |

---





==> For error resolution and better development, Refer to the documentations provided by the tech stacks used here, such as :

expo : https://docs.expo.dev/
react-native : https://reactnative.dev/docs/getting-started
Yenepay : https://github.com/yenepay
TeleBirr : https://developer.ethiotelecom.et/docs/GettingStarted
Chapa Payment Integration : https://developer.chapa.co/
Supabase : https://supabase.com/docs
Openstreetmap : https://wiki.openstreetmap.org/wiki/Develop
GitHub : https://docs.github.com/


++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
======================================================================================================================================================================


Adera – app Context : 

Here's a crystal-clear, comprehensive, and structured context definition and development roadmap for modern, full-fledged, elegant, and robust parcel delivery and tracking app, Adera, tailored specifically for its launch and use in Addis Ababa, Ethiopia.

🧠 Project Context: Adera Delivery & Tracking Platform
🌍 Purpose:
To revolutionize urban delivery in Addis Ababa with a user-friendly, real-time parcel tracking and delivery service that is secure, affordable, multilingual, and mobile-first, with role-based access and strong local integrations.

🔧 Tech Stack (Free/Open Source & Locally Compatible)
Layer	Stack
Frontend (Web + Mobile)	React Native with Expo (for iOS, Android, and Web)
Backend	Supabase (auth, storage, database, real-time capabilities)
Maps	OpenStreetMap (Web), react-native-maps + Mapbox or Leaflet for Native
Notifications	Expo Push Notifications (mobile), Supabase real-time + FCM
In-app Chat	Supabase Realtime (with Role-based message rooms)
Payments	Cash on Delivery, Telebirr, Chapa, ArifPay (via SDKs/APIs)
Languages	i18n via react-i18next or expo-localization
QR Code Generation & Scanning	react-native-qrcode-svg, expo-barcode-scanner
Authentication	Supabase Auth (email/password, OTP, third-party providers as needed)

👤 Role Definitions & Core Functionalities
1. Customer (eg.Abel… being the sender)
    • Create Delivery Orders
    • Choose Pickup/Drop-off Points
    • Real-Time Tracking
    • In-App Wallet & Payments
    • In-App and Push Notifications
    • Parcel History
    • Chat with Support/Driver
    • Takes pictures of parcel to be uploaded (max.3) … for visual cross-checking against wrong parcel to be dropped off
2. Customer (eg.Beza … being the Recipient)
    • Track Incoming Parcel
    • Confirm Delivery via Unique Code or QR
    • Chat with Sender or Support
    • Push/In-App Notifications
    • Takes pictures of parcel to be uploaded (max.3) … in case of complaint against wrongly handled/damaged parcel
3. Partner (Drop-off/Pick-up Point)
    • View Assigned Deliveries
    • Scan QR Codes for Check-in/Out
    • Verify Recipients with Pickup Codes
    • Update Parcel Status (Scanned/Received/Rejected)
    • Notification System (New Arrivals, Verification Needed)
    • 
4. Driver (Driver/Transporter)
    • View Daily Assigned Jobs
    • Real-Time Parcel Location Updates
    • Scan Parcels at Pickup/Dropoff
    • Navigation Support
    • In-App Chat with Customers & Staff
    • Delivery Confirmation with Timestamp
    • Bulk scan functionality for parcels
    • Fuel and expense tracking
    • Takes pictures of parcel to be uploaded (max.3) … in case of complaint against wrongly handled/damaged parcel or visual cross-checking against wrong parcel to pick up
    •  **Location Tracking:** GPS updates every 5 mins (stored in `parcel_events` table).  
    • 
5. Personnel (Sorting Facility Staff)
    • Scan & Verify Parcels at Facility
    • Assign Drivers for Outgoing Shipments
    • Update Sorting Status
    • Log Issues or Irregularities
    • Takes pictures of parcel to be uploaded (max.3) … in case of complaint against wrongly handled/damaged parcel or visual cross-checking against wrong parcel to pick up
6. Admin
    • Dashboard: View Overall Statistics
    • Manage Users & Roles
    • Partner Management
    • Payment Reconciliation
    • App Configuration & Support Chat Moderation
    • View Logs, Parcel Histories, and Disputes
    • Real-time KPIs (delivery volume, payment statuses, user reports & complaints).
    • (Access chat logs, parcel history, manual status overrides.)
    •   


🌐 Multilingual Requirements
Use react-i18next or expo-localization with language JSON files for:
    • English (default)
    • Amharic (አማርኛ)
    
Switch language based on system preference or manual selection from a language menu.


:      Role Interfaces 
    1. Customer-facing delivery creation flow
    2. Partner scanning dashboard
    3. Driver navigation interface
    4. Admin analytics portal



🧾 Delivery Flow – End-to-End Lifecycle
1. Order Creation – Abel (Customer)
    • Authenticates
    • Starts new delivery
    • Accepts terms (T&C + Prohibited Items modal)
    • Selects package type and details
    • Chooses pickup location via map (OpenStreetMap)
    • Selects nearest/preferred drop-off point (Partner)
    • Chooses payment option (Telebirr/Wallet/COD--Recipient-pays)
    • Confirms and gets QR + Tracking Code
    • Gets Push Notification
2. System Handling
    • Parcel entry saved in Supabase DB
    • Triggers real-time notifications (Driver, Partner, Beza)
    • Generates unique tracking ID, Pickup Code, and QR Code
    • Maps all future scans to statuses
3. Drop-off Phase – Partner
    • Scans QR (check-in)
    • Verifies sender
    • View inventories
    • View earnings (from commission)
    • System: Updates status: "At Dropoff Point"
    • System: Push notification to Driver and Sorting Center
4. Transit – Driver
    • Picks up package
    • Scans QR (logs timestamp + location)
    • System: Status: "In Transit to Facility"
5. Sorting Facility – Personnel
    • Receives parcel
    • Scans QR for intake
    • Assigns new Driver to a number of Pickup points
    • System: Generates Pickup Code for Beza
    • System: Status: "Sorted & Ready for Delivery"
6. Delivery – Driver to Pickup Point
    • Transports to final Partner location
    • System: QR scan confirms arrival
    • System: Push notification to Beza
    • System: Status: "Ready for Pickup"
7. Final Delivery – Beza (Recipient)
    • Receives notification
    • Enters code or scans QR at Partner
    • Verified + Digitally signs
    • System: Status: "Delivered"
    • Feedback & Rating screen appears

🔐 Security & Status Control
    • Role-based access control (RBAC) managed and RLS via Supabase policies
    • Parcel status flags: created, dropoff, facility_received, in_transit_to_facility_hub, in_transit_to_pickup_point/dispatched, pickup_ready, delivered
    • Every QR scan is tied to: timestamp, location, and user role
    • Conditional flows (e.g., pay-by-recipient requires recipient confirmation)
    • Biometrics option for the sensitive activities with the frontend


🛠️ Development Roadmap
Phase 1: Planning & Setup
    • Define schema & Supabase roles
    • Setup Supabase (DB, Auth, Storage, Policies)
    • Setup Expo + Monorepo for Mobile/Web
    • Define UI/UX for each role
Phase 2: Core Features
    • Auth Flow (login, signup, roles)
    • Customer Flow 
    • Partner Portal (PTP + Shop perspectives)
    • Driver Interface 
    • Basic Admin Dashboard 
Phase 3: Communication & Localization
    • Implement multilingual system
    • Real-time in-app chat (per order or user)
    • Push notification system (Expo + FCM)
    • SMS fallback for delivery confirmations
Phase 4: Payment Gateway Integrations
    • Add Cash on Delivery logic for the ecommerce and Cash on Dropoff logic for the PTP
    • Integrate:
        ◦ ✅ Telebirr (via Ethio Telecom API)
        ◦ ✅ Chapa or ArifPay (based on SDK docs)
    • Implement wallet system (deposit, pay, refund if order canceled)
Phase 5: Polishing & Launch
    • Thorough testing (Unit, E2E with Detox)
    • UI polishing for responsiveness
    • Launch Beta (internal team, invited partners)
    • Public rollout (Addis-wide)

Note:
•	COD – Here, it is to be noted that COD refers to two payment modes in our business model on the two apps: for the ecommerce flow (with Adera-Shop), COD refers the usual Cash on Delivery context. Here, the recipient will be expected to pay the amount required by the seller/s (partner shop/s) and the delivery fee expected by Adera for that instance. On the other hand, COD refers to Cash-on-Dropoff for the PTP flow (with Adera-PTP) where the dropoff partner, upon consent, will be paying the delivery fee on behalf of the sender via the implemented payment gateways and modes (This is useful for cases where the sender does not have balance either on banks or in-app wallet but cash on hand to give it to the partner upon notifying the partner 24 hours before dropoff and partner shows consent by confirming it on the system during those 24 hours). It is here to be noted as our business rule that parcel creation pends unless payment is completed with Adera-PTP.



📦 Database Schema Highlights (Supabase)
Tables:
    • users: profile, role, language
    • parcels: id, sender_id, recipient_info, pics, tracking_code, pickup_code, flag, status, timestamps
    • transactions: id, parcel_id, amount, payment_type, status
    • partners: id, location, loc_pic, working_hours
    • Drivers: id, assigned_parcels, pics_upload
    • messages: from_id, to_id, parcel_id, message, timestamp
    • notifications: user_id, message, type, read_status
    • events_log: action_type, actor_role, time, parcel_id, meta
    • parcel_events`:   `parcel_id`, `status`, `actor_id` (user who scanned), `location`, `timestamp`.  


🔗 Integrations
Feature	Tech
QR Code	react-native-qrcode-svg, expo-barcode-scanner
Map Display	react-native-maps, OpenStreetMap tiles
Real-time DB	Supabase Realtime Channels
Multilingual	react-i18next, expo-localization
Push Notifications	expo-notifications, Firebase Cloud Messaging (FCM)
Chat	Supabase + Realtime Channels
Payments	Telebirr API, Chapa/ArifPay SDKs





*** Role-Based System Design

Each role has dedicated screens, permissions, and workflows:

#* Customer
- **Primary Use Cases**: Create deliveries, track parcels, manage wallet
- **Key Features**:
  - **Parcel Creation Wizard**: 
    - Terms/Prohibited Items modal
    - Package size/type dropdowns (document, small, medium, large)
    - Map-based Partner selection (OpenStreetMap markers with distance ranking)
    - Dynamic pricing calculator (distance + size)
  - **Payment Options**:
    - Telebirr/Chapa integration via API/Webview
    - COD toggle (requires recipient confirmation)
    - In-app wallet (balance visible on dashboard)
  - **Tracking Dashboard**:
    - Live map with parcel route
    - Timeline view of status updates (created → at dropoff → in transit → delivered)
    - Digital signature capture upon delivery

#* Partner (Pickup/Dropoff Points)
- **Primary Use Cases**: Scan parcels, manage inventory, view earnings
- **Key Features**:
  - **QR Scanner**: 
    - Validate parcel eligibility via QR fusion code
    - Update parcel status (received/dropped off)
  - **Inventory Management**:
    - List of pending parcels with pickup codes
    - Filter by status/time
  - **Earnings Dashboard**:
    - Commission tracking per parcel
    - Withdrawal history (linked to Telebirr/Chapa)

##* Driver
- **Primary Use Cases**: Route optimization, parcel handover, status updates
- **Key Features**:
  - **Route Planner**:
    - Turn-by-turn navigation via OpenStreetMap
    - Batched parcel routes (sorted by proximity)
  - **Parcel Handover**:
    - Scan QR to update status (picked up from Partner → en route to Hub)
    - Photo capture for damage reports
  - **Earnings Tracker**:
    - Per-parcel commission
    - Performance metrics (deliveries/day)

#* Sorting Facility Personnel
- **Primary Use Cases**: Sort parcels, assign Drivers, resolve disputes
- **Key Features**:
  - **Sorting Interface**:
    - Bulk QR scanning for incoming parcels
    - Drag-and-drop assignment to Drivers
  - **Dispute Resolution**:
    - View parcel history + media (damage reports)
    - Admin chat for escalation
  - **Analytics Dashboard**:
    - Daily throughput
    - Delayed parcel alerts

#* Admin
- **Primary Use Cases**: Monitor operations, manage users, configure settings
- **Key Features**:
  - **Operations Dashboard**:
    - Real-time map of all parcels
    - Fraud detection (duplicate QR scans)
  - **User Management**:
    - Approve Partners
    - Ban fraudulent users
  - **Revenue Analytics**:
    - Profit margins per route
    - Payment method distribution

---

#* Key Technical Features
#* Multilingual Support
- **Implementation**:
  - `i18n-js` library with JSON translation files
  - Language switcher in profile settings (default: English)
  - RTL support for Amharic (limited, as Amharic script is LTR)
- **UI Adaptations**:
  - Dynamic font scaling for Amharic
  - Locale-aware date/time formatting

#* QR Code System
- **Structure**:
  - `QR_CODE = TRACKING_ID + PHASE_FLAG + TIMESTAMP + HASH`
- Example: `ADE20231001-2-1672531005-7c6d3a`

- **Phase Flags**:
  - 0: Created
  - 1: At Dropoff Partner
  - 2: Driver Picked Up (to Hub)/in_transit_to_hub
  - 3: At Sorting Hub
  - 4: Driver Picked Up (to Recipient)/dispatched
  - 5: At Pickup Partner
  - 6: Delivered

- **Validation Logic**:
  - Partners/Drivers scan QR → Backend verifies phase progression

##### **Notifications**
- **Channels**:
  - **Push**: Expo + Supabase Realtime (for active users)
  - **SMS**: Twilio or local gateway (EthioTel) for critical alerts
  - **In-App**: Persistent banner for unread notifications
- **Status Triggers**:
  - Parcel creation, phase updates, payment confirmations
  - Recipient verification code delivery

##### **Payment Flow**
- **COD Workflow**:
  - Sender selects COD → Recipient gets confirmation request (24-hour expiry)
  - If declined → Parcel auto-canceled, Partner notified
- **Gateway Integration**:
  - Telebirr: Mobile PIN-based OTP flow
  - Chapa: Embedded Webview with transaction receipt

---

==> For error resolution and better development, Refer to the documentations provided by the tech stacks used here, such as :

expo : https://docs.expo.dev/
react-native : https://reactnative.dev/docs/getting-started
Yenepay : https://github.com/yenepay
Arifpay : https://developer.arifpay.net/
TeleBirr : https://developer.ethiotelecom.et/docs/GettingStarted
Chapa Payment Integration : https://developer.chapa.co/
Supabase : https://supabase.com/docs
Openstreetmap : https://wiki.openstreetmap.org/wiki/Develop
GitHub : https://docs.github.com/



++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
======================================================================================================================================================================


The context inside the context for the PTP Delivery Services - (This is a basic, raw case scenario for the PTP flow - however, can be modified along development.)

Use Cases and System Scenario of the Adera app workflow implementation logic -

Suppose Alex sends a parcel to Beza.

Basic Elements in this transaction will be Alex (must be a member of this Adera-app - who has a "customer' role), Beza (she may either be a member of Adera-app or not- simply a walking customer who has no credential to log in to the app), a Dropoff-Point (who is a member of Adera with a role "partner") represented here as "P1" for the sake of simplicity, a Pickup-point (who is a member of Adera with a role "partner") represented here as "P2", the drivers (a member of the Adera system with a role of "driver") represented here by "D1" & "D2", the backend server denoted here as "S" and optionally, the staff who is an employee of Adera working at Parcel Sorting Facility Center/Hub identified by the role "staff" and "S1", "S2", "S3".


Having these notations established, a parcel delivery with Adera system/app always starts with the sender- in this case A. So, he fills out all the required fields in the form and hit the button to raise the CreateSendParcel event to the backend server. So, the data is created temporarily on the database which will be removed within 24 hours of creation if payment is not been made. Note that here- the tracking code which eventually be translated as the QR code affiliated to this order throughout the delivery life is composed of 4 basic components described as follows:

- ** QR Format - Structure **:
  ```
  QR_CODE = TRACKING_ID + PHASE_FLAG + TIMESTAMP + HASH
  Example: ADE20231001-2-1672531005-7c6d3a
  ```
- **Phase Flags**:
  - 0: Created
  - 1: At Dropoff Partner
  - 2: Driver Picked Up (to Hub)/in_transit_to_hub
  - 3: At Sorting Hub
  - 4: Driver Picked Up (to Recipient)/dispatched
  - 5: At Pickup Partner
  - 6: Delivered
- **Validation Logic**:
  - Partners/Drivers scan QR → Backend verifies phase progression
  - Each scan tied to timestamp, location, and user role
  - Phase transitions must follow valid sequence

++> Moreover, the last hash part (in this case, "7c6d3a") is again subjected to another hashing encryption alogorithm by the backend server upon the arrival of the pickup point ("P2") to give us a different string /eg, "k53y7f". Then, this newly generated code is sent to the designated receiver via SMS and/or in-app notificaion. This is to be used as a verification control logic that the right person came to fetch his/her exact parcel. So, at this point, the receiver may go to the the pickup point("P2") and will have to either show the respective partner the QR code generated with the new hash instead of the previous or will literally have to tell the partner the TRACKING_ID and also the new hash string sent to him on SMS. Then, when the partner enters the two codes he got from the receiver (in this case, Beza or someone whom Beza asked to go fetch the parcel), the Pickup Partner ("P2") will be confirmed of the rightful Recipient. Then, an SMS message and/or in-app notificaion will be sent to the receiver (Beza).


# Various Case Scenarios :

Here, we may assume 4 different cases

As stated, in all cases, the parcel delivery and eventually the tracking to follow begins with the creation of the parcel sending procedure by the sender (here, Alex) who is necessarily a user with a "customer" role in our supabase database to a receiver (Beza) whose phone number is inputted by Alex. Now, the possible, different case scenarios we will inspect/discuss here are:

    a) Alex pays the price required by the given parcel sending parameters.
case-1:     Alex pays the payment and sends the parcel

Alex fills the form with the CreateSend form, enters Beza's phone number, selects P1 and P2 of his choice sees the payment required based on the parameters he filled, then he pays the required amount either from his in-app wallet or his bank account through a payment gateway used by the app. Then the Backend Server confirms the parcel sending creation and notifies Alex, P1, H, P2 and Beza (if Beza is present in the profiles table of Adera). Additionally, The Server (S) analyzes and intelligently distributes the task to the staff it assigns and to a designated driver of Adera (D1)- to handle the fetching of the parcel from the Dropoff point.
Moreover, for accomodating both types of receivers and for a persistent, sound and noticeable alert, an SMS will be sent to Beza regardless of being a customer with Adera or not. The SMS will also carry the TRACKING_ID of the given parcel.


    b) Alex, currently has insufficient balance in his in-app wallet and/or his bank accounts with mobile banking, but has the required amount in cash; hence finds his prefered available dropoff-points accepting such payment requests.
case-2:     Alex waives the payment to be done by the dropoff-point partner of Adera.

Alex fills the form selecting a dropoff point that can process such payments, then this is created by S with a tracking id but finalized upon payment at P1. So, alex goes and gives the tracking id to P1, P1 checks for the details and pays after receiving the money. Then the complete database creation is being made at this stage.



    c) Alex waives the payment to be made by the receiver of this particular parcel- (Beza).

case-3:      Alex waived the payment to be done by Beza where Beza is a member of Adera

Here, Alex enters the information required by the form and waives the payment to receiver. Then a notification is sent to the receiver via sms and if no payment is made before 24hours, the order will be canceled. But if payment is being processed well accordingly, the normal transaction will be carried out as in case-1.


case-4:      Alex waived the payment to be done by Beza upon delivery where Beza is a walking customer who pays (the expected fee to Adera's bank account) from her balance at the bank

Here, Alex enters the information required by the form and waives the payment to receiver. Then a notification is sent to the receiver via sms and if no payment is made before 24hours, the order will be canceled. But if payment is being processed well accordingly, the normal transaction will be carried out as in case-1.



case-5:      Alex waived the payment to be done by Beza upon delivery where Beza is a walking customer who has Cash on Hand for this fee and requires the selection of Pickup-point partners with such an option - for them to pay from their wallet while receiving the cash from Beza.

In this case, what seems different from the above is, a P2 who is open for this payment service has to be selected. Then when the recepient delivers the cash payment to P2, then the hashed string will be sent to the receiver as an SMS and only then can the parcel be dispatched. 


---------------------
Note:
•	COD – Here, it is to be noted that COD refers to two payment modes in our business model on the two apps: for the ecommerce flow (with Adera-Shop), COD refers the usual Cash on Delivery context. Here, the recipient will be expected to pay the amount required by the seller/s (partner shop/s) and the delivery fee expected by Adera for that instance. On the other hand, COD refers to Cash-on-Dropoff for the PTP flow (with Adera-PTP) where the dropoff partner, upon consent, will be paying the delivery fee on behalf of the sender via the implemented payment gateways and modes (This is useful for cases where the sender does not have balance either on banks or in-app wallet but cash on hand to give it to the partner upon notifying the partner 24 hours before dropoff and partner shows consent by confirming it on the system during those 24 hours). It is here to be noted as our business rule that parcel creation pends unless payment is completed with Adera-PTP.

=====================



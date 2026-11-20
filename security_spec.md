# MH CARGO v2 Security Specification (Phase 0)

## 1. Data Invariants
1. **No Self-Assigned Admin Privileges**: A user creating `users/{uid}` may only select `role` in `['shipper', 'carrier']` and `accountStatus == 'active'`. Only existing admins or the bootstrapped admin email (`mohamedlayan666@gmail.com` with `email_verified == true`) hold admin rights.
2. **PII Isolation**: `users/{uid}` (containing `email`, `phone`) and `trucks/{truckId}` (containing `driverPhone`) are strictly readable only by the document owner or an admin.
3. **Immutable Ownership & Timestamps**: `createdAt` must equal `request.time` on creation and never change; `updatedAt` must equal `request.time` on both create and update. Ownership fields (`uid`, `shipperId`, `carrierId`, `reporterId`) are immutable.
4. **Offer Relational Integrity**: An offer in `offers/{offerId}` can only be created for an existing shipment whose `status == 'open'`, and `offer.shipperId` must match the parent shipment's `shipperId`.
5. **Atomic Commission Recording**: A commission record in `commissions/{commissionId}` created by a shipper accepting an offer requires the referenced shipment to be updated in the same batch (`existsAfter`), preventing orphaned or forged ledgers.
6. **Terminal State Locking**: Once a shipment reaches `completed` or `cancelled`, or an offer reaches `accepted`, `rejected`, or `withdrawn`, non-admin users cannot mutate it.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Self-Admin Registration**: `users/{uid}` create with `{ role: 'admin' }` -> DENIED.
2. **Ghost Field Injection (Shadow Update)**: `shipments/{id}` create or update with extra key `{ isPriorityVerified: true }` -> DENIED by `hasOnly`.
3. **Unverified Email Spoofing**: Request with `email == 'mohamedlayan666@gmail.com'` and `email_verified == false` -> DENIED.
4. **Cross-Tenant PII Read**: Shipper A requesting `get(/users/carrierB)` or `get(/trucks/truckB)` -> DENIED.
5. **Blanket List Scraping**: Client calling `getDocs(collection(db, 'users'))` without admin rights -> DENIED.
6. **ID Poisoning (1MB ID)**: Creating `/shipments/AAAA...(1500 chars)` -> DENIED by `isValidId()` (`size() <= 128` + regex).
7. **Shipper Impersonation**: Carrier creating a shipment with `shipperId: 'victim_uid'` -> DENIED.
8. **Offer on Closed Shipment**: Carrier submitting an offer when `shipment.status == 'assigned'` -> DENIED.
9. **Carrier Self-Approval**: Carrier updating `carrierProfiles/{uid}` with `verificationStatus: 'approved'` -> DENIED by `affectedKeys().hasOnly(...)` + equality check.
10. **Role Switching**: User updating `users/{uid}` to change `role` from `'shipper'` to `'carrier'` -> DENIED.
11. **Terminal State Mutation**: Shipper updating a `'completed'` shipment back to `'open'` -> DENIED.
12. **Commission Rate Tampering**: Shipper updating `platformSettings/commissions` -> DENIED (admin-only).

# Firestore Security Specification

## Data Invariants
1. Users can only read and write their own profile (except balance which is system/admin controlled for updates).
2. Users can create payment requests but cannot modify them once created (except for status which is admin only).
3. Users can only list their own payments and orders.
4. Admins have full read/write access to everything.

## The Dirty Dozen Payloads (Rejection Tests)
1. **Identity Spoofing**: Attempt to create a user profile with a different UID.
2. **Balance Injection**: Attempt to set own balance during profile creation.
3. **Ghost Update**: Attempt to update another user's balance.
4. **UTR Poisoning**: Attempt to submit a 1MB string as a UTR.
5. **Status Hijack**: Attempt to self-approve a pending payment.
6. **Orphan Payment**: Create a payment for a non-existent user or without request.auth.uid.
7. **Negative Amount**: Submit a payment request with a negative amount.
8. **Admin Claim Spoofing**: Attempt to write to `/admins` collection.
9. **Order Price Manipulation**: Place an order with 0 price in Firestore.
10. **Terminated State Update**: Attempt to modify a payment that is already 'approved'.
11. **Blanket Read Request**: Unified query for all payments without owner filtering.
12. **Id Poisoning**: Using a 2KB string as a document ID for an order.

## Verification
Tests will be implemented to ensure all these payloads fail `PERMISSION_DENIED`.

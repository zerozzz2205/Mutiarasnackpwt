# Security Specification: "Fortress" Firestore Security Rules (TDD)

## 1. Data Invariants

- **Read Access**:
  - The `products`, `portfolios`, and `media_gallery` collections are public-read since customers need to browse products/portfolio and use the photo gallery.
  - The `location` settings are public-read so customers can retrieve directions.
- **Write Access**:
  - Only authenticated admin users can write (create, update, delete) `products`, `portfolios`, `media_gallery`, and `location` settings.
  - Every document ID created must be validated using string length constraints (maximum 128 characters) and alphanumeric Regex pattern checking (`^[a-zA-Z0-9_\-]+$`) to prevent Resource Poisoning or Injection attacks.
  - No system or immutable fields (`id`, `createdAt`) can be updated after creation or bypassed during validation.

---

## 2. The "Dirty Dozen" Payloads

Here are twelve specific JSON payloads designed to violate Identity, Integrity, and State boundaries:

1. **Payload 1: Anonymous Product Creation**
   - Attempting to write a product without being authenticated.
   - *Target*: `create` on `/products/prod_123`
   - *Result*: `PERMISSION_DENIED` (Auth check failure)

2. **Payload 2: SQL Injection / Path Poisoning ID**
   - Attempting to inject unsafe document IDs into portfolios.
   - *Target*: `create` on `/portfolios/portfolio-id:injection&characters`
   - *Result*: `PERMISSION_DENIED` (ID verification regex failure)

3. **Payload 3: Out of Boundaries Product Price**
   - Attempting to write a negative price for a product.
   - *Target*: `create` on `/products/prod_negative` with price `-5000`
   - *Result*: `PERMISSION_DENIED` (Value constraint violation in schema validator)

4. **Payload 4: Giant Payload Denial of Wallet**
   - Ingesting a large detail string in a portfolio to exhaust resources.
   - *Target*: `create` on `/portfolios/port_1` with detail string > 10KB.
   - *Result*: `PERMISSION_DENIED` (String length validation failure)

5. **Payload 5: Unauthorized Location Edit**
   - Non-admin user updating geo-coordinates or location settings.
   - *Target*: `update` on `/location/settings`
   - *Result*: `PERMISSION_DENIED` (Auth verification failure)

6.  **Payload 6: Spoofed Product ID**
    - Unauthenticated user attempting to pass an ID mismatch during creation.
    - *Target*: `create` on `/products/prod_1` where `payload.id` is `'prod_2'`
    - *Result*: `PERMISSION_DENIED` (Schema ID matching invariant violation)

7.  **Payload 7: Unverified User Write Attempt**
    - User with `email_verified == false` trying to write a product.
    - *Target*: `create` on `/products/prod_1`
    - *Result*: `PERMISSION_DENIED` (Verification requirement failure)

8.  **Payload 8: Immutable ID Overwrite**
    - Attempting to modify the immutable `id` field of a product during update.
    - *Target*: `update` on `/products/prod_1` with changing ID
    - *Result*: `PERMISSION_DENIED` (Immutability check failed)

9.  **Payload 9: Empty Schema Properties Bypass**
    - Product payload where required properties like `category` are missing.
    - *Target*: `create` on `/products/prod_1` with missing category property
    - *Result*: `PERMISSION_DENIED` (Required property check failure)

10. **Payload 10: Value Poisoning (Type Mismatch)**
    - Sending a floating-point or boolean value into the `name` field of a product.
    - *Target*: `create` on `/products/prod_1` with `name = true`
    - *Result*: `PERMISSION_DENIED` (Type check failure in validation helper)

11. **Payload 11: Media Asset Host Spaying**
    - Ingesting junk chars in `media_gallery` URLs.
    - *Target*: `create` on `/media_gallery/img_1` with URL length > 5000 chars.
    - *Result*: `PERMISSION_DENIED` (Security constraint on string limits)

12. **Payload 12: Administrative Bypass Spoof**
    - Regular user trying to write with custom claims.
    - *Target*: `create` on `/products/prod_1`
    - *Result*: `PERMISSION_DENIED` (Missing real verified authentication)

---

## 3. Test Script Framework (TDD)

```typescript
// firestore.rules.test.ts
import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "ambient-engine-98gvj",
    firestore: {
      rules: `
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            // Fortress rules go here...
          }
        }
      `
    }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

test('Should deny guest product creation', async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(setDoc(doc(unauthDb, 'products/prod_123'), { name: 'Item', price: 100 }));
});
```

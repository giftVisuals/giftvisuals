# Creator Portal: 10-minute setup

Live address: https://giftvisuals.com.ng/creators/ (runs in preview mode until step 3).

1. Go to https://console.firebase.google.com, click **Add project**, name it `creator-portal`, finish.
2. **Build > Authentication > Get started > Google > Enable > Save.**
   Then **Settings > Authorized domains > Add domain:** `giftvisuals.com.ng`.
3. **Project settings (gear) > Your apps > Web (</>)**, register, copy `apiKey`, `authDomain`, `projectId`, `appId`
   into `creators/config.js`. (These are public keys, safe to share.) Also set `brand` and `brandAbout`.
4. **Build > Firestore Database > Create database** (production mode, any region).
   Open the **Rules** tab, paste everything from `creators/firestore.rules`, **Publish**.
5. Make yourself and your boss admins: Firestore > **Start collection** `admins` > Document ID = the admin's
   Google email (exactly) > add any field, e.g. `role` = `admin` > Save. Repeat for each admin.
6. Open the portal, sign in with Google. Admins see the Admin side; everyone else sees the creator side.

// Creator Portal settings. Edit these, then push. Nothing here is secret.
window.PORTAL_CONFIG = {
  brand: "Our Brand",                 // the brand creators will post about
  brandAbout: "a product people love", // one short line: what the brand does
  // Admins (you and your boss) are NOT listed here, so their emails stay private.
  // Add each admin in Firebase console > Firestore > collection "admins" > document ID = their Google email.
  goal: 50,                           // target approved creators per platform
  rates: {
    reddit_post: 7,                   // USD per Reddit post
    reddit_comment: 5                 // USD per week of Reddit comments
  },
  // Paste your Firebase web app config here (Firebase console > Project settings > Your apps).
  // Leave apiKey empty to run in preview mode (nothing is saved).
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    appId: ""
  }
};

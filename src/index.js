const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const app = express();
const port = process.env.PORT || 8080;

// CS5356 TODO #2

// const firebaseConfig = {
//   apiKey: "AIzaSyC8GgODYkcCzFvniHSUib8_GGfNYObdZqg",
//   authDomain: "cs5356-milestone-1.firebaseapp.com",
//   projectId: "cs5356-milestone-1",
//   storageBucket: "cs5356-milestone-1.appspot.com",
//   messagingSenderId: "173231515017",
//   appId: "1:173231515017:web:884d88d2a5a755933cad58"
// };

// Uncomment this next line after you've created
// serviceAccountKey.json
// const serviceAccount = require("./../config/serviceAccountKey.json");
const serviceAccount = require("./../serviceAccountKey.json");
const userFeed = require("./app/user-feed");
const authMiddleware = require("./app/auth-middleware");
const { getAuth } = require("firebase-admin/auth");
const { debug } = require("nodemon/lib/utils");

// CS5356 TODO #2
// Uncomment this next block after you've created serviceAccountKey.json
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// use cookies
app.use(cookieParser());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
// set the view engine to ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/static", express.static("static/"));

// use res.render to load up an ejs view file
// index page
app.get("/", function(req, res) {
  res.render("pages/index");
});

app.get("/sign-in", function(req, res) {
  res.render("pages/sign-in");
});

app.get("/sign-up", function(req, res) {
  res.render("pages/sign-up");
});

app.get("/dashboard", authMiddleware, async function(req, res) {
  const feed = await userFeed.get();
  res.render("pages/dashboard", { user: req.user, feed });
});

app.post("/sessionLogin", async (req, res) => {
  // CS5356 TODO #4
  // Get the ID token from the request body
  // Create a session cookie using the Firebase Admin SDK
  // Set that cookie with the name 'session'
  // And then return a 200 status code instead of a 501
  const idToken = req.body.idToken;
  const expiresIn = 1000 * 60 * 60 * 24;
  admin.auth()
    .createSessionCookie(idToken, { expiresIn })
    .then(
      sessionCookie => {
        // Set cookie policy for session cookie.
        const options = { maxAge: expiresIn, httpOnly: true };
        res.cookie("session", sessionCookie, options);
        res.status(200).send(JSON.stringify({ status: "success" }));
      },
      error => {
        res.status(401).send("UNAUTHORIZED REQUEST!");
      }
    );
});

app.get("/sessionLogout", (req, res) => {
  res.clearCookie("session");
  res.redirect("/sign-in");
});

app.post("/dog-messages", authMiddleware, async (req, res) => {
  // CS5356 TODO #5
  // Get the message that was submitted from the request body
  // Get the user object from the request body
  // Add the message to the userFeed so its associated with the user
  try {
    const message = req.body.message;
    await userFeed.add(req.user, message);
    res.redirect("/dashboard");
  } catch (err) {
    res.status(500);
  }
});

app.listen(port);
console.log("Server started at http://localhost:" + port);

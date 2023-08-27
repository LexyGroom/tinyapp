const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca", // http://localhost:8080/u/b2xVn2
  "9sm5xK": "http://www.google.com"
};

const users = {};

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// http://localhost:8080/urls
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id],
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { 
    id: req.params.id, 
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies.user_id],
  };
  res.render("urls_show", templateVars);
});

// example: redirect http://localhost:8080/u/b2xVn2 to its longURL of http://www.lighthouselabs.ca
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id]
  };
  res.render("urls_registration", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id]
  };
  res.render("urls_login", templateVars);
});

// function that returns a string of 6 random alphanumeric numbers
const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function generateRandomString() {
  let result = ' ';
    const charactersLength = characters.length;
    for (let chars = 0; chars < 6; chars++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

// save new longURL and new shortURL to urlDatabase
app.post("/urls", (req, res) => {
  const id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

// delete URL from the database and redirect to /urls
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// save newURL to database after updating, redirect to /urls
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.newLongURL;
  res.redirect("/urls");
});

// user lookup helper function intake email and output user object or null if not found
function getUserByEmail(email) {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
};

// check if already a user, if password is correct, if yes, set the cookie and redirect to /urls 
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email);

  if (!user) {
    res.status(403).send("Email or password is incorrect.");
  } else if (user.password !== password) {
    res.status(403).send("Email or password is incorrect.");
  } else {
    res.cookie("user_id", user.id);
    res.redirect("/urls");
  }
});

// clear the cookie and redirect to /urls
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.status(403).send("Email and password are required.");
    return;
  }

  const existingUser = getUserByEmail(email);

  if (existingUser) {
    res.status(403).send("Email already exists. Please use a different email.");
    return;
  }

  const userId = generateRandomString();

  const newUser = {
    id: userId,
    email: email,
    password: password
};

  users[userId] = newUser;

  res.cookie("user_id", userId);
  console.log(users)
  res.redirect("/urls");
});

// port identification
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
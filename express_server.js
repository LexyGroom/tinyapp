const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const helpers = require("./helpers");

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {};

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['secretKey01', 'secretKey02'],
}));

// http://localhost:8080/urls
app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  const userUrls = {};

  if (user) {
    for (const id in urlDatabase) {
      if (urlDatabase[id].userID === user.id) {
        userUrls[id] = urlDatabase[id];
      }
    }
  }

  const templateVars = {
    urls: userUrls,
    user: user,
  };
  
  res.render("urls_index", templateVars);
});

// http://localhost:8080/urls/new
app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    const templateVars = {
      user: users[req.session.user_id],
    };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const user = users[req.session.user_id];
  const url = urlDatabase[id];

  if (!url) {
    res.status(404).send("URL not found");
    return;
  }
  
  const templateVars = {
    id: id,
    url: url,
    user: user,
  };

  res.render("urls_show", templateVars);
});

// redirect short URL to longURL
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  if (!urlDatabase[id]) {
    res.status(404).send(`${id} does not exist!`);
    return;
  }
  const longURL = urlDatabase[id].longURL;
  res.redirect(longURL);
});

// http://localhost:8080/register
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("urls_registration", templateVars);
  }
});

// http://localhost:8080/login
app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[req.session.user_id]
    };
    res.render("urls_login", templateVars);
  }
});

// save new longURL and new shortURL to urlDatabase
app.post("/urls", (req, res) => {
  const user = users[req.session.user_id];

  if (!user) {
    res.status(403).send("You must be logged in to create new URLs.");
    return;
  }
  
  const id = helpers.generateRandomString();
  urlDatabase[id] = {
    longURL: req.body.longURL,
    userID: user.id,
  };
  res.redirect(`/urls/${id}`);
});

// delete URL from the database and redirect to /urls
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  const user = users[req.session.user_id];
  const url = urlDatabase[id];

  if (!user) {
    res.status(403).send("You must be logged in to delete URLs.");
    return;
  }
  if (!url) {
    res.status(404).send("URL not found");
    return;
  }
  if (url.userID !== user.id) {
    res.status(403).send("You do not have permission to delete this URL.");
    return;
  }
  delete urlDatabase[id];
  res.redirect("/urls");
});

// save newURL to database after updating, redirect to /urls
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const user = users[req.session.user_id];
  const url = urlDatabase[id];

  if (!user) {
    res.status(403).send("You must be logged in to edit URLs.");
    return;
  }
  if (!url) {
    res.status(404).send("URL not found");
    return;
  }
  if (url.userID !== user.id) {
    res.status(403).send("You do not have permission to edit this URL.");
    return;
  }
  url.longURL = req.body.newLongURL;
  res.redirect("/urls");
});

// check if already a user, if password is correct, if yes, set the cookie and redirect to /urls
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = helpers.getUserByEmail(email, users);

  if (!user) {
    res.status(403).send("Email or password is incorrect.");
    return;
  }

  const passwordMatch = bcrypt.compareSync(password, user.password);

  if (!passwordMatch) {
    res.status(403).send("Email or password is incorrect.");
    return;
  }
  req.session.userId = user.id;
  res.redirect("/urls");
});

// clear the cookie and redirect to /urls
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.status(403).send("Email and password are required.");
    return;
  }

  const existingUser = helpers.getUserByEmail(email, users);

  if (existingUser) {
    res.status(403).send("Email already exists. Please use a different email.");
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const userId = helpers.generateRandomString();

  const newUser = {
    id: userId,
    email: email,
    password: hashedPassword
  };
  users[userId] = newUser;
  req.session.userId = userId;
  res.redirect("/urls");
});

// port identification
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
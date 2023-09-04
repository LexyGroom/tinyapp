const express = require("express");
const cookieParser = require("cookie-parser");
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
  const user = users[req.cookies.user_id];
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
  if (!req.cookies.user_id) {
    res.redirect("/login");
  } else {
  const templateVars = {
    user: users[req.cookies.user_id],
  };
  res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const user = users[req.cookies.user_id];
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
  if (!urlDatabase[id].longURL) {
    res.status(404).send(`${id} does not exist!`);
    return;
  }
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// http://localhost:8080/register
app.get("/register", (req, res) => {
  if (req.cookies.user_id) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[req.cookies.user_id]
    };
    res.render("urls_registration", templateVars);
  }
});

// http://localhost:8080/login
app.get("/login", (req, res) => {
  if (req.cookies.user_id) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[req.cookies.user_id]
    };
    res.render("urls_login", templateVars);
  }
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
  const user = users[req.cookies.user_id];

  if (!user) {
    res.status(403).send("You must be logged in to create new URLs.");
    return;
  }
  
  const id = generateRandomString();
  urlDatabase[id] = {
    longURL: req.body.longURL,
    userID: user.id,
  };
  res.redirect(`/urls/${id}`);
});

// delete URL from the database and redirect to /urls
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  const user = users[req.cookies.user_id];
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
  const user = users[req.cookies.user_id];
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
  res.redirect("/urls");
});

// port identification
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
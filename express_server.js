const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca", // http://localhost:8080/u/b2xVn2
  "9sm5xK": "http://www.google.com"
};

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
    username: req.cookies.username
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies.username,
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { 
    id: req.params.id, 
    longURL: urlDatabase[req.params.id],
    username: req.cookies.username,
  };
  res.render("urls_show", templateVars);
});

// example: redirect http://localhost:8080/u/b2xVn2 to its longURL of http://www.lighthouselabs.ca
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
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
  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL
  res.redirect(`/urls/${id}`);
});

// delete URL from the database and redirect to /urls
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id]
  res.redirect("/urls");
});

// save newURL to database after updating, redirect to /urls
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id] = req.body.newLongURL;
  res.redirect("/urls");
});

// handle post request to /login
// set a cookie named 'username' to the value submitted in the login form
  //use res.cookie to set the cookie value
// redirect to /urls
app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie("username", username);
  res.redirect("/urls");
});

// clear the username cookie and redirect to /urls
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

// port identification
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
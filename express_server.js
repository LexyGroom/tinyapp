const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca", // http://localhost:8080/u/b2xVn2
  "9sm5xK": "http://www.google.com"
};

app.use(express.urlencoded({ extended: true }));

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
  const templateVars = {urls: urlDatabase};
  res.render("urls_index", templateVars)
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

//example: redirect http://localhost:8080/u/b2xVn2 to its longURL of http://www.lighthouselabs.ca
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  console.log(longURL);
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

app.post("/urls", (req, res) => {
  //console.log(req.body); // Log the POST request body to the console
  let id = generateRandomString();
  // save longURL and shortURL to urlDatabase
  urlDatabase[id] = req.body.longURL
  res.redirect(`/urls/${id}`)
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id]
  res.redirect("/urls/")
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
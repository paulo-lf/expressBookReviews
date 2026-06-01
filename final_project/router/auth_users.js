const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{
  // Filter the users array for any user with the same name
  let userwithsamename = users.filter((user)=>{
    return user.username === username;
  });

  // Return true if any user with the same username is found, otherwise false
  if (userwithsamename.length > 0) {
    return true;
  } else {
    return false;
  }
};

// Check if the user with the given username and password exists
const authenticatedUser = (username,password)=>{
  // Filter the users array for a user with the given username and password
  let validusers = users.filter((user)=>{
    return (user.username === username && user.password === password);
  });
  
  // Return true if a valid user is found, otherwise false
  if (validusers.length > 0) {
    return true;
  } else {
    return false;
  }
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(404).json({message: "Error logging in"});
  }
  
  if (authenticatedUser(username, password)) {
    let accessToken = jwt.sign({data: password}, 'access', {expiresIn: 60 * 60});
    req.session.authorization = {accessToken, username};
    return res.status(200).send("User successfully logged in");
  }

  return res.status(208).json({message: "Invalid Login. Check username and password"});
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization.username;

  if (!review) {
    return res.status(400).json({message: "Review is required"});
  }

  if (!books[isbn]) {
    return res.status(404).json({message: "Book not found"});
  }

  const reviewExists = books[isbn].reviews[username];

  books[isbn].reviews[username] = review;

  if (reviewExists) {
    return res.status(200).json({message: "Review successfully modified"});
  }

  return res.status(200).json({message: "Review successfully added"});
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;

  if (!books[isbn]) {
    return res.status(404).json({message: "Book not found"});
  }

  if (!books[isbn].reviews[username]) {
    return res.status(404).json({message: "Review not found"});
  }

  delete books[isbn].reviews[username];
  return res.status(200).json({message: "Review successfully deleted"});
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;

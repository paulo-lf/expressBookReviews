const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


public_users.post("/register", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  // Check if both username and password are provided
  if (!username || !password) {
    return res.status(400).json({message: "Username and password are required"});
  }

  if (!isValid(username)) {
    // Add the new user to the users array
    users.push({"username": username, "password": password});
    return res.status(200).json({message: "User successfully registered. Now you can login"});
  } else {
    return res.status(400).json({message: "User already exists!"});
  }
  // Return error if username or password is missing
  return res.status(400).json({message: "Unable to register user."});
});

// Get the book list available in the shop
public_users.get('/',function (req, res) {
  return new Promise((resolve, reject) => {
    if (books) {
      resolve(books);
    } else {
      reject("Books not found");
    }
  })
    .then((booksList) => res.send(JSON.stringify(booksList, null, 4)))
    .catch((error) => res.status(404).json({message: error}));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
  const isbn = req.params.isbn;

  return new Promise((resolve, reject) => {
    if (books[isbn]) {
      resolve(books[isbn]);
    } else {
      reject("Book not found");
    }
  })
    .then((book) => res.send(book))
    .catch((error) => res.status(404).json({message: error}));
});
  
// Get book details based on author
public_users.get('/author/:author',function (req, res) {
  const author = req.params.author;

  return new Promise((resolve, reject) => {
    const matchingBooks = Object.values(books).filter(book => book.author === author);

    if (matchingBooks.length > 0) {
      resolve(matchingBooks);
    } else {
      reject("Author not found");
    }
  })
    .then((booksByAuthor) => res.send(booksByAuthor))
    .catch((error) => res.status(404).json({message: error}));
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  const title = req.params.title;

  return new Promise((resolve, reject) => {
    const matchingBooks = Object.values(books).filter(book => book.title === title);

    if (matchingBooks.length > 0) {
      resolve(matchingBooks);
    } else {
      reject("Title not found");
    }
  })
    .then((booksByTitle) => res.send(booksByTitle))
    .catch((error) => res.status(404).json({message: error}));
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (book) {
    return res.send(book.reviews);
  }

  return res.status(404).json({message: "Book not found"});
});

module.exports.general = public_users;

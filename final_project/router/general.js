const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const BOOKS_API_URL = `http://localhost:${process.env.PORT || 5001}/`;

// Public book review routes.
// These routes handle registration and read-only book lookup operations that do
// not require an authenticated session.

/**
 * Normalize the response returned by the local books API.
 *
 * Some routes fetch the book catalog with axios instead of reading booksdb.js
 * directly. Depending on the server response, axios may return parsed JSON or a
 * JSON string, so this helper guarantees the route handlers receive an object.
 *
 * @param {object} response - Axios response from the books API.
 * @returns {object} Book catalog keyed by ISBN.
 */
const getBooksFromResponse = (response) => {
  return typeof response.data === "string" ? JSON.parse(response.data) : response.data;
};

// Register a new public user when both username and password are provided.
// Usernames must be unique according to auth_users.isValid().
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

// Return the complete book catalog available in the shop.
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

// Retrieve one book by ISBN using axios to read from the local books API.
public_users.get('/isbn/:isbn',function (req, res) {
  const isbn = req.params.isbn;

  return axios.get(BOOKS_API_URL)
    .then((response) => {
      const booksList = getBooksFromResponse(response);

      if (booksList[isbn]) {
        return res.send(booksList[isbn]);
      }

      return res.status(404).json({message: "Book not found"});
    })
    .catch(() => res.status(500).json({message: "Unable to fetch books"}));
});
  
// Retrieve all books written by the requested author using axios.
// The match is exact and case-sensitive because it compares stored author names directly.
public_users.get('/author/:author',function (req, res) {
  const author = req.params.author;

  return axios.get(BOOKS_API_URL)
    .then((response) => {
      const booksList = getBooksFromResponse(response);
      const matchingBooks = Object.values(booksList).filter(book => book.author === author);

      if (matchingBooks.length > 0) {
        return res.send(matchingBooks);
      }

      return res.status(404).json({message: "Author not found"});
    })
    .catch(() => res.status(500).json({message: "Unable to fetch books"}));
});

// Retrieve all books with the requested title using axios.
// The match is exact and case-sensitive because it compares stored titles directly.
public_users.get('/title/:title',function (req, res) {
  const title = req.params.title;

  return axios.get(BOOKS_API_URL)
    .then((response) => {
      const booksList = getBooksFromResponse(response);
      const matchingBooks = Object.values(booksList).filter(book => book.title === title);

      if (matchingBooks.length > 0) {
        return res.send(matchingBooks);
      }

      return res.status(404).json({message: "Title not found"});
    })
    .catch(() => res.status(500).json({message: "Unable to fetch books"}));
});

// Return the reviews object for a book identified by ISBN.
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (book) {
    return res.send(book.reviews);
  }

  return res.status(404).json({message: "Book not found"});
});

module.exports.general = public_users;

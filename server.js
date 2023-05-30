const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

// Load routes
const routes = require('./routes');

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// Load routes
app.use('/', routes);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

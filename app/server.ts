import { createServer } from "http";
import next from "next";


// Get the port from the environment variables
const port = parseInt(process.env.PORT || "3000", 10);
// Get the development environment from the environment variables
const dev = process.env.NODE_ENV !== "production";
// Create the next app
const app = next({ dev });
// Get the request handler from the next app
const handle = app.getRequestHandler();

// Prepare the next app
app.prepare().then(() => {
  // Create the server
  createServer((req, res) => {
    // Handle the request
    handle(req, res);
    // Listen to the port
  }).listen(port);
  // Log the server listening
  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? "development" : process.env.NODE_ENV
    }`
  );
});

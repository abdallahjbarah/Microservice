const axios = require("axios");

const API_URL =
  "https://ee6trj6l31.execute-api.us-east-1.amazonaws.com/prod/orders";

async function test() {
  // Valid order
  let response = await axios.post(API_URL, { items: ["Book", "Pen"] });
  console.log("Valid order response:", response.data);

  // Invalid order (empty)
  try {
    await axios.post(API_URL, { items: [] });
  } catch (err) {
    console.log("Invalid order response:", err.response.data);
  }

  // Get all orders
  response = await axios.get(API_URL);
  console.log("All orders:", response.data);
}

test();

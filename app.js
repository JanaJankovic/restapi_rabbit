const express = require("express");
const amqplib = require("amqplib");

const open = amqplib.connect("amqp://localhost:5672");
let channel;

open
  .then((conn) => conn.createChannel())
  .then((ch) => {
    channel = ch;
    ch.assertQueue("publisher");
  });

var app = express();

app.post("/publish/:message", (req, res) => {
  console.log(`message: ${req.params.message}`);
  channel.sendToQueue("publisher", Buffer.from(req.params.message));
  res.send("");
});

app.listen(5000, function () {
  console.log("Started application on port %d", 5000);
});

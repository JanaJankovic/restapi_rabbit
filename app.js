const express = require("express");
const amqplib = require("amqplib");

var app = express();

app.listen(5000, function () {
  console.log("Started application on port %d", 5000);
});

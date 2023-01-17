const express = require("express");
const mongoose = require("mongoose");
require("dotenv/config");
const bodyParser = require("body-parser");

var app = express();

/**CORS ERRORS------------------------------------------- */
app.use(bodyParser.json());
var cors = require("cors");
var allowedOrigins = [
  "http://localhost:4200",
  "http://localhost:4300",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
];

app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        var msg =
          "The CORS policy for this site does not " +
          "allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);
/**CORS ERRORS------------------------------------------- */

//mongoose
mongoose.connect(process.env.DB_CONNECTION, () => {
  console.log("connected to mongo");
});

/*RABBIT start----------------------------------------------------------------*/
const amqp = require("amqplib");
let connection = undefined;
let channel = undefined;

async function connect() {
  connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertExchange(process.env.EXCHANGE, "direct", {
    durable: true,
  });
  await channel.assertQueue(process.env.QUEUE);
}
connect();
app.use((req, res, next) => {
  req.channel = channel;
  next();
});

/*RABBIT end ------------------------------------------------------------------------*/

/*API END POINTS---------------------------------------------------------------------- */
var moment = require("moment");

const LogsSchema = mongoose.Schema({
  datetime: {
    type: Date,
    required: true,
  },
  data: {
    type: Array,
    required: true,
  },
});
const Logs = mongoose.model("Logs", LogsSchema);

app.post("/logs", async (req, res) => {
  try {
    const messagesContent = [];
    let message = true;
    while (message) {
      message = await channel.get(process.env.QUEUE);
      if (message) {
        messagesContent.push(message.content.toString());
        channel.ack(message);
      }
    }

    const logs = new Logs({
      datetime: new Date(),
      data: messagesContent,
    });
    await logs.save();

    await req.channel.ackAll();
    console.log(`Read all messages from ${process.env.QUEUE}`);

    res.json({ content: "Saved all messages", error: false });
  } catch (err) {
    res.json({ content: err, error: true });
  }
});

app.get("/logs/:dateFrom/:dateTo", async (req, res) => {
  try {
    const startDate = new Date(req.params.dateFrom);
    const endDate = new Date(req.params.dateTo);
    const logs = await Logs.find({
      datetime: {
        $gte: startDate,
        $lte: endDate,
      },
    });
    res.json(logs);
  } catch (err) {
    res.json({ content: err, error: true });
  }
});

app.delete("/logs", async (req, res) => {
  try {
    const deleteResult = await Logs.deleteMany();
    res.json({
      content: `Deleted ${deleteResult.deletedCount} documents`,
      error: false,
    });
  } catch (err) {
    res.json({ content: err, error: true });
  }
});
/*API END POINTS---------------------------------------------------------------------- */

app.listen(process.env.PORT, function () {
  console.log("Started application on port %d", process.env.PORT);
});

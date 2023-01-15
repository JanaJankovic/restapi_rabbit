const amqplib = require("amqplib");

(async function () {
  const open = await amqplib.connect("amqp://localhost:5672");
  const channel = await open.createChannel();
  await channel.assertQueue("iir-2");

  channel.consume("iir-2", (msg) => {
    if (msg !== null) {
      console.log(msg.content.toString());
      channel.ack(msg);
    }
  });
})();

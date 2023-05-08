const { Client, PrivateKey } = require("@hashgraph/sdk");

// account ID and private key
const operatorAccount = process.env.OPERATOR_ACCOUNT_ID;
const operatorPrivateKey = process.env.OPERATOR_PRIVATE_KEY;

async function main() {
  // Create a Hedera client instance and set the testnet environment
  const client = new Client({
    network: { "0.testnet.hedera.com:50211": "0.0.3" },
    operator: {
      account: operatorAccount,
      privateKey: operatorPrivateKey,
    },
  });

  // Create a new topic
  const { topicId } = await client.createTopic({
    memo: "Test topic",
    submitKey: PrivateKey.generate().publicKey,
    adminKey: PrivateKey.generate().publicKey,
  });

  console.log("Topic ID:", topicId.toString());

  // Update the topic's memo
  await client.updateTopic({ topicId, memo: "New memo" });

  // Get the topic's info
  const { memo } = await client.getTopicInfo(topicId);

  console.log("Memo:", memo);

  // Submit a message to the topic
  const message = "Hello World!";
  const transactionId = await client.submitMessage({
    topicId,
    message,
  });

  console.log("Transaction ID:", transactionId.toString());

  // Get the messages from the topic
  const messages = await client.getTopicMessages(topicId);

  console.log("Messages:", messages);

  // Close the client
  await client.close();
}

main();
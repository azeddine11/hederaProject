const {
    Client,
    PrivateKey,
    AccountCreateTransaction,
    TokenCreateTransaction,
    TokenAssociateTransaction,
    TokenMintTransaction,
    TokenTransferTransaction,
    TokenUpdateTransaction,
    TokenInfoQuery,
    MirrorClient,
  } = require("@hashgraph/sdk");
  
  // Hedera testnet accounts
  const operatorAccount = process.env.OPERATOR_ACCOUNT_ID;
  const operatorPrivateKey = PrivateKey.fromString(process.env.OPERATOR_PRIVATE_KEY);
  const account1PrivateKey = PrivateKey.generate();
  const account2PrivateKey = PrivateKey.generate();
  const account1PublicKey = account1PrivateKey.publicKey;
  const account2PublicKey = account2PrivateKey.publicKey;
  
  async function main() {
    // Create Hedera clients
    const client = new Client({
      network: { "0.testnet.hedera.com:50211": "0.0.3" },
      operator: {
        account: operatorAccount,
        privateKey: operatorPrivateKey,
      },
    });
  
    const mirrorClient = new MirrorClient({
      network: "testnet",
      address: "hcs.testnet.mirrornode.hedera.com:5600",
    });
  
    // Create two testnet accounts
    const { accountId: account1Id } = await new AccountCreateTransaction()
      .setKey(account1PublicKey)
      .setInitialBalance(0)
      .execute(client);
  
    const { accountId: account2Id } = await new AccountCreateTransaction()
      .setKey(account2PublicKey)
      .setInitialBalance(0)
      .execute(client);
  
    console.log("Account 1 ID:", account1Id.toString());
    console.log("Account 2 ID:", account2Id.toString());
  
    // Create a new NFT token
    const memo = "Test NFT";
    const adminKey = PrivateKey.generate().publicKey;
    const supplyKey = PrivateKey.generate().publicKey;
    const royaltyFee = { fraction: { numerator: 5, denominator: 100 } };
    const feeScheduleKey = PrivateKey.generate().publicKey;
    const tokenCreateTx = await new TokenCreateTransaction()
      .setTokenName("Test NFT")
      .setTokenSymbol("TNFT")
      .setTokenType(1)
      .setSupplyKey(supplyKey)
      .setAdminKey(adminKey)
      .setCustomFees({
        tokenFeeSchedule: feeScheduleKey,
        fees: [royaltyFee],
      })
      .setMemo(memo)
      .execute(client);
  
    const tokenId = tokenCreateTx.tokenId;
    console.log("Token ID:", tokenId.toString());
  
    // Add custom metadata to the token
    await new TokenUpdateTransaction()
      .setTokenId(tokenId)
      .setTokenMemo("New memo")
      .execute(client);
  
    // Get the metadata of the token
    const tokenInfo = await new TokenInfoQuery()
      .setTokenId(tokenId)
      .execute(client);
  
    console.log("Token info:", tokenInfo);
  
    // Mint a new NFT
    const mirrorConsensusTopicId = await mirrorClient.topics.getTokenNftTopic(tokenId);
    const metadata = { name: "Test NFT #1", description: "This is a test NFT" };
    await new TokenMintTransaction()
      .setTokenId(tokenId)
      .addMetadata(metadata)
      .addTokenTransfer(account1Id, 1)
      .execute(client);
  
    // Transfer the NFT to account 2
    await new TokenAssociateTransaction()
      .setAccountId(account2Id)
      .setTokenIds([tokenId])
      .execute(client);
  
    await new TokenTransferTransaction()
      .setTokenId(tokenId)
      .addTokenTransfer(account1Id, account2Id, 1)
      .execute(client);
  
    // Get the balance of each account
    const account1Balance = await new TokenInfoQuery()
      .setTokenId(tokenId)
      .setAccountId(account1Id)
      .execute(client);
  
    const account2Balance = await new TokenInfoQuery()
      .setTokenId(tokenId)
      .setAccountId(account2Id)
      .execute(client);
  
    const royaltyAccountBalance = await new TokenInfoQuery()
      .setTokenId(tokenId)
      .setAccountId(tokenInfo.royalties.get(0).accountId)
      .execute(client);
  
    console.log("Account 1 balance:", account1Balance.tokenBalances[0]);
    console.log("Account 2 balance:", account2Balance.tokenBalances[0]);
    console.log("Royalty account balance:", royaltyAccountBalance.tokenBalances[0]);
  
    // Update the custom fees
    const updatedRoyaltyFee = { fraction: { numerator: 10, denominator: 100 } };
    await new TokenUpdateTransaction()
      .setTokenId(tokenId)
      .setCustomFees({
        tokenFeeSchedule: feeScheduleKey,
        fees: [updatedRoyaltyFee],
      })
      .execute(client);
  
    // Mint a second NFT
    const metadata2 = { name: "Test NFT #2", description: "This is another test NFT" };
    await new TokenMintTransaction()
      .setTokenId(tokenId)
      .addMetadata(metadata2)
      .addTokenTransfer(account1Id, 1)
      .execute(client);
  
    // Transfer the second NFT to account 2
    await new TokenAssociateTransaction()
      .setAccountId(account2Id)
      .setTokenIds([tokenId])
      .execute(client);
  
    await new TokenTransferTransaction()
      .setTokenId(tokenId)
      .addTokenTransfer(account1Id, account2Id, 1)
      .execute(client);
  
    // Get the new balance of each account
    const account1Balance2 = await new TokenInfoQuery()
      .setTokenId(tokenId)
      .setAccountId(account1Id)
      .execute(client);
  
    const account2Balance2 = await new TokenInfoQuery()
      .setTokenId(tokenId)
      .setAccountId(account2Id)
      .execute(client);
  
    const royaltyAccountBalance2 = await new TokenInfoQuery()
      .setTokenId(tokenId)
      .setAccountId(tokenInfo.royalties.get(0).accountId)
      .execute(client);
  
    console.log("Account 1 balance (after second mint):", account1Balance2.tokenBalances[0]);
    console.log("Account 2 balance (after second mint):", account2Balance2.tokenBalances[0]);
    console.log("Royalty account balance (after second mint):", royaltyAccountBalance2.tokenBalances[0]);
  
    // Close the clients
    await client.close();
    await mirrorClient.close();
  }
  
  main();
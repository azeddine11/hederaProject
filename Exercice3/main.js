const {
    Client,
    PrivateKey,
    AccountCreateTransaction,
    ContractCreateTransaction,
    ContractFunctionParams,
    ContractFunctionQuery,
  } = require("@hashgraph/sdk");
  const contractBytecode = require("./HelloHedera.json").bytecode;

  // Hedera testnet accounts
  const operatorAccount = process.env.OPERATOR_ACCOUNT_ID;
  const operatorPrivateKey = PrivateKey.fromString(process.env.OPERATOR_PRIVATE_KEY);
  const account1PrivateKey = PrivateKey.generate();
  const account2PrivateKey = PrivateKey.generate();
  const account1PublicKey = account1PrivateKey.publicKey;
  const account2PublicKey = account2PrivateKey.publicKey;
  
  async function main() {
    // Create Hedera client
    const client = new Client({
      network: { "0.testnet.hedera.com:50211": "0.0.3" },
      operator: {
        account: operatorAccount,
        privateKey: operatorPrivateKey,
      },
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
  
    // Deploy the smart contract
    const contractTx = await new ContractCreateTransaction()
      .setGas(1000000)
      .setBytecode(contractBytecode)
      .setAdminKey(operatorPrivateKey.publicKey)
      .setConstructorParams(
        new ContractFunctionParams().addAddress(account1Id)
      )
      .execute(client);
  
    const contractReceipt = await contractTx.getReceipt(client);
    const contractId = contractReceipt.getContractId();
  
    console.log("Contract ID:", contractId.toString());
  
    // Call the get_address function
    const getFunction = new ContractFunctionQuery()
      .setContractId(contractId)
      .setGas(1000)
      .setFunction("get_address")
      .execute(client);
  
    const addressBefore = await getFunction.call(client);
    console.log("Address before:", addressBefore);
  
    // Call the set_address function
    const setFunction = new ContractFunctionParams().addAddress(account2Id);
    const setTx = await new ContractCreateTransaction()
      .setGas(1000)
      .setContractId(contractId)
      .setFunction("set_address", setFunction)
      .execute(client);
  
    await setTx.getReceipt(client);
  
    // Call the get_address function again
    const getFunction2 = new ContractFunctionQuery()
      .setContractId(contractId)
      .setGas(1000)
      .setFunction("get_address")
      .execute(client);
  
    const addressAfter = await getFunction2.call(client);
    console.log("Address after:", addressAfter);
  
    // Close the client
    await client.close();
  }
  
  main();
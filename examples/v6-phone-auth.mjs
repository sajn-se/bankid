/**
 * Starts an identification order for a user you are talking to on the phone.
 * The user opens the BankID app and confirms the call.
 */
import { BankIdClientV6 } from "@sajn/bankid";

const personalNumber = process.argv[2];
const bankid = new BankIdClientV6({ production: false });

const main = async () => {
  const { orderRef } = await bankid.phoneAuth({
    callInitiator: "RP",
    personalNumber,
    userVisibleData: "Identify yourself to Acme AB customer service",
  });
  console.log("Awaiting confirmation in the BankID app..");
  const resp = await bankid.awaitPendingCollect(orderRef);
  console.log("Success!", resp.completionData.user);
};

main().catch(err => console.error(err));

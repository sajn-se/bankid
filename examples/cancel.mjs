import { BankIdClientV6 } from "@sajn/bankid";

const personalNumber = process.argv[2];
const bankid = new BankIdClientV6({ production: false });

async function testCancelation() {
  const { orderRef } = await bankid.authenticate({
    endUserIp: "127.0.0.1",
    requirement: { personalNumber },
  });
  await bankid
    .cancel({ orderRef })
    .then(() => console.log("success"))
    .catch(console.error);
}

testCancelation();

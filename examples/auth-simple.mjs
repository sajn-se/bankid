import { BankIdClientV6 } from "@sajn/bankid";

const personalNumber = process.argv[2];
const bankid = new BankIdClientV6({ production: false });

bankid
  .authenticateAndCollect({ endUserIp: "127.0.0.1", requirement: { personalNumber } })
  .then(res => console.log(res.completionData.user))
  .catch(err => console.error(err));

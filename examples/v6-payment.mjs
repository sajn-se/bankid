/**
 * Starts a card payment order and prints QR codes for 20 seconds while
 * polling the order status. Scan the code with a test BankID.
 */
import { BankIdClientV6 } from "@sajn/bankid";

const bankid = new BankIdClientV6({ production: false });

const main = async () => {
  const { orderRef, qr } = await bankid.payment({
    endUserIp: "127.0.0.1",
    userVisibleData: "Pay **100,00 SEK** to Acme AB",
    userVisibleDataFormat: "simpleMarkdownV1",
    userVisibleTransaction: {
      transactionType: "card",
      recipient: { nameB64: Buffer.from("Acme AB").toString("base64") },
      money: { amount: "100,00", currency: "SEK" },
    },
  });

  for await (const qrCode of qr.nextQr(orderRef, { timeout: 20 })) {
    console.log(qrCode);
    const resp = await bankid.collect({ orderRef });
    if (resp.status === "complete") {
      console.log("Success!", resp.completionData.user);
      return;
    } else if (resp.status === "failed") {
      throw new Error(resp.hintCode);
    }

    await new Promise(r => setTimeout(r, 2000));
  }
  await bankid.cancel({ orderRef });
  console.log("Timeout! Nothing happened");
};

main().catch(err => console.error(err));

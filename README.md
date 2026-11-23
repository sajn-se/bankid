# @sajn/bankid

A Node.js client for the Swedish [BankID](https://www.bankid.com/en/) RP API v6.0. It covers authentication, signing, payments, and phone orders, and it has no runtime dependencies.

[sajn](https://www.sajn.se) maintains this package. It is a fork of [anyfin/bankid](https://github.com/anyfin/bankid).

## Installation

```sh
pnpm add @sajn/bankid
```

Node.js 14.18 or later is required.

## Usage

```javascript
import { BankIdClientV6 } from "@sajn/bankid";

const client = new BankIdClientV6({ production: false });

const { autoStartToken, orderRef, qr } = await client.authenticate({
  endUserIp: "127.0.0.1",
});

// Same device: open the BankID app with autoStartToken.
// Other device: show a QR code that refreshes every second.
for await (const qrData of qr.nextQr(orderRef, { timeout: 60 })) {
  // Send qrData to the browser and render it.
  await new Promise(resolve => setTimeout(resolve, 1000));
}

const { completionData } = await client.awaitPendingCollect(orderRef);
```

Keep `qrStartSecret` on your server. Send the browser only the QR string from `qr.nextQr()`, never the full response from `authenticate()`, `sign()`, or `payment()`.

The [examples directory](./examples) has runnable flows for autostart, QR codes, payments, phone auth, collect, and cancel.

## Methods

`BankIdClientV6` has these methods. Fields marked with `*` are required.

| Method | Endpoint | Key fields |
| --- | --- | --- |
| `authenticate()` | `/auth` | `endUserIp*`, `requirement`, `userVisibleData`, `returnUrl`, `returnRisk`, `web`, `app` |
| `sign()` | `/sign` | `endUserIp*`, `userVisibleData*`, `requirement`, `returnUrl`, `returnRisk`, `web`, `app` |
| `payment()` | `/payment` | `endUserIp*`, `userVisibleTransaction*`, `riskFlags`, `returnUrl`, `returnRisk`, `web`, `app` |
| `phoneAuth()` | `/phone/auth` | `callInitiator*`, `personalNumber*`, `requirement` |
| `phoneSign()` | `/phone/sign` | `callInitiator*`, `personalNumber*`, `userVisibleData*`, `requirement` |
| `otherPayment()` | `/other/payment` | `personalNumber*`, `userVisibleTransaction*` (`card` or `npa` only) |
| `collect()` | `/collect` | `orderRef*` |
| `cancel()` | `/cancel` | `orderRef*` |

The client base64-encodes `userVisibleData` and `userNonVisibleData`. Fields that end in `B64`, such as `recipient.nameB64`, are sent unchanged, so you encode them.

`authenticate()`, `sign()`, and `payment()` return a `qr` generator unless you set `qrEnabled: false`.

These convenience methods poll `collect()` until the order completes or fails:

- `authenticateAndCollect()`
- `signAndCollect()`
- `awaitPendingCollect(orderRef)`

They resolve with the collect response when the order completes. They reject with the collect response when it fails, and with a `BankIdError` or `RequestError` when a call fails.

The request and response types follow the [BankID OpenAPI spec](https://developers.bankid.com/api-references/auth--sign/overview).

## Security checklist

- Send the end user's real IP as `endUserIp`, not the IP of a proxy.
- Pass `returnUrl` in the API call instead of the autostart URL. Put a session nonce in its fragment (`#nonce=...`) and check the nonce on return.
- In same-device flows, check that `completionData.device.ipAddress` matches the IP you see.
- If you set `returnRisk: true`, block orders where `completionData.risk` is `"high"`.
- Don't reuse an `orderRef` after it completes or fails.

## Configuration

```javascript
const client = new BankIdClientV6({
  production: false, // Test environment. The bundled test certificate is used.
  refreshInterval: 2000, // Milliseconds between collect calls in the convenience methods.
  requestTimeout: 30000, // Milliseconds before a request is aborted.
  qrEnabled: true, // Attach a QR generator to auth, sign, and payment responses.
  pfx: "certs/bankid.pfx", // Path relative to the working directory, or a Buffer.
  passphrase: "...",
  ca: undefined, // Defaults to the bundled BankID root CA for the environment.
});
```

In production, `pfx` and `passphrase` are required:

```javascript
const client = new BankIdClientV6({
  production: true,
  pfx: "certs/bankid.pfx",
  passphrase: process.env.BANKID_PASSPHRASE,
});
```

### Legacy certificates

Older BankID certificates use algorithms that OpenSSL 3 (Node.js 17 and later) rejects with `Error: unsupported`. The bundled test certificate works as is.

To convert a legacy certificate, run these commands with OpenSSL 3:

```sh
openssl pkcs12 -in old.pfx -nodes -legacy -out combined.pem
openssl pkcs12 -in combined.pem -export -out new.pfx
```

If you can't convert the certificate, run Node.js with `--openssl-legacy-provider`.

### v5.1 client

BankID shut down RP API v5.1 on 2025-09-30. The deprecated `BankIdClient` still targets v5.1, so its calls fail with HTTP 403. Use `BankIdClientV6`.

## Publishing

To publish a new version:

1. Bump `version` in `package.json` and merge to `master`.
2. Create a GitHub release with the tag `v<version>`, for example `v4.0.0`.

The release workflow checks that the tag matches `package.json`, runs the type check, and publishes to npm with provenance. It uses npm trusted publishing, so the repository stores no npm token.

## License

MIT. See [LICENSE](./LICENSE).

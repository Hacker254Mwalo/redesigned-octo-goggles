# Environment and Payment Configuration

MtaaMarket keeps every M-Pesa credential on the server. Browser code never receives the consumer key, consumer secret, passkey, or callback configuration. Copy `.env.example` to a secure environment-variable store and replace the placeholders only with sandbox values from your Daraja application.

The payment flow will refuse to initiate an STK Push when any required configuration item is missing. The callback must use a public HTTPS address that belongs to the deployed marketplace. Before production, replace the sandbox values with production credentials, confirm the callback address in the Daraja portal, and complete a controlled end-to-end payment test.

Escrow release uses a platform-managed Heartbeat endpoint at `/api/scheduled/release-escrow`. The handler is present and only accepts authenticated scheduled calls. Create its recurring schedule only after the project is deployed, using a six-field UTC expression such as `0 0 * * * *` for an hourly check. The release logic is idempotent: only orders still in `picked_up` state and past the stored release time may progress.

| Variable | Purpose | Exposure |
|---|---|---|
| `DARAJA_CONSUMER_KEY` | Obtains the server-side Daraja access token. | Server only |
| `DARAJA_CONSUMER_SECRET` | Obtains the server-side Daraja access token. | Server only |
| `DARAJA_PASSKEY` | Builds the Lipa na M-Pesa Online request password. | Server only |
| `DARAJA_SHORTCODE` | Identifies the sandbox or production business shortcode. | Server only |
| `MPESA_CALLBACK_URL` | Receives the payment outcome callback. | Server only |
| `MPESA_CALLBACK_SECRET` | Random server-only token appended to the callback URL to reject unsolicited callback requests. | Server only |
| `MARKETPLACE_BASE_URL` | Establishes the public marketplace deployment origin. | Server only |

Safaricom’s Daraja portal provides a sandbox for application testing and documents the API integration workflow. [1]

## Reference

[1]: https://developer.safaricom.co.ke/ "Daraja 3.0 by Safaricom"

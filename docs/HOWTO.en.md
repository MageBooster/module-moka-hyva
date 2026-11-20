# MageBooster Moka United payment: how-to

Package: `magebooster/module-moka`
Licence: paid (serial number required)
Payment method code: `magebooster_moka`
Support: info@magebooster.com

## What it does

This module adds Moka United as a card payment method. It supports 3D Secure.

How a payment works:

1. The customer places the order. The order is saved with the status **Pending Payment**.
2. The customer is sent to `/mbmoka/redirect/start`, then to the card page `/mbmoka/redirect/pay`. The card page is on your own store domain.
3. The store sends the card details from your server straight to Moka (`DoDirectPaymentThreeD`). The customer then completes 3D Secure with their bank.
4. Moka returns the customer to `/mbmoka/payment/callback`. The module checks the answer with `hashValue` against `CodeForHash`.
5. The result decides what happens to the order:
   - **Success:** an invoice is created and the order moves to **Processing**.
   - **Card declined:** the customer goes back to the card page to try again.
   - **Failure or cancel:** the order is cancelled and the cart is restored.

Refunds are sent to Moka when you create an online credit memo, using `DoCreateRefundRequest`. A payment taken on the same day may need to be voided in the Moka panel instead.

Other behaviour:

- **Signed return links:** return URLs carry a signed order number, so they cannot be changed by hand.
- **Card data:** the module never stores card data. The debug log masks card numbers and secrets.
- **Currency:** orders in a currency outside "Currencies charged directly" are converted to TRY with the store's saved rate. The TRY amount is shown at checkout and on the order.

**PCI note:** the card form is served from your domain, so the store falls under PCI DSS SAQ A-EP or SAQ D, not SAQ A. Check with your acquirer.

## Requirements

- PHP 8.0 or later
- Magento 2.4.4 to 2.4.9
- A Moka United merchant account: dealer code, API username and API password
- Luma edition: `magebooster/module-moka`
- Hyvä edition: `magebooster/module-moka-hyva`. It is a separate download.

**Hyvä status:** this package includes a Knockout payment renderer for Luma-based checkouts. The server side (redirect, callback, refund) is the same on any theme. The module's README describes the Hyvä Checkout component as planned. Make sure the Hyvä edition is available for your store before you rely on it.

## Install with Composer

```bash
composer require magebooster/module-moka
```

## Install from a zip file

Unzip the archive into `app/code/MageBooster/Moka`, then run the commands below.

## Enable the module

```bash
bin/magento module:enable MageBooster_Moka
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento setup:static-content:deploy -f
bin/magento cache:flush
```

## Admin configuration

Go to **Stores > Configuration > Sales > Payment Methods > Moka United · MageBooster**.

| Field | Default | What it means |
|---|---|---|
| Enabled | No | Shows the method at checkout. |
| Title | Credit / debit card (Moka) | Name of the method at checkout and on the order. |
| Text shown at checkout | (empty) | Short text under the method name. |
| Test mode | Yes | Uses the test API address and test credentials. No real money is taken. |
| Dealer code | (empty) | Your Moka dealer code. |
| API username | (empty) | Your Moka API username. |
| API password | (empty) | Your Moka API password. It is stored encrypted. |
| Test API address | `https://service.refmokaunited.com` | Moka test service. |
| Live API address | `https://service.mokaunited.com` | Moka live service. |
| Currencies charged directly | TRY,USD,EUR,GBP | Comma-separated list. Other currencies are converted to TRY with the saved store rate. |
| Payment from applicable countries | All allowed countries | Limits the method to the countries you choose. |
| Payment from specific countries | (empty) | Used when the previous field is set to specific countries. |
| Sort order | 60 | Position among the payment methods. |
| Debug log | No | Writes requests and answers to `var/log/magebooster_mbmoka.log`. Card data and secrets are never written. |

## Testing

1. Turn on **Test mode** and **Debug log**.
2. Enter your Moka test credentials.
3. Place an order with a Moka test card and complete 3D Secure.
4. Check the result:
   - The order is **Processing** and has an invoice.
   - `magebooster_mbmoka.log` shows the request and the callback.
5. Repeat with a card that will be declined. You should be sent back to the card page.
6. Cancel 3D Secure. The order should be cancelled and the cart restored.
7. Create an online credit memo for a paid order. The refund request should appear in the log and in the Moka panel.
8. Turn off Test mode only after these steps pass.

## Known limits

- **Live testing:** this version has not yet been tested against the live Moka service. Run a small real payment first.
- **Hash check:** the callback check uses Moka's `hashValue` formula. If the log shows "hashValue did not match", contact Moka to confirm the formula for your account, then contact us.
- **SameSite cookies:** Moka posts the result back cross-site. With `SameSite=Lax` session cookies some browsers start a new session on that request. The payment is still recorded correctly, because it uses the signed order number and not the session. Check that the success page appears.

## Troubleshooting

- **The method does not show at checkout.** Check these settings:
  - **Enabled**
  - the country settings
  - "Currencies charged directly", or a saved TRY rate for other currencies
- **The order stays in Pending Payment.** The customer did not finish 3D Secure, or the callback could not reach your store. Check the log, and make sure `/mbmoka/payment/callback` is not blocked by a firewall or a maintenance page.
- **"hashValue did not match".** See Known limits.

## Uninstall

1. Turn off **Enabled**.
2. Wait until no orders are in Pending Payment.
3. Run:

```bash
bin/magento module:disable MageBooster_Moka
composer remove magebooster/module-moka
bin/magento setup:upgrade
bin/magento cache:flush
```

Past orders keep the payment details that were saved on them.

## Licence & copying

Commercial licence, see `LICENSE.txt`. Copyright (c) 2026 WebWorks 101 OÜ (MageBooster). All rights reserved.

- One serial number = one production installation (one store domain). Staging and development copies of that same store are allowed.
- Each serial number and each download is tied to the customer who bought it. Luma and Hyvä editions are separate products with separate serial numbers.
- You may modify the code for your own licensed store. Keep the copyright and licence notices.
- Not allowed: copying to other stores, redistributing, reselling, sublicensing, publishing in public repositories, marketplaces or forums, removing licence checks or these notices, sharing serial numbers.
- In case of unauthorised copying or use, the serial number is revoked without refund, updates and support stop, and WebWorks 101 OÜ may claim damages and take legal action. Estonian law applies; the court is Harju County Court.

## Support

info@magebooster.com

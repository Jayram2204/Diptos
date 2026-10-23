# Diptos Whitelabel Partner API Specification

- **Target Audience:** Non-Banking Financial Companies (NBFCs), Factoring Firms, Supply Chain Finance Houses, and ERP Vendors (SAP, NetSuite, Tally).
- **Protocol Version:** 1.0 (Base L2 Mainnet & Sepolia)
- **Base Endpoint:** `https://diptos.xyz/api/v1/partners`
- **Supported Standards:** Peppol BIS 3.0 (EU/UK/SG), India GSTN IRN, Mexico SAT CFDI 4.0, and US ERP 3-Way Match.

---

## 1. Overview & Institutional Positioning

Diptos acts as an **invisible, whitelabel Real-World Asset (RWA) settlement and deduplication backend** for existing trade finance intermediaries. Factoring companies and NBFCs retain their customer relationships, manage client onboarding, and earn servicing fees (1.0%–2.5%), while offloading balance-sheet constraints into global institutional stablecoin liquidity vaults.

### Core Capabilities
1. **Deterministic Double-Financing Prevention:** Canonical 6-field `keccak256` hashing cross-checked against on-chain `InvoiceRegistry.sol` and the MonetaGo global deduplication fabric in real time (<150ms).
2. **Automated Legal Structuring:** Automatic generation of UNCITRAL MLETR and US UCC Article 12 compliant **Master Purchase Agreements (MPA)** and **Notices of Assignment (NOA)**.
3. **Invisible Fiat-to-Crypto Settlement:** Automatic assignment of dedicated Virtual IBANs (USD/EUR/SGD/GBP) allowing obligors to pay via domestic bank wire (FedNow, SEPA, Faster Payments).

---

## 2. Authentication & Headers

Every request must include the partner's verified corporate identity credentials:

| Header | Type | Description |
| :--- | :--- | :--- |
| `x-diptos-partner-vlei` | String | 20-character GLEIF Verifiable Legal Entity Identifier (vLEI) |
| `x-diptos-partner-name` | String | Registered corporate legal name of the factoring firm or NBFC |
| `Content-Type` | String | `application/json` |

---

## 3. Endpoints

### 3.1 Ingest & Deduplicate Invoice
`POST /api/v1/partners/invoices`

Ingests raw e-invoicing documents (Peppol XML, GSTN JSON, CFDI XML, ERP 3-Way Match) or canonical invoice payloads.

#### Request Formats

##### Option A: Raw Document Ingestion (e.g. Peppol BIS Billing 3.0 UBL XML)
```json
{
  "standard": "PEPPOL_BIS_3_0",
  "rawDocument": "<Invoice xmlns=\"urn:oasis:names:specification:ubl:schema:xsd:Invoice-2\">...<cbc:ID>INV-2026-SG-9901</cbc:ID>...</Invoice>",
  "jurisdiction": "Singapore",
  "dueDate": "2026-12-15"
}
```

##### Option B: India GSTN IRP Signed Payload
```json
{
  "standard": "INDIA_GSTN_IRN",
  "payload": {
    "Irn": "3a1f8b2c9e4d5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
    "DocDtls": { "Typ": "INV", "No": "EXP/2026/0442", "Dt": "18/10/2026" },
    "SellerDtls": { "Gstin": "27AABCU9603R1ZM" },
    "BuyerDtls": { "Gstin": "07AAACD4962Q1ZS" },
    "ValDtls": { "TotInvVal": 185000.00 },
    "currency": "USD"
  },
  "jurisdiction": "United Kingdom"
}
```

##### Option C: Normalized Canonical Input
```json
{
  "canonicalInput": {
    "sellerTaxIdOrLei": "33580048329184928172",
    "buyerTaxIdOrLei": "529900T8BM49AURSDO55",
    "officialInvoiceNumber": "INV-2026-8841",
    "currencyCode": "USD",
    "issueDateYYYYMMDD": "20261023",
    "faceValueMinorUnits": "25000000"
  },
  "sellerName": "Apex Precision Exporters Ltd.",
  "buyerName": "Continental Drivetrain AG",
  "jurisdiction": "Singapore"
}
```

#### Success Response (`200 OK`)
```json
{
  "ok": true,
  "status": "VERIFIED_UNIQUE",
  "message": "Invoice successfully verified, deduplicated, and prepared for RWA tokenization",
  "partnerAudit": {
    "partnerVlei": "5493001KJTIIGC8Y1R12",
    "partnerName": "Meridian Factoring & Trade Credit Corp",
    "verifiedAtIso": "2026-10-23T12:00:00.000Z"
  },
  "invoice": {
    "canonicalHash": "0x4b7c8e...",
    "eInvoiceStandard": "PEPPOL_BIS_3_0",
    "governmentReference": "PEPPOL-UBL-INV-2026-SG-9901",
    "normalizedPayload": {
      "sellerId": "33580048329184928172",
      "buyerId": "529900T8BM49AURSDO55",
      "invoiceNumber": "INV-2026-SG-9901",
      "currency": "EUR",
      "issueDate": "20261018",
      "faceValueMinorUnits": "25000000"
    }
  },
  "deduplicationCertificate": {
    "onchainRegistry": "UNIQUE_CLEAR",
    "monetaGoRegistry": "UNIQUE_CLEAR",
    "timestamp": "2026-10-23T12:00:00.000Z"
  },
  "legalBundle": {
    "documentId": "MPA-INV-2026-SG-9901-0x4b7c8e",
    "legalFramework": "SINGAPORE_ETA",
    "governingLaw": "Singapore Law (Electronic Transactions Act, Cap. 88, Part IIA)",
    "disputeForum": "Singapore International Commercial Court (SICC) / SIAC",
    "keccak256Digest": "0x9f1a2b...",
    "virtualIban": "SG42DIPTOSINV2026SG9901"
  },
  "onchainMintingParams": {
    "canonicalHash": "0x4b7c8e...",
    "faceValueMinorUnits": "25000000",
    "legalHash": "0x9f1a2b...",
    "settlementRail": "VIRTUAL_IBAN_FIAT"
  }
}
```

#### Duplicate Collision Response (`409 Conflict`)
Triggered when an invoice has already been registered on Base L2 or pledged on another domestic factoring exchange registered with MonetaGo:
```json
{
  "ok": false,
  "status": "BLOCKED_DUPLICATE",
  "message": "Double-financing attempt blocked: canonical invoice hash already pledged on-chain or registered with MonetaGo",
  "canonicalHash": "0x4b7c8e...",
  "deduplicationReport": {
    "onchainStatus": "ALREADY_REGISTERED",
    "monetaGoStatus": "COLLISION_FLAGGED",
    "checkedAtIso": "2026-10-23T12:00:00.000Z"
  }
}
```

---

### 3.2 Query Invoice On-Chain Status
`GET /api/v1/partners/invoices?canonicalHash=0x...`

#### Success Response (`200 OK`)
```json
{
  "ok": true,
  "found": true,
  "invoice": {
    "invoiceNumber": "INV-2026-8841",
    "canonicalHash": "0x4b7c8e...",
    "status": "FACTORED",
    "faceValueUsd": 250000,
    "discountRateAprBps": 885,
    "dueDate": "2026-12-15",
    "virtualIbanAccount": "vIBAN-4B7C8E91A2"
  }
}
```

---

## 4. Code Integration Examples

### 4.1 cURL
```bash
curl -X POST https://diptos.xyz/api/v1/partners/invoices \
  -H "Content-Type: application/json" \
  -H "x-diptos-partner-vlei: 5493001KJTIIGC8Y1R12" \
  -H "x-diptos-partner-name: Meridian Factoring Corp" \
  -d '{
    "standard": "PEPPOL_BIS_3_0",
    "rawDocument": "<Invoice>...</Invoice>",
    "jurisdiction": "Singapore"
  }'
```

### 4.2 TypeScript / Node.js
```typescript
import axios from 'axios';

async function ingestFactoredInvoice(xmlInvoiceString: string) {
  const response = await axios.post('https://diptos.xyz/api/v1/partners/invoices', {
    standard: 'PEPPOL_BIS_3_0',
    rawDocument: xmlInvoiceString,
    jurisdiction: 'Singapore',
  }, {
    headers: {
      'x-diptos-partner-vlei': '5493001KJTIIGC8Y1R12',
      'x-diptos-partner-name': 'Meridian Factoring Corp',
    },
  });

  console.log('Deduplication Status:', response.data.status);
  console.log('Canonical Hash:', response.data.invoice.canonicalHash);
  console.log('Assigned Virtual IBAN:', response.data.legalBundle.virtualIban);
  return response.data;
}
```

### 4.3 Python
```python
import requests

def submit_invoice(invoice_data):
    url = "https://diptos.xyz/api/v1/partners/invoices"
    headers = {
        "x-diptos-partner-vlei": "5493001KJTIIGC8Y1R12",
        "x-diptos-partner-name": "Meridian Factoring Corp",
        "Content-Type": "application/json"
    }
    response = requests.post(url, json=invoice_data, headers=headers)
    if response.status_code == 409:
        print("Double financing alert:", response.json()["message"])
    else:
        print("Canonical Hash:", response.json()["invoice"]["canonicalHash"])
    return response.json()
```

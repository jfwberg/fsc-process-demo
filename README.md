# FSC Process Demo

A Salesforce LWC demo component for financial services processes, designed to run inside Microsoft Teams via the [MCP App Bridge](https://github.com/jfwberg/mcp-app-bridge).

## What it does

A single card component with three tabs:

- **KYC & Onboarding** — 4-step wizard covering client information, document verification, risk assessment, and compliance decision. Fires a `kyc_completed` event back to the Teams chat on completion.
- **Loan Application** — 4-step wizard covering loan terms, financials, collateral, and underwriting. Fires a `loan_decision` event back to the Teams chat on completion.
- **Flow** — Embeds the `KYC_Onboarding_Flow` screen flow for a native Salesforce flow experience.

## MCP App Bridge inputs

The component accepts the following inputs from the bridge, allowing the Teams chat to pre-populate fields before the user opens the app:

| Property | Type | Description |
|---|---|---|
| `clientName` | String | Pre-fills client name across all tabs |
| `clientId` | String | Shown in the card header badge |
| `dateOfBirth` | String | ISO date `YYYY-MM-DD` — pre-fills DOB in KYC and Flow |
| `nationality` | String | Pre-fills nationality dropdown |
| `startDate` | String | ISO date `YYYY-MM-DD` — defaults to today |
| `initialTab` | String | Tab to open on load: `kyc`, `loan`, or `flow` |
| `loanAmount` | Integer | Pre-fills loan amount in the Loan tab |

## Outbound events

| Event | Fired when |
|---|---|
| `kyc_completed` | KYC wizard or Flow tab finishes |
| `loan_decision` | Loan underwriting step completes |

Both events carry a JSON payload sent back to the Teams chat window via the bridge.

## Package

This component is published as a 2GP managed package with a dependency on MCP App Bridge `0.11.0-1`.

```
Package: FSC Process Demo
Namespace: wt
```

## Deploy

```bash
sf package version create \
  --package "FSC Process Demo" \
  --target-dev-hub devhub \
  --code-coverage \
  --installation-key-bypass \
  --wait 30 \
  --definition-file config/project-scratch-def.json
```

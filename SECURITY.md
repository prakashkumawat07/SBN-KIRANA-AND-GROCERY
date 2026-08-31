# Security Policy

## Reporting a vulnerability

Please do not disclose a vulnerability in a public issue.

Use the repository's **Security** tab and choose **Report a vulnerability** to send a private report to the maintainer. Include the affected page or API route, reproduction steps, impact, and any suggested mitigation.

Never include real passwords, OTPs, JWTs, database credentials, encryption keys, KYC documents, Aadhaar details, payment proofs, or other customer data in an issue, pull request, screenshot, commit, or test fixture.

## Supported version

Security fixes are applied to the latest commit on `main`.

## Secret handling

- Store production secrets only in Vercel environment variables.
- Keep local secrets in ignored `.env` files.
- Variables prefixed with `VITE_` are bundled into browser code and must never contain secrets.
- Rotate a credential immediately if it is exposed, even if the commit is later deleted.

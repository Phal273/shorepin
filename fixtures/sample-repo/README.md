# Sample workspace

Intentional temporary escapes for Shorepin demos. Not a real product, not seed company data.

Scan these files from the Shorepin Scan page (Load sample workspace) or with:

```
node scripts/scan.mjs --dir fixtures/sample-repo --out /tmp/sample-scan.json
node scripts/check.mjs --pins pins.json --scan /tmp/sample-scan.json
```

That check fails until each finding is registered in `pins.json` with an owner, reason, and future expiry.

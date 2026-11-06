# zwaa

Check the webhosting and email dependence of one or more domains.

## Usage

```sh
zwaa voorbeeld.nl
zwaa voorbeeld.nl nos.nl --json
```

For every URL, `zwaa` resolves the webhosting IP address (A record) and the
email provider (MX record), then looks up the corresponding autonomous system
and organisation. US-based providers are marked with a red `✗`, other
jurisdictions with a green `✓`.

## Install

The CLI reads the IPInfo MMDB and CAIDA ASN dataset from `data/sources` in this
repository. Install it system-wide with a link:

```sh
pnpm install
pnpm --filter zwaa build
cd cli
pnpm link --global .
```

Set `ZWAA_DATA_DIR` to use a different data folder.

## Development

```sh
pnpm --filter zwaa dev -- voorbeeld.nl
```

# envcrypt

> Lightweight utility to encrypt and share `.env` files securely using public-key cryptography.

---

## Installation

```bash
npm install -g envcrypt
```

---

## Usage

### Generate a keypair

```bash
envcrypt keygen
# Outputs: public.key and private.key
```

### Encrypt a `.env` file

```bash
envcrypt encrypt .env --key public.key --out .env.enc
```

### Decrypt a `.env` file

```bash
envcrypt decrypt .env.enc --key private.key --out .env
```

### Programmatic usage

```typescript
import { encrypt, decrypt } from "envcrypt";

const encrypted = await encrypt(".env", { publicKey: "public.key" });
const decrypted = await decrypt(".env.enc", { privateKey: "private.key" });
```

---

## How It Works

`envcrypt` uses asymmetric encryption (X25519 + AES-256-GCM) to encrypt your `.env` file with a recipient's public key. Only the holder of the corresponding private key can decrypt it — making it safe to share encrypted env files over email, Slack, or version control.

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## License

[MIT](./LICENSE)
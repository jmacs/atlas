# Project guidance

- Prefer the npm scripts in `package.json` over ad hoc commands.
- Use the repository `.env`; `ATLAS_APPDATA_DIR` should be `.local/`.

## Scripts

```shell
npm run dev    # runtime testing. Exercise the real HTTP endpoints
npm run check  # runs type checks, lint, and prettier check
```

Keep generated data and test artifacts inside the repository's intended directories unless a task explicitly requires
temporary storage.

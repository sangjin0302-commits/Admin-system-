# Environment Presets

## Lawbot safe defaults
```env
LAWBOT_ENABLE_AUTOMATIC_CALLS=false
LAWBOT_ANALYZE_TIMEOUT_MS=8000
```

## Automatic-call mode (requires full config)
```env
LAWBOT_ENABLE_AUTOMATIC_CALLS=true
LAWBOT_ANALYZE_URL=...
LAWBOT_ANALYZE_TOKEN=...
LAWBOT_ANALYZE_TIMEOUT_MS=8000
```

## Guard rules
- `LAWBOT_ENABLE_AUTOMATIC_CALLS=true` requires URL + token.
- Timeout should stay within `1000..60000`.
- If automatic mode is off, manual API trigger remains available.

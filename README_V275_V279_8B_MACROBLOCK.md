# MathLabs V27.5–V27.9 · 8B Macroblock

## 1. Gates locales
```bash
cd /workspaces/paeslab
python scripts/check_v275_v279_8b_macroblock.py
npm run lint
npx tsc --noEmit
npm run build
```

## 2. Instalar sólo con gates verdes
```bash
psql \
  "host=aws-0-sa-east-1.pooler.supabase.com port=5432 dbname=postgres user=postgres.uozjdhuicmgzdrxcafzc sslmode=require" \
  -W \
  -v ON_ERROR_STOP=1 \
  -f supabase/135_mathlabs_v275_v279_8b_macroblock_full_install.sql
```
Debe finalizar en `COMMIT`. Si aparece COMMIT, no repetir 135.

## 3. Verificar
```bash
psql \
  "host=aws-0-sa-east-1.pooler.supabase.com port=5432 dbname=postgres user=postgres.uozjdhuicmgzdrxcafzc sslmode=require" \
  -W \
  -P pager=off \
  -x \
  -f supabase/136_verify_mathlabs_v275_v279_8b_macroblock.sql
```

Panel: `/admin/expansion-8b-v279`

Estado deliberado: 0 published, 0 release candidates, live delivery OFF, human review pending, calibration pending, curriculum revalidation required.

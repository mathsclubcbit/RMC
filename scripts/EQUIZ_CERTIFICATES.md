# E-Quiz certificate generation

The generator uses `public/certificates/templates/equiz-certificate.pdf` as an
unchanged background, writes the participant name into the first body line,
and adds a QR code linking to `/verify/<certificate_id>`.

## Input CSV

Required column:

```csv
participant_name,certificate_id,email
Asha Rao,CERT-20261126-0001,asha@example.com
```

`certificate_id` and `email` are optional. If the ID is omitted, a unique ID
is generated.

## Generate

```powershell
python scripts/generate_equiz_certificates.py --input participants.csv
```

Optional arguments:

- `--output output/pdf/equiz` — output directory
- `--base-url https://rmccbit.in` — verification site used by QR codes
- `--template path/to/template.pdf` — alternate one-page A4 landscape template

The output contains `individual/`, `combined/RMC_EQuiz_Certificates.pdf`, and
`manifest.json`.

## Upload to Drive and enable website verification

The e-quiz PDFs can be uploaded into a separate folder named
`E-Quiz Certificates` inside the configured `GOOGLE_DRIVE_FOLDER_ID` folder:

```powershell
node scripts/upload_equiz_certificates.mjs --input output/pdf/equiz/manifest.json
```

The uploader creates the dedicated folder if it does not exist, uploads PDF
files as PDFs, and writes each Drive file ID and web link back into the
manifest. To use an existing dedicated folder instead, set
`GOOGLE_EQUIZ_DRIVE_FOLDER_ID`.

The QR points to `https://rmccbit.in/verify/<certificate_id>`. The certificate
ID must exist in the existing Google Sheets `Certificates` tab for the website
to mark it as genuine. After generation, register the manifest:

```powershell
node scripts/register_equiz_certificates.mjs --input output/pdf/equiz/manifest.json
```

Run upload before registration so the Drive link is stored in column I.

If the PDFs were uploaded manually, pass the folder ID directly:

```powershell
node scripts/register_equiz_certificates.mjs `
  --input output/pdf/equiz/manifest.json `
  --drive-folder-id YOUR_E_QUIZ_FOLDER_ID
```

Registration creates the `Certificates` tab if needed, skips IDs already
registered, and stores new records as `ACTIVE`. Revoked or non-active records
are shown by the website but are not marked verified.

## Test

```powershell
npm run certificates:test
```

import json

with open('eslint_report.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

summary = {}
for file in data:
    for msg in file['messages']:
        ruleId = msg.get('ruleId', 'none')
        severity = 'ERROR' if msg['severity'] == 2 else 'WARNING'
        key = f"{severity}: {ruleId}"
        if key not in summary:
            summary[key] = []
        summary[key].append(f"{file['filePath']}:{msg['line']}")

for key, files in sorted(summary.items()):
    print(f"\n{key} ({len(files)} occurrences):")
    for f in files[:5]: # Show first 5
        print(f"  {f}")
    if len(files) > 5:
        print(f"  ... and {len(files) - 5} more")

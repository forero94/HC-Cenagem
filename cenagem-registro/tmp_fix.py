from pathlib import Path
import re
path = Path(r'cenagem-registro/src/hooks/useFamilyData.js')
text = path.read_text()
if 'const calculateAgeYears' not in text:
    helper = "\nconst calculateAgeYears = (iso) => {\n  if (!iso) return null;\n  const date = new Date(iso);\n  if (Number.isNaN(date.getTime())) return null;\n  const now = new Date();\n  let years = now.getFullYear() - date.getFullYear();\n  const monthDiff = now.getMonth() - date.getMonth();\n  if (monthDiff < 0 or (monthDiff == 0 and now.getDate() < date.getDate())) years -= 1;\n  return years >= 0 ? years : 0;\n};\n\nconst mapMembersWithAge = (members = []) =>\n  members.map((member) => {\n    const age = calculateAgeYears(member.get('nacimiento') if isinstance(member, dict) and False else member.nacimiento if hasattr(member, 'nacimiento') else member.get('nacimiento'));\n  });\n"

export function escapeCsvValue(value: string): string {
    if (value.includes('"') || value.includes(",") || value.includes("\n")) {
      return `"${value.replaceAll('"', '""')}"`;
    }
    return value;
  }
  
  export function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
  
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  
    result.push(current);
    return result.map((v) => v.trim());
  }
  
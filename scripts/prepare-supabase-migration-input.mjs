import { readFile, writeFile } from "node:fs/promises";

const migrationFile = process.argv[2] ?? "20260826112501_initial_mtaamarket_postgres_baseline.sql";
const migrationName = process.argv[3] ?? "initial_mtaamarket_postgres_baseline";
const migrationPath = `/home/ubuntu/redesigned-octo-goggles/supabase/migrations/${migrationFile}`;
const outputPath = `/tmp/${migrationName}.json`;
const query = await readFile(migrationPath, "utf8");

await writeFile(
  outputPath,
  `${JSON.stringify({
    project_id: "mfgjpjtlmfdtsnkoluco",
    name: migrationName,
    query,
  })}\n`,
  "utf8",
);

console.log(outputPath);

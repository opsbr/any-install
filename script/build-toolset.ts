import { $ } from "bun";
import { readdir } from "node:fs/promises";

const tools = await readdir("./toolset");

for (const tool of tools) {
  await $`bun any-install build -m ./toolset/${tool}/any-install.yaml`;
}

await $`bunx prettier --write ./toolset`;

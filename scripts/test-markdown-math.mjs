import { readFileSync } from "fs";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";

const blogRaw = readFileSync("content/blog/efficient-llm-serving-notes/index.md", "utf8");
const blogBody = blogRaw.replace(/^---[\s\S]*?---\n?/, "").trim();

const processor = remark().use(remarkGfm).use(remarkMath);
const tree = processor.parse(blogBody);
const mathNodes = [];

visit(tree, (node) => {
  if (node.type === "inlineMath" || node.type === "math") {
    mathNodes.push({ type: node.type, value: node.value });
  }
});

console.log("=== remark-math AST ===");
console.log(mathNodes.length >= 2 ? "PASS: inline + block math nodes found" : `FAIL: expected >=2 nodes, got ${mathNodes.length}`);
for (const node of mathNodes) {
  console.log(`  ${node.type}: ${node.value}`);
}

const roundTrip = processor.stringify(tree);
console.log("\n=== build-time round-trip ===");
console.log(roundTrip.includes("O(n^2)") ? "PASS: inline math preserved" : "FAIL: inline math lost");
console.log(roundTrip.includes("tokens/sec") ? "PASS: block math preserved" : "FAIL: block math lost");

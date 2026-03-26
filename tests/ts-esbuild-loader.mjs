import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transform } from "esbuild";

const EXTENSIONS = [".ts", ".tsx", ".js", ".mjs"];

export async function resolve(specifier, context, defaultResolve) {
  try {
    return await defaultResolve(specifier, context, defaultResolve);
  } catch (error) {
    const isRelativeOrAbsolute =
      specifier.startsWith("./") ||
      specifier.startsWith("../") ||
      specifier.startsWith("/");

    if (!isRelativeOrAbsolute || path.extname(specifier)) {
      throw error;
    }

    const parentPath = context.parentURL
      ? path.dirname(fileURLToPath(context.parentURL))
      : process.cwd();

    for (const ext of EXTENSIONS) {
      const candidatePath = specifier.startsWith("/")
        ? `${specifier}${ext}`
        : path.join(parentPath, `${specifier}${ext}`);

      try {
        return await defaultResolve(
          pathToFileURL(candidatePath).href,
          context,
          defaultResolve
        );
      } catch {
        // Continue checking the next extension.
      }
    }

    throw error;
  }
}

export async function load(url, context, defaultLoad) {
  if (url.endsWith(".ts") || url.endsWith(".tsx")) {
    const source = await readFile(new URL(url), "utf8");
    const loader = url.endsWith(".tsx") ? "tsx" : "ts";
    const { code } = await transform(source, {
      loader,
      format: "esm",
      target: "es2020",
      sourcemap: "inline",
    });

    return {
      format: "module",
      source: code,
      shortCircuit: true,
    };
  }

  return defaultLoad(url, context, defaultLoad);
}

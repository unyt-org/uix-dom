// deno_dom
import * as denoDom from "./deno-dom/deno-dom-wasm.ts";
import { CustomElementRegistry } from "./deno-dom/src/dom/custom-element-registry.ts";
export * from "./deno-dom/deno-dom-wasm.ts";

// create new document
export const document = new denoDom.Document();

// create new element registry
export const customElements = new CustomElementRegistry();
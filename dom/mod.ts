// deno_dom
import * as denoDom from "./deno-dom/deno-dom-wasm.ts";
import { CustomElementRegistry } from "./deno-dom/src/dom/custom-element-registry.ts";
import { HTMLFormElement } from "./deno-dom/src/dom/html-elements/html-form-element.ts";
import { HTMLHeadingElement } from "./deno-dom/src/dom/html-elements/html-heading-element.ts";
import { HTMLVideoElement } from "./deno-dom/src/dom/html-elements/html-video-element.ts";
import { HTMLTag } from "./deno-dom/src/dom/types/tags.ts";
export * from "./deno-dom/deno-dom-wasm.ts";
export * from "./deno-dom/src/css/CSSStyleDeclaration.ts"

// create new document
export const document = new denoDom.Document();

// create new element registry
const elements = new CustomElementRegistry<HTMLTag>();
elements.define("H1", HTMLHeadingElement)
elements.define("H2", HTMLHeadingElement)
elements.define("H3", HTMLHeadingElement)
elements.define("H4", HTMLHeadingElement)
elements.define("H5", HTMLHeadingElement)
elements.define("H6", HTMLHeadingElement)
elements.define("FORM", HTMLFormElement)
elements.define("VIDEO", HTMLVideoElement)

// create new custom element registry
export const customElements = new CustomElementRegistry();
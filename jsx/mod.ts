import { getFragment } from "./fragment.ts";
import { getParseJSX } from "./parser.ts";
import type { DOMUtils } from "../datex-bindings/dom-utils.ts";
import type { DOMContext } from "../dom/DOMContext.ts";

// load global jsx definitions
import "./jsx-definitions.ts"

export function enableJSX(context: DOMContext, domUtils: DOMUtils) {
	const jsx = getParseJSX(context, domUtils)
	const Fragment = getFragment(context, domUtils)
	return {
		jsx: jsx,
		jsxs: (type: any, params: Record<string,unknown>) => jsx(type, params, true),
		Fragment: Fragment
	}
}


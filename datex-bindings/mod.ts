
import { BindingOptions, loadDefinitions } from "./type-definitions.ts";
import { DOMUtils } from "./dom-utils.ts";
import type { DOMContext } from "../dom/DOMContext.ts";

export function enableDatexBindings(context: DOMContext, options?: BindingOptions) {
	const domUtils = new DOMUtils(context);
	const {bindObserver} = loadDefinitions(context, domUtils, options);
	return {
		domUtils,
		bindObserver
	};
}
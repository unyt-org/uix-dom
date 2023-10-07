
import { loadDefinitions } from "./type-definitions.ts";
import { DOMUtils } from "./DOMUtils.ts";
import { DOMContext } from "../dom/DOMContext.ts";

export function enableDatexBindings(context: DOMContext) {
	const domUtils = new DOMUtils(context);
	const {bindObserver} = loadDefinitions(context, domUtils);
	return {
		domUtils,
		bindObserver
	};
}
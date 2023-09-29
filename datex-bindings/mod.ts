
import { DOMContext } from "../dom/DOMContext.ts";
import { loadDefinitions } from "./type-definitions.ts";
import { DOMUtils } from "./DOMUtils.ts";

export function enableDatexBindings(context: DOMContext) {
	const domUtils = new DOMUtils(context);
	loadDefinitions(context, domUtils);
	return domUtils;
}
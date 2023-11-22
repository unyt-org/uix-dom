import { Datex } from "datex-core-legacy/mod.ts";

export const htmlType = Datex.Type.get("html");
export const svgType = Datex.Type.get("svg");
export const mathmlType = Datex.Type.get("mathml");
export const documentType = Datex.Type.get("htmldocument");
export const fragmentType = Datex.Type.get("htmlfragment");
export const commentType = Datex.Type.get("htmlcomment");

export const allDomTypes = new Set([
	htmlType,
	svgType,
	mathmlType,
	documentType,
	fragmentType,
	commentType
])
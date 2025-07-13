
/**
 * HTML Element attribute definitions
 * https://www.w3schools.com/tags/
 */

import type { Time } from "datex-core-legacy/types/time.ts";
import type { primitive } from "datex-core-legacy/types/abstract_types.ts"

// general html specific types

type numberString = `${number}`
type integerString = `${bigint}`
type htmlNumber = numberString|number|bigint
type htmlPixels = integerString|number|bigint
type svgLength = htmlNumber|`${number}%`
type htmlColor = ""

// list of all event handler content attributes

const elementEventHandlerAttributesBase = [
	"onabort", "onblur", "oncanplay", "oncanplaythrough", "onchange", "onclick", "oncontextmenu", "oncuechange", "ondblclick", "ondrag", "ondragend", "ondragenter", "ondragleave", "ondragover", "ondragstart", "ondrop", "ondurationchange", "onemptied", "onended", "onerror", "onfocus", "oninput", "oninvalid", "onkeydown", "onkeypress", "onkeyup", "onload", "onloadeddata", "onloadedmetadata", "onloadstart", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onmousewheel", "onpause", "onplay", "onplaying", "onprogress", "onratechange", "onreadystatechange", "onreset", "onscroll", "onseeked", "onseeking", "onselect", "onshow", "onstalled", "onsubmit", "onsuspend", "ontimeupdate", "onvolumechange", "onwaiting"
] as const;

export const elementEventHandlerAttributes = [
	...elementEventHandlerAttributesBase,
	...elementEventHandlerAttributesBase.map(v => `${v}:frontend`)
]

export type elementEventHandlerAttribute = typeof elementEventHandlerAttributesBase[number]|`${typeof elementEventHandlerAttributesBase[number]}:frontend`

// list of all default element attributes
export const defaultElementAttributes = [
	"accesskey", "class", "contenteditable", "contextmenu", "dir", "draggable", "dropzone", "hidden", "id", "lang", "spellcheck", "style", "tabindex", "title", "popover",
	"role", "name", "slot",
	// uix specific
	"uix-module", "uix-title", "stylesheet",
	"datex-pointer", "datex-update",
	"shadow-root", "display", "part"
] as const;

// TODO: replace with uix:, datex:
// custom attribute values for default attributes (default: string)
type customDefaultAttributeValues = {
	"uix-module": string|URL|null,
	"uix-title": string,
	"stylesheet": string|URL|null,
	"shadow-root": boolean|'open'|'closed',
	"datex-pointer": boolean,
	"datex-update": "onchange"|"onsubmit",

	// native non string attrs
	"popover": "auto" | "manual" | "hint" | boolean,
}

export type validHTMLElementAttrs<El extends HTMLElement> = {
	[key in typeof defaultElementAttributes[number]]: (key extends keyof customDefaultAttributeValues ? customDefaultAttributeValues[key] : string)
} & {
	[key in elementEventHandlerAttribute]: 
		key extends keyof GlobalEventHandlers ? 
			GlobalEventHandlers[key] & ((this: El, ev: never) => any) : 
		key extends `${infer name}:frontend` ?
			name extends keyof GlobalEventHandlers ?
				GlobalEventHandlers[name] & ((this: El, ev: never) => any) :
				never :
		never
} 


export type validHTMLElementSpecificAttrs<TAG extends string> = TAG extends keyof typeof htmlElementAttributes ? {
	[key in (typeof htmlElementAttributes)[TAG][number]]: TAG extends keyof htmlElementAttributeValues ? (key extends keyof htmlElementAttributeValues[TAG] ? htmlElementAttributeValues[TAG][key] : string) : string
} : unknown;

// export type validHTMLElementSpecificAttrs<TAG extends string> = TAG extends keyof typeof htmlElementAttributes ? (
// 	(TAG extends keyof htmlElementAttributeValues ? htmlElementAttributeValues[TAG] : unknown ) & {
// 		[key in (typeof htmlElementAttributes)[TAG][number]]: TAG extends keyof htmlElementAttributeValues ? (key extends keyof htmlElementAttributeValues[TAG] ? unknown : string) : string
// 	}
// ) : Record<string,never>;


export type validSVGElementSpecificAttrs<TAG extends string> = TAG extends keyof typeof svgElementAttributes ? {
	[key in (typeof svgElementAttributes)[TAG][number]]: TAG extends keyof svgElementAttributeValues ? (key extends keyof svgElementAttributeValues[TAG] ? svgElementAttributeValues[TAG][key] : string) : string
} : unknown;


type a = validHTMLElementSpecificAttrs<"input">;

/** attribute definitions used by multiple elements */ 

// width, height
const widthAndHeight = ["width", "height"] as const;
type widthAndHeight = {
	width: htmlPixels,
	height: htmlPixels
}

// src
const src = ["src", "src:route"] as const;
type src = {
	src: string|URL
	"src:route": string
}

// href
const href = ["href", "href:route"] as const;
type href = {
	href: string|URL
	"href:route": string
}

// alt
const alt = "alt" as const;

// rel
type rel = {
	rel: "alternate"|"author"|"bookmark"|"canonical"|"dns-prefetch"|"external"|"help"|"icon"|"license"|"manifest"|"me"|"modulepreload"|"next"|"nofollow"|"noreferrer"|"opener"|"pingback"|"preconnect"|"prefetch"|"preload"|"prerender"|"prev"|"privacy-policy"|"search"|"stylesheet"|"tag"|"terms-of-service"
}
const input = ["spellcheck", "wrap", "autocapitalize", "autocomplete", "autofocus", "maxlength", "minlength", "disabled", "placeholder", "readonly", "required"] as const;
type input = {
	spellcheck: boolean | "true" | "false" | "default",
	wrap: "hard" | "soft" | "off",
	autocapitalize: "on" | "off" | "sentences" | "none" | "words" | "characters",
	autocomplete: boolean | AutoFill,
	autofocus: boolean,
	maxlength: htmlNumber|string,
	minlength: htmlNumber|string,
	disabled: boolean,
	placeholder: primitive,
	readonly: boolean,
	required: boolean
}

type MediaStream = any; // TODO:

/** list of all allowed attributes for HTML elements */
export const htmlElementAttributes = {

	a: [...href, "target", "download", "rel"],
	link: [...href, "rel"],

	script: [...src, "type", "async", "defer", "nomodule", "crossorigin", "integrity", "referrerpolicy"],

	progress: ["value", "max", "min"],
	input: ["popovertargetaction", "popovertarget", ...input, alt, ...src, alt, ...widthAndHeight, "min", "minlength", "accept", "autocomplete", "autofocus", "checked", "dirname", "disabled", "form", "formaction", "formenctype", "formmethod", "formnovalidate", "formtarget", "list", "max", "maxlength", "multiple", "name", "pattern", "placeholder", "readonly", "required", "size", "step", "type", "value", "value:out", "value:in", "value:selected"],
	button: ["popovertargetaction", "popovertarget", "type", "disabled", "form"],
	form: ["method", "enctype", "action", "rel"],
	img: [alt, ...src, ...widthAndHeight, "border", "crossorigin", "ismap", "loading", "longdesc", "referrerpolicy", "sizes", "srcset", "usemap"],
	template: ["shadowrootmode"],
	iframe: [...src, "allowtransparency", "allow"],
	details: ["open"],
	source: [...src, "type"],
	label: ["for"],
	video: [...src, ...widthAndHeight, "autoplay", "controls", "loop", "muted", "poster", "preload", "playsinline"],
	audio: [...src, "autoplay", "controls", "loop", "muted", "preload"],
	textarea: [...input, "name", "value", "value:out", "value:in", "cols", "rows"],
	option: ["value", "selected", "disabled"],
	select: ["value", "autocomplete", "required"],
	dialog: ["open"],
	table: ["cellspacing", "cellpadding", "align", "width", "border"],
	meta: ["content"],
	optgroup: ["label", "disabled"],
} as const satisfies {[key in keyof HTMLElementTagNameMap]?: readonly string[]};


/** custom values for specific element attributes (default: string) */
export type htmlElementAttributeValues = {
	a: href & rel & {
		download: string|boolean
	},

	link: href & rel,
	
	input: (widthAndHeight & src & input & {
		checked: boolean 
		dirname: `${string}.dir`
		disabled: boolean
		formenctype: "application/x-www-form-urlencoded"|"multipart/form-data"|"text/plain"
		formmethod: "get"|"post"
		formnovalidate: boolean
		max: htmlNumber|string
		maxlength: htmlNumber
		min: htmlNumber|string
		minlength: htmlNumber
		multiple: boolean
		readonly: boolean
		required: boolean
		size: htmlNumber,
		step: htmlNumber,
		type: "button"|"checkbox"|"color"|"date"|"datetime-local"|"email"|"file"|"hidden"|"image"|"month"|"number"|"password"|"radio"|"range"|"reset"|"search"|"submit"|"tel"|"text"|"time"|"url"|"week",

		popovertarget: string,
		popovertargetaction: string,
		value: primitive|Time,
		"value:out": primitive|Time,
		"value:in": primitive|Time,
		"value:selected": string|number
	}) 
	// TODO: conditional attributes
	// & (
	// 	{
	// 		"type": "text",
	// 		value: primitive
	// 	} |
	// 	{
	// 		"type": "number"|"range",
	// 		value: number
	// 	} |
	// 	{
	// 		"type": "date"|"time"|"datetime-local"|"month"|"week",
	// 		value: number|string|Time
	// 	} |
	// 	{
	// 		"type": "color",
	// 		value: string
	// 	} |
	// 	{
	// 		"type": "file",
	// 		value: File
	// 	} |
	// 	{
	// 		"type": "checkbox"|"radio",
	// 		value: boolean
	// 	}
	// )

	select: {
		required: boolean,
		value: primitive,
		autocomplete: boolean | AutoFill,
	},

	progress: {
		value: string | number,
		max: string | number,
		min: string | number
	},

	button: {
		type: "button"|"submit"|"reset",
		disabled: boolean,
		popovertarget: string,
		popovertargetaction: string
	},

	form: rel & {
		method: "get"|"post",
		enctype: "application/x-www-form-urlencoded"|"multipart/form-data"|"text/plain"
		action: string | URL | ((ctx: any) => any)  // TODO: |UIX.Entrypoint
	},

	img: widthAndHeight & src &  {
		crossorigin: "anonymous"|"use-credentials"
		ismap: boolean,
		loading: "eager"|"lazy",
		referrerpolicy: "no-referrer"|"no-referrer-when-downgrade"|"origin"|"origin-when-cross-origin"|"unsafe-url",
		usemap: `#${string}`
	},
	template: {
		shadowrootmode: 'open'|'closed'
	},

	iframe: src & {
		allowtransparency: boolean | "true" | "false"
	},

	source: src,

	video: widthAndHeight & (src | {src: MediaStream}) & {
		autoplay: boolean,
		controls: boolean,
		loop: boolean,
		muted: boolean,
		poster: string|URL,
		preload: "auto"|"metadata"|"none"
	},
	audio: (src | {src: MediaStream}) & {
		autoplay: boolean,
		controls: boolean,
		loop: boolean,
		muted: boolean,
		preload: "auto"|"metadata"|"none",
	},

	textarea: widthAndHeight & input & {
		rows: htmlNumber|string,
		cols: htmlNumber|string,
		value: string,
		"value:out": string,
		"value:in": string
	},
	option: {
		selected: boolean,
		disabled: boolean,
		required: boolean
	},
	table: {
		cellspacing: string,
		cellpadding: string,
		align: string,
		width: string, 
		border: string
	},

	optgroup: {
		label: string,
		disabled: boolean
	},
}



// width, height
const cXY = ["cx", "cy"] as const;
type cXY = {
	cx: svgLength,
	cy: svgLength
}

const xy = ["x", "y"] as const;
type xy = {
	x: svgLength,
	y: svgLength
}

export const svgTags = new Set(["animate", "animateMotion", "animateTransform", "circle", "clipPath", "defs", "desc", "ellipse", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDisplacementMap", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence", "filter", "foreignObject", "g", "image", "line", "linearGradient", "marker", "mask", "metadata", "mpath", "path", "pattern", "polygon", "polyline", "radialGradient", "rect", "set", "stop",  "svg", "switch", "symbol", "text", "textPath","tspan", "use", "view"] satisfies (keyof SVGElementTagNameMap)[])

// TODO: name collisions: "a", "script", "style",  "title", 

const genericSvgAttributes = [
	...cXY, ...widthAndHeight, ...xy, "x1","x2","y1","y2", "mask", "rx", "ry", "fill", "fill-rule", "stroke", "stroke-width", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "transform",
	"mode", "in", "in2", "result", "filterUnits", "color-interpolation-filters","stop-color","offset","gradientUnits","gradientTransform",
	"xmlns", "version", "xmlns:xlink", "viewBox", "preserveAspectRatio", "d", "stdDeviation", "values", "type", "clip-path", "text-anchor", "filter", "flood-opacity", "operator", "dy", "fill-opacity", "r"
] as const;

/** list of all allowed attributes for HTML elements */
export const svgElementAttributes = Object.fromEntries([...svgTags].map(tag => [tag, genericSvgAttributes])) satisfies {[key in keyof SVGElementTagNameMap]?: readonly string[]};
export const svgElementAttributesLowercase = Object.fromEntries([...svgTags].map(tag => [tag.toLowerCase(), genericSvgAttributes])) satisfies {[key in keyof SVGElementTagNameMap]?: readonly string[]};

// {
// 	circle: [...genericSvgAttributes, "r"],
// 	svg: [...genericSvgAttributes, "xmlns", "version", "xmlns:xlink", "viewBox", "preserveAspectRatio"],
// 	path: [...genericSvgAttributes, "d"],
// 	tspan: [...genericSvgAttributes, "text-anchor"],
// 	text: [...genericSvgAttributes],
// 	g: [...genericSvgAttributes],
// 	feFlood: [...genericSvgAttributes],
// 	feColorMatrix: [...genericSvgAttributes],
// 	feOffset: [...genericSvgAttributes],
// 	feGaussianBlur: [...genericSvgAttributes],
// 	feBlend: [...genericSvgAttributes],
// 	feComposite: [...genericSvgAttributes],
// 	feDisplacementMap: [...genericSvgAttributes],
// 	feSpecularLighting: [...genericSvgAttributes],
// 	fePointLight: [...genericSvgAttributes],
// 	feSpotLight: [...genericSvgAttributes],
// 	feDiffuseLighting: [...genericSvgAttributes],
// 	feConvolveMatrix: [...genericSvgAttributes],
// 	filter: [...genericSvgAttributes],
// 	radialGradient: [...genericSvgAttributes],
// 	stop: [...genericSvgAttributes],
// } as const satisfies {[key in keyof SVGElementTagNameMap]?: readonly string[]};


/** custom values for specific element attributes (default: string) */
export type svgElementAttributeValues = {
	circle: cXY & {
		r: svgLength
	},
	tspan: xy,
	text: xy
}


export const mathMLTags = new Set(["annotation","annotation-xml","maction","math","merror","mfrac","mi","mmultiscripts","mn","mo","mover","mpadded","mphantom","mprescripts","mroot","mrow","ms","mspace","msqrt","mstyle","msub","msubsup","msup","mtable","mtd","mtext","mtr","munder","munderover","semantics"] satisfies (keyof MathMLElementTagNameMap)[])

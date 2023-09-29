import { Attr } from "./Attr.ts";

export class NamedNodeMap extends Map<string, Attr> {

	private constructor() {
		super()
	}
	
	item(index: number) {
		return [...this.values()][index]
	}

	get length() {
		return this.size
	}

	getNamedItem(name: string) {
		return this.get(name)
	}
	setNamedItem(name: string, value: Attr) {
		return this.set(name, value)
	}
	removeNamedItem(name: string) {
		return this.delete(name)
	}

	static create():NamedNodeMap{
        const nodeMap = new NamedNodeMap();

		nodeMap.set = nodeMap.set.bind(nodeMap);
		nodeMap.get = nodeMap.get.bind(nodeMap);
		nodeMap.values = nodeMap.values.bind(nodeMap);
		nodeMap.values = nodeMap.values.bind(nodeMap);

        return <NamedNodeMap><any> new Proxy(nodeMap, {
            set(target, p, newValue) {
				if (p == "length" || typeof p == "symbol") (target as any)[p] = newValue;
				else if (!Number.isNaN(Number(p))) {console.warn("!! TODO set at correct index")}
				else (target as any)[p] = newValue;
                return true;
            },
            get(target, p) {
				if (p == "length" || typeof p == "symbol") return (target as any)[p];
                else if (!Number.isNaN(Number(p))) return target.item(Number(p))
				else return (target as any)[p];
            },
        })
    }
}
import type { Node } from "./Node.ts";
import { DOM_INTERNAL } from "./constants.ts";

export class NodeList extends Map<number, Node> {
	[key:number]: Node

	private constructor() {
		super()
	}

	item(index: number) {
		return this.get(index)
	}

	get length() {
		return this.size
	}

	static create():NodeList{
        const nodeList = new NodeList();

		nodeList.set = nodeList.set.bind(nodeList);
		nodeList.get = nodeList.get.bind(nodeList);
		nodeList.values = nodeList.values.bind(nodeList);
		nodeList.values = nodeList.values.bind(nodeList);

        return <NodeList><any> new Proxy(nodeList, {
            set(target, p, newValue) {
				if (p == "length" || typeof p == "symbol") (target as any)[p] = newValue;
				else if (!Number.isNaN(Number(p))) target.set(Number(p), newValue); 
				else (target as any)[p] = newValue;
                return true;
            },
            get(target, p) {
				if (p == "length" || typeof p == "symbol") return (target as any)[p];
                else if (!Number.isNaN(Number(p))) return target.get(Number(p)); 
				else return (target as any)[p];
            },
        })
    }
	
	#getLastIndex() {
		if (this.size == 0) return -1;
		else return Math.max(...[...this.keys()].toReversed());
	}

	[DOM_INTERNAL] = {
		append: (...nodes: Node[]) => {
			let i = this.#getLastIndex()+1;
			for (const node of nodes) {
				this.set(i++, node);
			}
		}
	}
}
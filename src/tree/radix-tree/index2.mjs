/**
 * 此实现内部使用数组存储子节点，并且没有拆除一个单独的'边'对象，而是用一个 Node 表示。
 *
 */

const NO_MISMATCH = -1;

function getFirstMismatchLetter(word, edgeWord) {
  const LENGTH = Math.min(word.length, edgeWord.length);
  for (let i = 1; i < LENGTH; i++) {
    if (word[i] !== edgeWord[i]) {
      return i;
    }
  }
  return NO_MISMATCH;
}

class Node {
  constructor(label, value, isLeaf) {
    this.label = label;
    this.value = value;
    this.children = [];
    this.isLeaf = isLeaf;
  }
  matchEdge(char) {
    return this.children.find((value) => value.label[0] === char);
  }

  removeEdge(char) {
    this.children = this.children.filter((value) => value.label[0] !== char);
  }
}

export class RadixTree {
  constructor() {
    this.root = new Node("root", null, false);
  }

  remove(key) {
    if (typeof key !== "string" || key === "") return;
    const nodes = [this.root];
    let currIndex = 0;
    let current = this.root;
    while (currIndex < key.length) {
      // 是否有找到对应的边
      current = current.matchEdge(key[currIndex]);
      if (current == null) {
        return;
      }
      // 对应的边是否是当前剩余字符的前缀
      const part = key.substring(currIndex);
      if (!part.startsWith(current.label)) {
        return;
      }
      nodes.push(current);
      currIndex += current.label.length;
    }
    // console.info(nodes, current);
    // 在这里的current 也等于 edges.pop().next
    // 如果指定的 key 不是一个单词节点，则直接返回
    if (!current.isLeaf) return;
    // 将其标记为非单词节点并删除存储的值。
    current.value = null;
    current.isLeaf = false;
    // 第一轮循环是删除操作，其次的循环是回溯修复结构
    for (let i = nodes.length - 2; i >= 0; i--) {
      const parent = nodes[i];
      // console.info(parent, current);
      // return;
      // 如果剩余的边大于1则已处理完毕（对树结构没有影响）。
      if (current.children.length > 1) return;
      // 只剩下一条边场景
      if (current.children.length === 1 && !current.isLeaf) {
        // 合并只需要在原来的对象上修改就行了。
        // 进入此条件也必定只存在一个子节点了。
        parent.removeEdge(current.label[0]);
        const afterEdge = current.children[0];
        const suffix = current.label + afterEdge.label;
        const newNode = new Node(suffix, afterEdge.value, afterEdge.isLeaf);
        newNode.children = afterEdge.children;
        parent.children.push(newNode);
        // 没有任何边的场景
        // 此场景只会在最底层出现，出现时此节点的如果不是单词节点则必定存在兄弟节点，那么会在上面的流程结束
      } else if (current.children.length === 0 && !current.isLeaf) {
        parent.removeEdge(current.label[0]);
      }
      current = parent;
    }
  }

  put(key, value) {
    if (typeof key !== "string" || key === "") return;
    let currIndex = 0;
    let current = this.root;
    while (currIndex < key.length) {
      // 尝试找到对应的边
      const findIndex = current.children.findIndex((value) => value.label[0] === key[currIndex]);
      const edge = current.children[findIndex] || null;
      const subString = key.substring(currIndex);
      if (edge == null) {
        current.children.push(new Node(subString, value, true));
        break;
      }
      // 检查是否需要拆分边
      let splitIndex = getFirstMismatchLetter(subString, edge.label);

      // a 是 b 的前缀或者反过来或者完全匹配
      if (splitIndex === NO_MISMATCH) {
        // 完全匹配
        if (subString.length === edge.label.length) {
          edge.isLeaf = true;
          edge.value = value;
          break;
          // 边的字符比剩余单词的字符长。需要对边进行拆分。
        } else if (subString.length < edge.label.length) {
          edge.label = edge.label.substring(subString.length);
          const parent = new Node(subString, value, true);
          parent.children.push(edge);
          current.children[findIndex] = parent;
          break;
          // 还有剩余的单词
        } else {
          splitIndex = edge.label.length;
        }
      } else {
        edge.label = edge.label.substring(splitIndex);
        const parentLabel = subString.substring(0, splitIndex);
        const parent = new Node(parentLabel, null, false);
        const brother = new Node(subString.substring(splitIndex), value, true);
        parent.children.push(edge, brother);
        current.children[findIndex] = parent;
        break;
      }
      current = edge;
      currIndex += splitIndex;
    }
  }

  lookup(key) {
    if (typeof key !== "string" || key === "") return null;
    let currIndex = 0;
    let current = this.root;
    while (currIndex < key.length) {
      // 是否有找到对应的边
      current = current.matchEdge(key[currIndex]);
      if (current == null) {
        return null;
      }
      // 对应的边是否是当前剩余字符的前缀
      const part = key.substring(currIndex);
      if (!part.startsWith(current.label)) {
        return null;
      }
      currIndex += current.label.length;
    }
    return current.isLeaf ? current.value : null;
  }

  size() {
    return this.keys().length;
  }

  clear() {
    this.root = new Node("root", null, false);
  }

  getKeysWithPrefix(prefix) {
    if (typeof prefix !== "string") return [];
    return this.getEntriesWithPrefix(prefix).map((value) => value[0]);
  }

  getValuesWithPrefix(prefix) {
    if (typeof prefix !== "string") return [];
    return this.getEntriesWithPrefix(prefix).map((value) => value[1]);
  }

  getEntriesWithPrefix(prefix) {
    if (typeof prefix !== "string") return [];
    if (prefix === "string") return this.entries();
    let word = "";
    let currIndex = 0;
    const result = [];
    let current = this.root;
    while (currIndex < prefix.length) {
      // 是否有找到对应的边
      current = current.matchEdge(prefix[currIndex]);
      if (current == null) {
        return [];
      }
      // 对应的边是否是当前剩余字符的前缀
      const part = prefix.substring(currIndex);
      // 如果不是前缀，那么就没有精准匹配的节点了，直接返回对应边的下个节点
      if (!part.startsWith(current.label)) {
        word += current.label;
        break;
      }
      word += current.label;
      currIndex += current.label.length;
    }

    const nodes = [{ prefix: word, node: current }];
    while (nodes.length) {
      const { prefix, node } = nodes.pop();
      if (node.isLeaf) {
        result.push([prefix, node.value]);
      }
      for (let edge of node.children) {
        nodes.push({ prefix: prefix + edge.label, node: edge });
      }
    }
    return result;
  }

  containsKey(key) {
    if (typeof key !== "string" || key === "") return false;
    let currIndex = 0;
    let current = this.root;
    while (currIndex < key.length) {
      // 是否有找到对应的边
      current = current.matchEdge(key[currIndex]);
      if (current == null) {
        return false;
      }
      // 对应的边是否是当前剩余字符的前缀
      const part = key.substring(currIndex);
      if (!part.startsWith(current.label)) {
        return false;
      }
      currIndex += current.label.length;
    }
    return current.isLeaf === true;
  }

  containsPrefix(prefix) {
    if (typeof prefix !== "string") return false;
    if (prefix === "") return this.size() > 0;
    let currIndex = 0;
    let current = this.root;
    while (currIndex < prefix.length) {
      // 是否有找到对应的边
      current = current.matchEdge(prefix[currIndex]);
      if (current == null) {
        return false;
      }
      // 对应的边是否是当前剩余字符的前缀
      const part = prefix.substring(currIndex);
      if (!part.startsWith(current.label)) {
        // 如果反过来剩余字符是当前节点的前缀，那么树中也是存在前缀的。
        if (current.label.startsWith(part)) {
          return true;
        }
        // 如果互相不是前缀，那么树中就不存在前缀了
        return false;
      }
      currIndex += current.label.length;
    }
    return true;
  }

  containsValue(value) {
    const stack = [this.root];
    while (stack.length) {
      const node = stack.pop();
      if (node.isLeaf && node.value === value) {
        return true;
      }
      for (const edge of node.children) {
        stack.push(edge);
      }
    }
    return false;
  }

  keys() {
    return this.entries().map((val) => val[0]);
  }

  values() {
    return this.entries().map((val) => val[1]);
  }

  entries() {
    const result = [];
    const nodes = [{ prefix: "", node: this.root }];
    while (nodes.length) {
      const { prefix, node } = nodes.pop();
      if (node.isLeaf) {
        result.push([prefix, node.value]);
      }
      for (const edge of node.children) {
        nodes.push({ prefix: prefix + edge.label, node: edge });
      }
    }
    return result;
  }
}

/**
 * Outputs a string representation of the tree.
 * @param tree
 * @return {string}
 */
export function prettyPrint(tree) {
  if (!(tree instanceof RadixTree)) {
    return "";
  }
  const result = [];
  const stack = [{ prefix: "", word: "", parentPrefix: "", value: tree.root }];
  while (stack.length) {
    const { prefix, parentPrefix, value, word } = stack.pop();
    const children = value.children;
    const maxIndex = children.length - 1;
    if (value !== tree.root) {
      result.push(`${prefix}${value.isLeaf ? ` (${word}:${value.value})` : ""}`);
    } else {
      result.push(`root`);
    }
    for (let i = maxIndex; i >= 0; i--) {
      const node = children[i];
      const isLastNode = i === maxIndex;
      const nodePrefix = isLastNode ? "└── " : "├── ";
      const childPrefix = isLastNode ? "    " : "│   ";
      stack.push({
        value: node,
        word: word + node.label,
        parentPrefix: parentPrefix + childPrefix,
        prefix: `${parentPrefix + nodePrefix}${node.label}`,
      });
    }
  }
  return result.join("\n");
}

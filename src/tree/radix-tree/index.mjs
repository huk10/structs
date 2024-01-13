const NO_MISMATCH = -1;

// 每条边都会有上一个节点和下一个节点
class Edge {
  constructor(label, next) {
    this.next = next;
    this.label = label;
  }
}

// 节点可能没有边（单词结尾）
class Node {
  constructor(isLeaf, value) {
    // 可以使用map结构存储。
    this.edges = [];
    this.isLeaf = isLeaf;
    this.value = value || null;
  }

  addEdge(label, next) {
    this.edges.push(new Edge(label, next));
  }

  removeEdge( char) {
    this.edges = this.edges.filter((val) => val.label[0] !== char);
  }

  matchEdge( char) {
    const edge = this.edges.find((val) => val.label[0] === char);
    return edge || null;
  }
}

export class RadixTree {
  constructor() {
    this.root = new Node(false);
  }

  /**
   * Insert a piece of data into the tree.
   * If the key value already exists, replace the value.
   * @param key {string}
   * @param value {*}
   */
  put(key, value) {
    if (typeof key !== "string" || key === "") return;
    let currIndex = 0;
    let current = this.root;
    while (currIndex < key.length) {
      // 尝试找到对应的边
      const edge = current.matchEdge(key[currIndex]);
      const subString = key.substring(currIndex);
      if (edge === null) {
        current.addEdge(subString, new Node(true, value));
        break;
      }
      // 检查是否需要拆分边
      let splitIndex = getFirstMismatchLetter(subString, edge.label);
      // a 是 b 的前缀或者反过来或者完全匹配
      if (splitIndex === NO_MISMATCH) {
        // 完全匹配
        if (subString.length === edge.label.length) {
          edge.next.isLeaf = true;
          edge.next.value = value;
          break;
          // 边的字符比剩余单词的字符长。需要对边进行拆分。
        } else if (subString.length < edge.label.length) {
          const suffix = edge.label.substring(subString.length);
          edge.label = subString;
          const next = new Node(true, value);
          const afterNext = edge.next;
          edge.next = next;
          next.addEdge(suffix, afterNext);
          break;
          // 还有剩余的单词
        } else {
          splitIndex = edge.label.length;
        }
      } else {
        const suffix = edge.label.substring(splitIndex);
        edge.label = edge.label.substring(0, splitIndex);
        const afterNext = edge.next;
        edge.next = new Node(false);
        edge.next.addEdge(suffix, afterNext);
      }
      current = edge.next;
      currIndex += splitIndex;
    }
  }

  /**
   * Delete the value associated with the specified key
   * @param key {string}
   */
  remove(key) {
    if (typeof key !== "string" || key === "") return;
    const edges = [];
    const nodes = [];
    let currIndex = 0;
    let current = this.root;
    while (currIndex < key.length) {
      // 是否有找到对应的边
      const edge = current.matchEdge(key[currIndex]);
      if (edge == null) {
        return;
      }
      // 对应的边是否是当前剩余字符的前缀
      const part = key.substring(currIndex);
      if (!part.startsWith(edge.label)) {
        return;
      }
      edges.push(edge);
      nodes.push(current);
      current = edge.next;
      currIndex += edge.label.length;
    }

    // 在这里的current 也等于 edges.pop().next
    // 如果指定的 key 不是一个单词节点，则直接返回
    if (!current.isLeaf) return;
    // 将其标记为非单词节点并删除存储的值。
    current.value = null;
    current.isLeaf = false;

    // 第一轮循环是删除操作，其次的循环是回溯修复结构
    for (let i = nodes.length - 1; i >= 0; i--) {
      const edge = edges[i];
      const parent = nodes[i];
      const current = edge.next;
      // 如果剩余的边大于1则已处理完毕（对树结构没有影响）。
      if (current.edges.length > 1) return;
      // 只剩下一条边场景
      if (current.edges.length === 1 && !current.isLeaf) {
        // 合并只需要在原来的对象上修改就行了。
        // 进入此条件也必定只存在一个子节点了。
        parent.removeEdge(edge.label[0]);
        const afterEdge = current.edges[0];
        parent.addEdge(edge.label + afterEdge.label, afterEdge.next);
        continue;
      }
      // 没有任何边的场景
      // 此场景只会在最底层出现，出现时此节点的如果不是单词节点则必定存在兄弟节点，那么会在上面的流程结束
      if (current.edges.length === 0 && !current.isLeaf) {
        parent.removeEdge(edge.label[0]);
      }
    }
  }

  /**
   * Returns the value associated with the specified key.
   */
  lookup(key) {
    if (typeof key !== "string" || key === "") return null;
    const node = this.lookupPrefixNode(key);
    return node && node.isLeaf ? node.value : null;
  }

  /**
   * Whether the specified key exists.
   */
  containsKey(key) {
    if (typeof key !== "string" || key === "") return false;
    const node = this.lookupPrefixNode(key);
    return (node && node.isLeaf) || false;
  }

  /**
   * Query whether the specified value exists in the tree.
   * If value is null then true will be returned if there is any null value in the tree.
   * Internally uses depth-first search.
   */
  containsValue(value) {
    const stack = [this.root];
    while (stack.length) {
      const node = stack.pop();
      if (node.isLeaf && node.value === value) {
        return true;
      }
      for (const edge of node.edges) {
        stack.push(edge.next);
      }
    }
    return false;
  }

  containsPrefix(prefix) {
    if (typeof prefix !== "string") return false;
    if (prefix === "") return this.size() > 0;
    const matchResult = this.matchPrefixNode(prefix);
    return matchResult !== null;
  }

  /**
   * @private
   * @param prefix {string}
   * @return {Node|null}
   */
  lookupPrefixNode(prefix) {
    let currIndex = 0;
    let current = this.root;
    while (currIndex < prefix.length) {
      // 是否有找到对应的边
      const edge = current.matchEdge(prefix[currIndex]);
      if (edge == null) {
        return null;
      }
      // 对应的边是否是当前剩余字符的前缀
      const part = prefix.substring(currIndex);
      if (!part.startsWith(edge.label)) {
        return null;
      }
      current = edge.next;
      currIndex += edge.label.length;
    }
    return current;
  }

  /**
   * @private
   * @param prefix {string}
   * @return {Node|null}
   */
  matchPrefixNode(prefix) {
    let word = "";
    let currIndex = 0;
    let current = this.root;
    while (currIndex < prefix.length) {
      // 是否有找到对应的边
      const edge = current.matchEdge(prefix[currIndex]);
      if (edge == null) {
        return null;
      }
      // 对应的边是否是当前剩余字符的前缀
      const part = prefix.substring(currIndex);
      // 如果不是前缀，那么就没有精准匹配的节点了
      if (!part.startsWith(edge.label)) {
        // 如果反过来剩余字符是当前节点的前缀，那么树中也是存在前缀的。
        if (edge.label.startsWith(part)) {
          word += edge.label;
          return { word, node: edge.next };
        }
        // 如果互相不是前缀，那么树中就不存在前缀了
        return null;
      }
      word += edge.label;
      current = edge.next;
      currIndex += edge.label.length;
    }
    return { word, node: current };
  }

  /**
   * Gets a list of keys with the given prefix.
   * @param prefix {string}
   * @return {Array<string>}
   */
  getKeysWithPrefix(prefix) {
    return this.getEntriesWithPrefix(prefix).map((item) => item[0]);
  }

  /**
   * Gets a list of values whose associated keys have the given prefix.
   * @param prefix {string}
   * @return {Array<*>}
   */
  getValuesWithPrefix(prefix) {
    return this.getEntriesWithPrefix(prefix).map((item) => item[1]);
  }

  /**
   * Gets a list of entries whose associated keys have the given prefix.
   * @param prefix {string}
   * @return {Array<[string, *]>}
   */
  getEntriesWithPrefix(prefix) {
    if (typeof prefix !== "string") return [];
    if (prefix === "") return this.entries();
    const matchResult = this.matchPrefixNode(prefix);
    if (matchResult === null) return [];
    const result = [];
    const { word, node: prefixNode } = matchResult;
    const nodes = [{ prefix: word, node: prefixNode }];
    while (nodes.length) {
      const { prefix, node } = nodes.pop();
      if (node.isLeaf) {
        result.push([prefix, node.value]);
      }
      for (let edge of node.edges) {
        nodes.push({ prefix: prefix + edge.label, node: edge.next });
      }
    }
    return result;
  }

  /**
   * Use preorder to traverse all nodes (word nodes).
   * Return all keys.
   */
  keys() {
    return this.entries().map((item) => item[0]);
  }

  /**
   * Use preorder to traverse all nodes (word nodes).
   * Return all values.
   */
  values() {
    return this.entries().map((item) => item[1]);
  }

  /**
   * Use preorder to traverse all nodes (word nodes).
   * Return all key value pair.
   */
  entries() {
    const result = [];
    const nodes = [{ prefix: "", node: this.root }];
    while (nodes.length) {
      const { prefix, node } = nodes.pop();
      if (node.isLeaf) {
        result.push([prefix, node.value]);
      }
      for (const edge of node.edges) {
        nodes.push({ prefix: prefix + edge.label, node: edge.next });
      }
    }
    return result;
  }

  /**
   * Returns the number of data stored in the tree.
   * It will be traversed once every call.
   */
  size() {
    return this.keys().length;
  }

  /**
   * Delete all data in the tree.
   */
  clear() {
    this.root = new Node(false);
  }
}

/**
 * Output a string showing the tree structure.
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
    const children = value.edges;
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
        value: node.next,
        word: word + node.label,
        parentPrefix: parentPrefix + childPrefix,
        prefix: `${parentPrefix + nodePrefix}${node.label}`,
      });
    }
  }
  return result.join("\n");
}

function getFirstMismatchLetter(word, edgeWord) {
  const LENGTH = Math.min(word.length, edgeWord.length);
  for (let i = 1; i < LENGTH; i++) {
    if (word[i] !== edgeWord[i]) {
      return i;
    }
  }
  return NO_MISMATCH;
}

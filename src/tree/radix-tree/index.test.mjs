import { describe, test, expect } from "vitest";
import { RadixTree, prettyPrint } from "./index.mjs";

const illegalEntry = [100, true, false, null, undefined, [], {}, /\d{11}/, new Map(), new Set(), new Date()];

export function radixTreeTest(RadixTree, prettyPrint) {
  function printTree(tree) {
    return prettyPrint(tree).split("\n");
  }
  describe("radix-tree:", () => {
    describe("put:", () => {
      test("场景1：插入不是字符串的Key", () => {
        const tree = new RadixTree();
        for (const param of illegalEntry) {
          tree.put(param, param);
        }
        expect(printTree(tree)).toStrictEqual(["root"]);
      });

      test("场景2：已存在节点没有带有单词前缀的边", () => {
        const tree = new RadixTree();
        tree.put("water", 1);
        expect(printTree(tree)).toStrictEqual(["root", "└── water (water:1)"]);
        tree.put("slow", 1);
        expect(printTree(tree)).toStrictEqual(["root", "├── water (water:1)", "└── slow (slow:1)"]);
      });

      test("场景3：前缀与单词的第一部分完全匹配，但单词仍有剩余部分", () => {
        const tree = new RadixTree();
        tree.put("water", 1);
        tree.put("slow", 1);
        expect(printTree(tree)).toStrictEqual(["root", "├── water (water:1)", "└── slow (slow:1)"]);
        tree.put("slower", 1);
        expect(printTree(tree)).toStrictEqual([
          "root",
          "├── water (water:1)",
          "└── slow (slow:1)",
          "    └── er (slower:1)",
        ]);
      });

      test("场景4：单词与前缀匹配，但前缀有剩余部分（单词比前缀短）", () => {
        const tree = new RadixTree();
        tree.put("water", 1);
        tree.put("slower", 1);
        expect(printTree(tree)).toStrictEqual(["root", "├── water (water:1)", "└── slower (slower:1)"]);
        tree.put("slow", 1);
        expect(printTree(tree)).toStrictEqual([
          "root",
          "├── water (water:1)",
          "└── slow (slow:1)",
          "    └── er (slower:1)",
        ]);
      });

      test("场景5：前缀与单词不匹配", () => {
        {
          /**
           * “waste” -> 找到“water”，但不匹配“wat”！=“was”
           *      “wa”是先前匹配的前缀
           *            必须将“water”拆分为“wa”和“ter”并将属性保留为单词
           * “ste” -> 插入
           */
          const tree = new RadixTree();
          tree.put("water", 1);
          tree.put("slow", 3);
          tree.put("slower", 4);
          expect(printTree(tree)).toStrictEqual([
            "root",
            "├── water (water:1)",
            "└── slow (slow:3)",
            "    └── er (slower:4)",
          ]);
          tree.put("waste", 2);
          expect(printTree(tree)).toStrictEqual([
            "root",
            "├── wa",
            "│   ├── ter (water:1)",
            "│   └── ste (waste:2)",
            "└── slow (slow:3)",
            "    └── er (slower:4)",
          ]);
        }
        {
          /**
           * “watch” -> 发现“wa”作为前缀，从当前输入中删除前缀
           * “tch” -> 找到“ter”，但错误匹配“te”！=“tc”
           *     “t”是先前匹配的前缀
           *     必须将“ter”拆分为“t”和“er”，并保留“er”属性作为单词。
           * “ch”-> 正常插入
           */
          const tree = new RadixTree();
          tree.put("water", 1);
          tree.put("slow", 2);
          tree.put("slower", 3);
          tree.put("waste", 4);
          expect(printTree(tree)).toStrictEqual([
            "root",
            "├── wa",
            "│   ├── ter (water:1)",
            "│   └── ste (waste:4)",
            "└── slow (slow:2)",
            "    └── er (slower:3)",
          ]);
          tree.put("watch", 5);
          expect(printTree(tree)).toStrictEqual([
            "root",
            "├── wa",
            "│   ├── t",
            "│   │   ├── er (water:1)",
            "│   │   └── ch (watch:5)",
            "│   └── ste (waste:4)",
            "└── slow (slow:2)",
            "    └── er (slower:3)",
          ]);
        }
      });

      test("场景6：前缀和单词完全匹配并且长度相同", () => {
        //  只需将该节点标记为单词节点
        const tree = new RadixTree();
        tree.put("water", 1);
        tree.put("slow", 2);
        tree.put("slower", 3);
        tree.put("waste", 4);
        tree.put("watch", 5);
        expect(tree.lookup("wa")).toBe(null);
        expect(printTree(tree)).toStrictEqual([
          "root",
          "├── wa",
          "│   ├── t",
          "│   │   ├── er (water:1)",
          "│   │   └── ch (watch:5)",
          "│   └── ste (waste:4)",
          "└── slow (slow:2)",
          "    └── er (slower:3)",
        ]);
        tree.put("wa", 6);
        expect(tree.lookup("wa")).toBe(6);
        expect(printTree(tree)).toStrictEqual([
          "root",
          "├── wa (wa:6)",
          "│   ├── t",
          "│   │   ├── er (water:1)",
          "│   │   └── ch (watch:5)",
          "│   └── ste (waste:4)",
          "└── slow (slow:2)",
          "    └── er (slower:3)",
        ]);
      });
    });

    describe("remove:", () => {
      test("场景1：传入的Key不是一个字符串", () => {
        const tree = new RadixTree();
        tree.put("water", 1);
        tree.put("slow", 2);
        tree.put("slower", 3);
        expect(printTree(tree)).toStrictEqual([
          "root",
          "├── water (water:1)",
          "└── slow (slow:2)",
          "    └── er (slower:3)",
        ]);
        for (const param of illegalEntry) {
          tree.remove(param);
        }
        expect(printTree(tree)).toStrictEqual([
          "root",
          "├── water (water:1)",
          "└── slow (slow:2)",
          "    └── er (slower:3)",
        ]);
      });

      test("场景2：删除非叶子单词节点-触发节点合并", () => {
        const tree = new RadixTree();
        tree.put("water", 1);
        tree.put("slow", 2);
        tree.put("slower", 3);
        expect(printTree(tree)).toStrictEqual([
          "root",
          "├── water (water:1)",
          "└── slow (slow:2)",
          "    └── er (slower:3)",
        ]);
        tree.remove("slow");
        expect(tree.lookup("slow")).toBe(null);
        expect(tree.lookup("slower")).toBe(3);
        expect(printTree(tree)).toStrictEqual(["root", "├── water (water:1)", "└── slower (slower:3)"]);
      });

      test("场景3：删除非叶子单词节点-不触发节点合并", () => {
        const tree = new RadixTree();
        tree.put("wa", 1);
        tree.put("hello", 2);
        tree.put("water", 3);
        tree.put("waste", 4);
        tree.put("watch", 5);
        expect(printTree(tree)).toStrictEqual([
          "root",
          "├── wa (wa:1)",
          "│   ├── t",
          "│   │   ├── er (water:3)",
          "│   │   └── ch (watch:5)",
          "│   └── ste (waste:4)",
          "└── hello (hello:2)",
        ]);
        expect(tree.lookup("wa")).toBe(1);
        tree.remove("wa");
        expect(tree.lookup("wa")).toBe(null);
        expect(printTree(tree)).toStrictEqual([
          "root",
          "├── wa",
          "│   ├── t",
          "│   │   ├── er (water:3)",
          "│   │   └── ch (watch:5)",
          "│   └── ste (waste:4)",
          "└── hello (hello:2)",
        ]);
      });

      test("场景4：删除非叶子非单词节点-不触发节点合并", () => {
        const tree = new RadixTree();
        tree.put("hello", 1);
        tree.put("water", 2);
        tree.put("waste", 3);
        tree.put("watch", 4);
        expect(printTree(tree)).toStrictEqual([
          "root",
          "├── hello (hello:1)",
          "└── wa",
          "    ├── t",
          "    │   ├── er (water:2)",
          "    │   └── ch (watch:4)",
          "    └── ste (waste:3)",
        ]);
        expect(tree.lookup("wa")).toBe(null);
        tree.remove("wa");
        expect(printTree(tree)).toStrictEqual([
          "root",
          "├── hello (hello:1)",
          "└── wa",
          "    ├── t",
          "    │   ├── er (water:2)",
          "    │   └── ch (watch:4)",
          "    └── ste (waste:3)",
        ]);
      });

      test("场景5：删除叶子节点兄弟节点是单词节点无子节点-不触发节点合并", () => {
        const tree = new RadixTree();
        tree.put("foo", 1);
        tree.put("hello", 2);
        tree.put("world", 3);
        expect(printTree(tree)).toStrictEqual([
          "root",
          "├── foo (foo:1)",
          "├── hello (hello:2)",
          "└── world (world:3)",
        ]);
        tree.remove("foo");
        expect(tree.lookup("foo")).toBe(null);
        expect(printTree(tree)).toStrictEqual(["root", "├── hello (hello:2)", "└── world (world:3)"]);
      });

      test("场景6：删除叶子节点，兄弟节点不是单词节点存在子节点-触发节点合并", () => {
        const tree = new RadixTree();
        tree.put("water", 2);
        tree.put("waste", 3);
        tree.put("watch", 4);
        expect(printTree(tree)).toStrictEqual([
          "root",
          "└── wa",
          "    ├── t",
          "    │   ├── er (water:2)",
          "    │   └── ch (watch:4)",
          "    └── ste (waste:3)",
        ]);
        tree.remove("waste");
        expect(printTree(tree)).toStrictEqual(["root", "└── wat", "    ├── er (water:2)", "    └── ch (watch:4)"]);
        expect(tree.lookup("waste")).toBe(null);
        expect(tree.lookup("water")).toBe(2);
        expect(tree.lookup("watch")).toBe(4);
      });

      test("场景7：删除叶子节点，兄弟节点是单词节点存在子节点-不触发节点合并", () => {
        const tree = new RadixTree();
        tree.put("wa", 1);
        tree.put("water", 2);
        tree.put("waste", 3);
        tree.put("watch", 4);
        expect(printTree(tree)).toStrictEqual([
          "root",
          "└── wa (wa:1)",
          "    ├── t",
          "    │   ├── er (water:2)",
          "    │   └── ch (watch:4)",
          "    └── ste (waste:3)",
        ]);
        tree.remove("waste");
        expect(printTree(tree)).toStrictEqual([
          "root",
          "└── wa (wa:1)",
          "    └── t",
          "        ├── er (water:2)",
          "        └── ch (watch:4)",
        ]);
        expect(tree.lookup("saste")).toBe(null);
        expect(tree.lookup("wa")).toBe(1);
        expect(tree.lookup("water")).toBe(2);
        expect(tree.lookup("watch")).toBe(4);
      });
    });

    describe("lookup:", () => {
      test("场景1：非法key或不存在的key", () => {
        const tree = new RadixTree();
        tree.put("hello", 1);
        tree.put("world", 2);
        for (const param of illegalEntry) {
          expect(tree.lookup(param)).toBe(null);
        }
        expect(tree.lookup("hello world!")).toBe(null);
      });

      test("场景2：正常无拆分节点", () => {
        const tree = new RadixTree();
        tree.put("hello", 1);
        tree.put("world", 2);
        expect(tree.lookup("hello")).toBe(1);
        expect(tree.lookup("world")).toBe(2);
        expect(tree.lookup("foo")).toBe(null);
      });

      test("场景3：值被替换", () => {
        const tree = new RadixTree();
        tree.put("hello", 1);
        tree.put("world", 2);
        expect(tree.lookup("hello")).toBe(1);
        tree.put("hello", 3);
        expect(tree.lookup("hello")).toBe(3);
      });

      test("场景4：一个单词是另一个单词前缀", () => {
        const tree = new RadixTree();
        tree.put("water", 1);
        tree.put("slow", 2);
        tree.put("slower", 3);
        expect(tree.lookup("water")).toBe(1);
        expect(tree.lookup("slow")).toBe(2);
        expect(tree.lookup("slower")).toBe(3);
      });

      test("场景5：单词拆分场景", () => {
        const tree = new RadixTree();
        tree.put("water", 1);
        tree.put("slower", 2);
        tree.put("slow", 3);
        expect(tree.lookup("water")).toBe(1);
        expect(tree.lookup("slower")).toBe(2);
        expect(tree.lookup("slow")).toBe(3);
      });

      test("场景6：节点多次拆分", () => {
        const tree = new RadixTree();
        tree.put("water", 1);
        tree.put("slow", 2);
        tree.put("slower", 3);
        tree.put("waste", 4);
        tree.put("watch", 5);
        expect(tree.lookup("water")).toBe(1);
        expect(tree.lookup("slow")).toBe(2);
        expect(tree.lookup("slower")).toBe(3);
        expect(tree.lookup("waste")).toBe(4);
        expect(tree.lookup("watch")).toBe(5);
      });

      test("场景7：中间单词节点", () => {
        const tree = new RadixTree();
        tree.put("water", 1);
        tree.put("waste", 2);
        tree.put("watch", 3);
        expect(tree.lookup("water")).toBe(1);
        expect(tree.lookup("waste")).toBe(2);
        expect(tree.lookup("watch")).toBe(3);
        expect(tree.lookup("wa")).toBe(null);
        tree.put("wa", 4);
        expect(tree.lookup("wa")).toBe(4);
      });
    });

    describe("prefixQuery:", () => {
      test("场景1：空字符或非法入参", () => {
        const tree = new RadixTree();
        tree.put("hello", 1);
        tree.put("world", 2);

        for (const param of illegalEntry) {
          expect(tree.getKeysWithPrefix(param)).toStrictEqual([]);
          expect(tree.getValuesWithPrefix(param)).toStrictEqual([]);
          expect(tree.getEntriesWithPrefix(param)).toStrictEqual([]);
        }

        expect(tree.getKeysWithPrefix("")).toStrictEqual(["world", "hello"]);
        expect(tree.getValuesWithPrefix("")).toStrictEqual([2, 1]);
        expect(tree.getEntriesWithPrefix("")).toStrictEqual([
          ["world", 2],
          ["hello", 1],
        ]);
      });

      test("场景2：不是任何单词的前缀", () => {
        const tree = new RadixTree();
        tree.put("hello", 1);
        tree.put("world", 2);
        expect(tree.getKeysWithPrefix("foo")).toStrictEqual([]);
        expect(tree.getValuesWithPrefix("foo")).toStrictEqual([]);
        expect(tree.getEntriesWithPrefix("foo")).toStrictEqual([]);
      });

      test("场景3：前缀比单词短以及前缀和单词完全匹配", () => {
        const tree = new RadixTree();
        tree.put("hello", 1);
        tree.put("world", 2);
        expect(tree.getKeysWithPrefix("he")).toStrictEqual(["hello"]);
        expect(tree.getKeysWithPrefix("hello")).toStrictEqual(["hello"]);
        expect(tree.getValuesWithPrefix("he")).toStrictEqual([1]);
        expect(tree.getValuesWithPrefix("hello")).toStrictEqual([1]);
        expect(tree.getEntriesWithPrefix("he")).toStrictEqual([["hello", 1]]);
        expect(tree.getEntriesWithPrefix("hello")).toStrictEqual([["hello", 1]]);
      });

      test("场景4：前缀是多个单词的前缀", () => {
        const tree = new RadixTree();
        tree.put("wa", 1);
        tree.put("hello", 1);
        tree.put("world", 1);
        tree.put("water", 4);
        tree.put("waste", 2);
        tree.put("watch", 3);
        expect(tree.getKeysWithPrefix("wa")).toStrictEqual(["wa", "waste", "watch", "water"]);
        expect(tree.getValuesWithPrefix("wa")).toStrictEqual([1, 2, 3, 4]);
        expect(tree.getEntriesWithPrefix("wa")).toStrictEqual([
          ["wa", 1],
          ["waste", 2],
          ["watch", 3],
          ["water", 4],
        ]);
      });
    });

    test("iterator:", () => {
      const tree = new RadixTree();
      tree.put("wa", 1);
      tree.put("hello", 2);
      tree.put("world", 3);
      tree.put("water", 4);
      tree.put("waste", 5);
      tree.put("watch", 6);

      expect(tree.keys()).toStrictEqual(["hello", "world", "wa", "waste", "watch", "water"]);
      expect(tree.values()).toStrictEqual([2, 3, 1, 5, 6, 4]);
      expect(tree.entries()).toStrictEqual([
        ["hello", 2],
        ["world", 3],
        ["wa", 1],
        ["waste", 5],
        ["watch", 6],
        ["water", 4],
      ]);
    });

    describe("contains:", () => {
      const tree = new RadixTree();
      tree.put("wa", 1);
      tree.put("hello", 2);
      tree.put("world", 3);
      tree.put("water", 4);
      tree.put("waste", 5);
      tree.put("watch", 6);
      test("场景1：非法key", () => {
        for (const param of illegalEntry) {
          expect(tree.containsKey(param)).toBe(false);
          expect(tree.containsPrefix(param)).toBe(false);
        }
      });

      test("场景2：返回 false 场景", () => {
        expect(tree.containsKey("1")).toStrictEqual(false);
        expect(tree.containsKey("2")).toStrictEqual(false);
        expect(tree.containsValue("hello")).toStrictEqual(false);
        expect(tree.containsValue("world")).toStrictEqual(false);
        expect(tree.containsValue(true)).toStrictEqual(false);
        expect(tree.containsValue(false)).toStrictEqual(false);
        expect(tree.containsValue(null)).toStrictEqual(false);
        expect(tree.containsValue(undefined)).toStrictEqual(false);

        expect(tree.containsPrefix("wt")).toStrictEqual(false);
        expect(tree.containsPrefix("wtf")).toStrictEqual(false);
      });

      test("场景3：返回 true 场景", () => {
        expect(tree.containsKey("wa")).toStrictEqual(true);
        expect(tree.containsKey("hello")).toStrictEqual(true);
        expect(tree.containsKey("world")).toStrictEqual(true);

        expect(tree.containsValue(2)).toStrictEqual(true);
        expect(tree.containsValue(3)).toStrictEqual(true);

        expect(tree.containsPrefix("")).toStrictEqual(true);
        expect(tree.containsPrefix("wa")).toStrictEqual(true);
        expect(tree.containsPrefix("hello")).toStrictEqual(true);
        expect(tree.containsPrefix("world")).toStrictEqual(true);
        expect(tree.containsPrefix("w")).toStrictEqual(true);
        expect(tree.containsPrefix("wat")).toStrictEqual(true);
      });
    });

    test("clear", () => {
      const tree = new RadixTree();
      tree.put("hello", 1);
      tree.clear();
      expect(printTree(tree)).toStrictEqual(["root"]);
    });

    test("size", () => {
      const tree = new RadixTree();
      tree.put("hello", 1);
      expect(tree.size()).toBe(1);
      tree.put("world", 2);
      expect(tree.size()).toBe(2);
      tree.put("he", 3);
      expect(tree.size()).toBe(3);
      tree.remove("he");
      expect(tree.size()).toBe(2);
    });
  });
}

radixTreeTest(RadixTree, prettyPrint);

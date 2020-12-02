import {SanitizerConfig} from '../types/configs/sanitizer-config';


// TODO: not exhaustive?
const blockElementNames = ['P', 'LI', 'TD', 'TH', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE'] as const;
function isBlockElement(node: Node) {
  return blockElementNames.indexOf((node.nodeName as any)) !== -1;
}

const inlineElementNames = ['A', 'B', 'STRONG', 'I', 'EM', 'SUB', 'SUP', 'U', 'STRIKE'] as const;
function isInlineElement(node: Node) {
  return inlineElementNames.indexOf((node.nodeName as any)) !== -1;
}

function createTreeWalker(document, node) {
  return document.createTreeWalker(node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT, null, false);
}

function getAllowedAttrs(config, nodeName, node) {
  if (typeof config.tags[nodeName] === 'function') {
    return config.tags[nodeName](node);
  } else {
    return config.tags[nodeName];
  }
}

function shouldRejectNode(node, allowedAttrs) {
  if (typeof allowedAttrs === 'undefined') {
    return true;
  } else if (typeof allowedAttrs === 'boolean') {
    return !allowedAttrs;
  }

  return false;
}

function shouldRejectAttr(attr, allowedAttrs, node){
  const attrName = attr.name.toLowerCase();

  if (allowedAttrs === true){
    return false;
  } else if (typeof allowedAttrs[attrName] === 'function'){
    return !allowedAttrs[attrName](attr.value, node);
  } else if (typeof allowedAttrs[attrName] === 'undefined'){
    return true;
  } else if (allowedAttrs[attrName] === false) {
    return true;
  } else if (typeof allowedAttrs[attrName] === 'string') {
    return (allowedAttrs[attrName] !== attr.value);
  }

  return false;
}


export class HTMLJanitor {
  public config: SanitizerConfig

  constructor(config) {
    const tagDefinitions = config['tags'];
    const tags = Object.keys(tagDefinitions);
    const validConfigValues = tags
      .map((k) => { return typeof tagDefinitions[k]; })
      .every((type) => { return type === 'object' || type === 'boolean' || type === 'function'; });
      if(!validConfigValues) {
        throw new Error('The configuration was invalid');
      }

      this.config = config;
  }

  clean(html: string): string {
    const sandbox = document.implementation.createHTMLDocument();
    const root = sandbox.createElement('div');
    root.innerHTML = html;

    this._sanitize(sandbox, root);

    return root.innerHTML;
  }

  _sanitize(document: Document, parentNode: HTMLDivElement) {
    const treeWalker = createTreeWalker(document, parentNode);
    let node = treeWalker.firstChild();

    if (!node) { return; }

    do {
      if (node.nodeType === Node.TEXT_NODE) {
        // If this text node is just whitespace and the previous or next element
        // sibling is a block element, remove it
        // N.B.: This heuristic could change. Very specific to a bug with
        // `contenteditable` in Firefox: http://jsbin.com/EyuKase/1/edit?js,output
        // FIXME: make this an option?
        if (node.data.trim() === ''
            && ((node.previousElementSibling && isBlockElement(node.previousElementSibling))
                 || (node.nextElementSibling && isBlockElement(node.nextElementSibling)))) {
          parentNode.removeChild(node);
          this._sanitize(document, parentNode);
          break;
        } else {
          continue;
        }
      }

      // Remove all comments
      if (node.nodeType === Node.COMMENT_NODE) {
        parentNode.removeChild(node);
        this._sanitize(document, parentNode);
        break;
      }

      const isInline = isInlineElement(node);
      let containsBlockElement;
      if (isInline) {
        containsBlockElement = Array.prototype.some.call(node.childNodes, isBlockElement);
      }

      // Block elements should not be nested (e.g. <li><p>...); if
      // they are, we want to unwrap the inner block element.
      const isNotTopContainer = !! parentNode.parentNode;
      const isNestedBlockElement =
            isBlockElement(parentNode) &&
            isBlockElement(node) &&
            isNotTopContainer;

      const nodeName = node.nodeName.toLowerCase();

      const allowedAttrs = getAllowedAttrs(this.config, nodeName, node);

      const isInvalid = isInline && containsBlockElement;

      // Drop tag entirely according to the whitelist *and* if the markup
      // is invalid.
      if (isInvalid || shouldRejectNode(node, allowedAttrs)
          || (!this.config.keepNestedBlockElements && isNestedBlockElement)) {
        // Do not keep the inner text of SCRIPT/STYLE elements.
        if (! (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE')) {
          while (node.childNodes.length > 0) {
            parentNode.insertBefore(node.childNodes[0], node);
          }
        }
        parentNode.removeChild(node);

        this._sanitize(document, parentNode);
        break;
      }

      // Sanitize attributes
      for (let a = 0; a < node.attributes.length; a += 1) {
        const attr = node.attributes[a];

        if (shouldRejectAttr(attr, allowedAttrs, node)) {
          node.removeAttribute(attr.name);
          // Shift the array to continue looping.
          a = a - 1;
        }
      }

      // Sanitize children
      this._sanitize(document, node);

    } while ((node = treeWalker.nextSibling()));
  }

}

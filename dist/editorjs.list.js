(function () {
  'use strict';

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray(arr);
  }

  function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  /**
   * @typedef {object} ListData
   * @property {string} style - can be ordered or unordered
   * @property {Array} items - li elements
   */

  /**
   * List Tool for the Editor.js 2.0
   */
  var List = /*#__PURE__*/function () {
    /**
     * Render plugin`s main Element and fill it with saved data
     *
     * @param {object} params - tool constructor options
     * @param {ListData} params.data - previously saved data
     * @param {object} params.config - user config for Tool
     * @param {object} params.api - Editor.js API
     * @param {boolean} params.readOnly - read-only mode flag
     */
    function List(_ref) {
      var data = _ref.data,
          config = _ref.config,
          api = _ref.api,
          readOnly = _ref.readOnly;

      _classCallCheck(this, List);

      /**
       * HTML nodes
       *
       * @private
       */
      this._elements = {
        wrapper: null
      };
      this.api = api;
      this.readOnly = readOnly;
      this.settings = [{
        name: 'unordered',
        title: this.api.i18n.t('Unordered'),
        icon: '<svg width="17" height="13" viewBox="0 0 17 13" xmlns="http://www.w3.org/2000/svg"> <path d="M5.625 4.85h9.25a1.125 1.125 0 0 1 0 2.25h-9.25a1.125 1.125 0 0 1 0-2.25zm0-4.85h9.25a1.125 1.125 0 0 1 0 2.25h-9.25a1.125 1.125 0 0 1 0-2.25zm0 9.85h9.25a1.125 1.125 0 0 1 0 2.25h-9.25a1.125 1.125 0 0 1 0-2.25zm-4.5-5a1.125 1.125 0 1 1 0 2.25 1.125 1.125 0 0 1 0-2.25zm0-4.85a1.125 1.125 0 1 1 0 2.25 1.125 1.125 0 0 1 0-2.25zm0 9.85a1.125 1.125 0 1 1 0 2.25 1.125 1.125 0 0 1 0-2.25z"/></svg>',
        default: false
      }, {
        name: 'ordered',
        title: this.api.i18n.t('Ordered'),
        icon: '<svg width="17" height="13" viewBox="0 0 17 13" xmlns="http://www.w3.org/2000/svg"><path d="M5.819 4.607h9.362a1.069 1.069 0 0 1 0 2.138H5.82a1.069 1.069 0 1 1 0-2.138zm0-4.607h9.362a1.069 1.069 0 0 1 0 2.138H5.82a1.069 1.069 0 1 1 0-2.138zm0 9.357h9.362a1.069 1.069 0 0 1 0 2.138H5.82a1.069 1.069 0 0 1 0-2.137zM1.468 4.155V1.33c-.554.404-.926.606-1.118.606a.338.338 0 0 1-.244-.104A.327.327 0 0 1 0 1.59c0-.107.035-.184.105-.234.07-.05.192-.114.369-.192.264-.118.475-.243.633-.373.158-.13.298-.276.42-.438a3.94 3.94 0 0 1 .238-.298C1.802.019 1.872 0 1.975 0c.115 0 .208.042.277.127.07.085.105.202.105.351v3.556c0 .416-.15.624-.448.624a.421.421 0 0 1-.32-.127c-.08-.085-.121-.21-.121-.376zm-.283 6.664h1.572c.156 0 .275.03.358.091a.294.294 0 0 1 .123.25.323.323 0 0 1-.098.238c-.065.065-.164.097-.296.097H.629a.494.494 0 0 1-.353-.119.372.372 0 0 1-.126-.28c0-.068.027-.16.081-.273a.977.977 0 0 1 .178-.268c.267-.264.507-.49.722-.678.215-.188.368-.312.46-.371.165-.11.302-.222.412-.334.109-.112.192-.226.25-.344a.786.786 0 0 0 .085-.345.6.6 0 0 0-.341-.553.75.75 0 0 0-.345-.08c-.263 0-.47.11-.62.329-.02.029-.054.107-.101.235a.966.966 0 0 1-.16.295c-.059.069-.145.103-.26.103a.348.348 0 0 1-.25-.094.34.34 0 0 1-.099-.258c0-.132.031-.27.093-.413.063-.143.155-.273.279-.39.123-.116.28-.21.47-.282.189-.072.411-.107.666-.107.307 0 .569.045.786.137a1.182 1.182 0 0 1 .618.623 1.18 1.18 0 0 1-.096 1.083 2.03 2.03 0 0 1-.378.457c-.128.11-.344.282-.646.517-.302.235-.509.417-.621.547a1.637 1.637 0 0 0-.148.187z"/></svg>',
        default: true
      }];
      /**
       * Tool's data
       *
       * @type {ListData}
       */

      this._data = {
        style: this.settings.find(function (tune) {
          return tune.default === true;
        }).name,
        items: []
      };
      this.data = data;
    }
    /**
     * Notify core that read-only mode is supported
     *
     * @returns {boolean}
     */


    _createClass(List, [{
      key: "render",

      /**
       * Returns list tag with items
       *
       * @returns {Element}
       * @public
       */
      value: function render() {
        var _this = this;

        this._elements.wrapper = this.makeMainTag(this._data.style); // fill with data

        if (this._data.items.length) {
          this._data.items.forEach(function (item) {
            _this._elements.wrapper.appendChild(_this._make('li', _this.CSS.item, {
              innerHTML: item
            }));
          });
        } else {
          this._elements.wrapper.appendChild(this._make('li', this.CSS.item));
        }

        if (!this.readOnly) {
          // detect keydown on the last item to escape List
          this._elements.wrapper.addEventListener('keydown', function (event) {
            var ENTER = 13,
                BACKSPACE = 8; // key codes

            switch (event.keyCode) {
              case ENTER:
                _this.getOutofList(event);

                break;

              case BACKSPACE:
                _this.backspace(event);

                break;
            }
          }, false);
        }

        return this._elements.wrapper;
      }
      /**
       * @returns {ListData}
       * @public
       */

    }, {
      key: "save",
      value: function save() {
        return this.data;
      }
      /**
       * Allow List Tool to be converted to/from other block
       *
       * @returns {{export: Function, import: Function}}
       */

    }, {
      key: "renderSettings",

      /**
       * Settings
       *
       * @public
       * @returns {Element}
       */
      value: function renderSettings() {
        var _this2 = this;

        var wrapper = this._make('div', [this.CSS.settingsWrapper], {});

        this.settings.forEach(function (item) {
          var itemEl = _this2._make('div', _this2.CSS.settingsButton, {
            innerHTML: item.icon
          });

          itemEl.addEventListener('click', function () {
            _this2.toggleTune(item.name); // clear other buttons


            var buttons = itemEl.parentNode.querySelectorAll('.' + _this2.CSS.settingsButton);
            Array.from(buttons).forEach(function (button) {
              return button.classList.remove(_this2.CSS.settingsButtonActive);
            }); // mark active

            itemEl.classList.toggle(_this2.CSS.settingsButtonActive);
          });

          _this2.api.tooltip.onHover(itemEl, item.title, {
            placement: 'top',
            hidingDelay: 500
          });

          if (_this2._data.style === item.name) {
            itemEl.classList.add(_this2.CSS.settingsButtonActive);
          }

          wrapper.appendChild(itemEl);
        });
        return wrapper;
      }
      /**
       * On paste callback that is fired from Editor
       *
       * @param {PasteEvent} event - event with pasted data
       */

    }, {
      key: "onPaste",
      value: function onPaste(event) {
        var list = event.detail.data;
        this.data = this.pasteHandler(list);
      }
      /**
       * List Tool on paste configuration
       *
       * @public
       */

    }, {
      key: "makeMainTag",

      /**
       * Creates main <ul> or <ol> tag depended on style
       *
       * @param {string} style - 'ordered' or 'unordered'
       * @returns {HTMLOListElement|HTMLUListElement}
       */
      value: function makeMainTag(style) {
        var styleClass = style === 'ordered' ? this.CSS.wrapperOrdered : this.CSS.wrapperUnordered;
        var tag = style === 'ordered' ? 'ol' : 'ul';
        return this._make(tag, [this.CSS.baseBlock, this.CSS.wrapper, styleClass], {
          contentEditable: !this.readOnly
        });
      }
      /**
       * Toggles List style
       *
       * @param {string} style - 'ordered'|'unordered'
       */

    }, {
      key: "toggleTune",
      value: function toggleTune(style) {
        var newTag = this.makeMainTag(style);

        while (this._elements.wrapper.hasChildNodes()) {
          newTag.appendChild(this._elements.wrapper.firstChild);
        }

        this._elements.wrapper.replaceWith(newTag);

        this._elements.wrapper = newTag;
        this._data.style = style;
      }
      /**
       * Styles
       *
       * @private
       */

    }, {
      key: "_make",

      /**
       * Helper for making Elements with attributes
       *
       * @param  {string} tagName           - new Element tag name
       * @param  {Array|string} classNames  - list or name of CSS classname(s)
       * @param  {object} attributes        - any attributes
       * @returns {Element}
       */
      value: function _make(tagName) {
        var classNames = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var attributes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        var el = document.createElement(tagName);

        if (Array.isArray(classNames)) {
          var _el$classList;

          (_el$classList = el.classList).add.apply(_el$classList, _toConsumableArray(classNames));
        } else if (classNames) {
          el.classList.add(classNames);
        }

        for (var attrName in attributes) {
          el[attrName] = attributes[attrName];
        }

        return el;
      }
      /**
       * Returns current List item by the caret position
       *
       * @returns {Element}
       */

    }, {
      key: "getOutofList",

      /**
       * Get out from List Tool
       * by Enter on the empty last item
       *
       * @param {KeyboardEvent} event
       */
      value: function getOutofList(event) {
        var items = this._elements.wrapper.querySelectorAll('.' + this.CSS.item);
        /**
         * Save the last one.
         */


        if (items.length < 2) {
          return;
        }

        var lastItem = items[items.length - 1];
        var currentItem = this.currentItem;
        /** Prevent Default li generation if item is empty */

        if (currentItem === lastItem && !lastItem.textContent.trim().length) {
          /** Insert New Block and set caret */
          currentItem.parentElement.removeChild(currentItem);
          this.api.blocks.insert(undefined, undefined, undefined, undefined, true);
          event.preventDefault();
          event.stopPropagation();
        }
      }
      /**
       * Handle backspace
       *
       * @param {KeyboardEvent} event
       */

    }, {
      key: "backspace",
      value: function backspace(event) {
        var items = this._elements.wrapper.querySelectorAll('.' + this.CSS.item),
            firstItem = items[0];

        if (!firstItem) {
          return;
        }
        /**
         * Save the last one.
         */


        if (items.length < 2 && !firstItem.innerHTML.replace('<br>', ' ').trim()) {
          event.preventDefault();
        }
      }
      /**
       * Select LI content by CMD+A
       *
       * @param {KeyboardEvent} event
       */

    }, {
      key: "selectItem",
      value: function selectItem(event) {
        event.preventDefault();
        var selection = window.getSelection(),
            currentNode = selection.anchorNode.parentNode,
            currentItem = currentNode.closest('.' + this.CSS.item),
            range = new Range();
        range.selectNodeContents(currentItem);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      /**
       * Handle UL, OL and LI tags paste and returns List data
       *
       * @param {HTMLUListElement|HTMLOListElement|HTMLLIElement} element
       * @returns {ListData}
       */

    }, {
      key: "pasteHandler",
      value: function pasteHandler(element) {
        var tag = element.tagName;
        var style;

        switch (tag) {
          case 'OL':
            style = 'ordered';
            break;

          case 'UL':
          case 'LI':
            style = 'unordered';
        }

        var data = {
          style: style,
          items: []
        };

        if (tag === 'LI') {
          data.items = [element.innerHTML];
        } else {
          var items = Array.from(element.querySelectorAll('LI'));
          data.items = items.map(function (li) {
            return li.innerHTML;
          }).filter(function (item) {
            return !!item.trim();
          });
        }

        return data;
      }
    }, {
      key: "CSS",
      get: function get() {
        return {
          baseBlock: this.api.styles.block,
          wrapper: 'cdx-list',
          wrapperOrdered: 'cdx-list--ordered',
          wrapperUnordered: 'cdx-list--unordered',
          item: 'cdx-list__item',
          settingsWrapper: 'cdx-list-settings',
          settingsButton: this.api.styles.settingsButton,
          settingsButtonActive: this.api.styles.settingsButtonActive
        };
      }
      /**
       * List data setter
       *
       * @param {ListData} listData
       */

    }, {
      key: "data",
      set: function set(listData) {
        if (!listData) {
          listData = {};
        }

        this._data.style = listData.style || this.settings.find(function (tune) {
          return tune.default === true;
        }).name;
        this._data.items = listData.items || [];
        var oldView = this._elements.wrapper;

        if (oldView) {
          oldView.parentNode.replaceChild(this.render(), oldView);
        }
      }
      /**
       * Return List data
       *
       * @returns {ListData}
       */
      ,
      get: function get() {
        this._data.items = [];

        var items = this._elements.wrapper.querySelectorAll(".".concat(this.CSS.item));

        for (var i = 0; i < items.length; i++) {
          var value = items[i].innerHTML.replace('<br>', ' ').trim();

          if (value) {
            this._data.items.push(items[i].innerHTML);
          }
        }

        return this._data;
      }
    }, {
      key: "currentItem",
      get: function get() {
        var currentNode = window.getSelection().anchorNode;

        if (currentNode.nodeType !== Node.ELEMENT_NODE) {
          currentNode = currentNode.parentNode;
        }

        return currentNode.closest(".".concat(this.CSS.item));
      }
    }], [{
      key: "isReadOnlySupported",
      get: function get() {
        return true;
      }
      /**
       * Allow to use native Enter behaviour
       *
       * @returns {boolean}
       * @public
       */

    }, {
      key: "enableLineBreaks",
      get: function get() {
        return true;
      }
      /**
       * Get Tool toolbox settings
       * icon - Tool icon's SVG
       * title - title to show in toolbox
       *
       * @returns {{icon: string, title: string}}
       */

    }, {
      key: "toolbox",
      get: function get() {
        return {
          icon: '<svg width="17" height="13" viewBox="0 0 17 13" xmlns="http://www.w3.org/2000/svg"> <path d="M5.625 4.85h9.25a1.125 1.125 0 0 1 0 2.25h-9.25a1.125 1.125 0 0 1 0-2.25zm0-4.85h9.25a1.125 1.125 0 0 1 0 2.25h-9.25a1.125 1.125 0 0 1 0-2.25zm0 9.85h9.25a1.125 1.125 0 0 1 0 2.25h-9.25a1.125 1.125 0 0 1 0-2.25zm-4.5-5a1.125 1.125 0 1 1 0 2.25 1.125 1.125 0 0 1 0-2.25zm0-4.85a1.125 1.125 0 1 1 0 2.25 1.125 1.125 0 0 1 0-2.25zm0 9.85a1.125 1.125 0 1 1 0 2.25 1.125 1.125 0 0 1 0-2.25z"/></svg>',
          title: 'List'
        };
      }
    }, {
      key: "conversionConfig",
      get: function get() {
        return {
          /**
           * To create exported string from list, concatenate items by dot-symbol.
           *
           * @param {ListData} data - list data to create a string from thats
           * @returns {string}
           */
          export: function _export(data) {
            return data.items.join('. ');
          },

          /**
           * To create a list from other block's string, just put it at the first item
           *
           * @param {string} string - string to create list tool data from that
           * @returns {ListData}
           */
          import: function _import(string) {
            return {
              items: [string],
              style: 'unordered'
            };
          }
        };
      }
      /**
       * Sanitizer rules
       *
       * @returns {object}
       */

    }, {
      key: "sanitize",
      get: function get() {
        return {
          style: {},
          items: {
            br: true
          }
        };
      }
    }, {
      key: "pasteConfig",
      get: function get() {
        return {
          tags: ['OL', 'UL', 'LI']
        };
      }
    }]);

    return List;
  }();

  List.displayName = "List";
  List.displayName = 'List';
  window.List = List;

}());

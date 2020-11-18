(function () {
  'use strict';

  var ParagraphSvgIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0.2 -0.3 9 11.4\" width=\"12\" height=\"14\">\r\n  <path d=\"M0 2.77V.92A1 1 0 01.2.28C.35.1.56 0 .83 0h7.66c.28.01.48.1.63.28.14.17.21.38.21.64v1.85c0 .26-.08.48-.23.66-.15.17-.37.26-.66.26-.28 0-.5-.09-.64-.26a1 1 0 01-.21-.66V1.69H5.6v7.58h.5c.25 0 .45.08.6.23.17.16.25.35.25.6s-.08.45-.24.6a.87.87 0 01-.62.22H3.21a.87.87 0 01-.61-.22.78.78 0 01-.24-.6c0-.25.08-.44.24-.6a.85.85 0 01.61-.23h.5V1.7H1.73v1.08c0 .26-.08.48-.23.66-.15.17-.37.26-.66.26-.28 0-.5-.09-.64-.26A1 1 0 010 2.77z\"/>\r\n</svg>\r\n";

  class Paragraph {
      /**
       * Render plugin`s main Element and fill it with saved data
       *
       * @param {object} params - constructor params
       * @param {ParagraphData} params.data - previously saved data
       * @param {ParagraphConfig} params.config - user config for Tool
       * @param {object} params.api - editor.js api
       * @param {boolean} readOnly - read only mode flag
       */
      constructor({ data, config, api, readOnly }) {
          this.api = api;
          this.readOnly = readOnly;
          /**
           * Styles
           *
           * @type {object}
           */
          this._CSS = {
              block: this.api.styles.block,
              settingsButton: this.api.styles.settingsButton,
              settingsButtonActive: this.api.styles.settingsButtonActive,
              wrapper: 'ce-paragraph'
          };
          /**
           * Tool's settings passed from Editor
           *
           * @type {ParagraphConfig}
           * @private
           */
          this._settings = config;
          /**
           * Block's data
           *
           * @type {ParagraphData}
           * @private
           */
          this._data = this.normalizeData(data);
          /**
           * List of settings buttons
           *
           * @type {HTMLElement[]}
           */
          this.settingsButtons = [];
          /**
           * Main Block wrapper
           *
           * @type {HTMLElement}
           * @private
           */
          this._element = this.getTag();
          if (!this.readOnly) {
              this.onKeyUp = this.onKeyUp.bind(this);
          }
          /**
           * Placeholder for paragraph if it is first Block
           * @type {string}
           */
          this._placeholder = config.placeholder ? config.placeholder : Paragraph.DEFAULT_PLACEHOLDER;
          this._preserveBlank = config.preserveBlank !== undefined ? config.preserveBlank : false;
          this.data = data;
      }
      /**
       * Default placeholder for Paragraph Tool
       *
       * @return {string}
       * @constructor
       */
      static get DEFAULT_PLACEHOLDER() {
          return '';
      }
      /**
       * Normalize input data
       *
       * @param {HeaderData} data - saved data to process
       *
       * @returns {HeaderData}
       * @private
       */
      normalizeData(data) {
          const newData = {};
          if (typeof data !== 'object') {
              data = {};
          }
          newData.text = data.text || '';
          newData.level = parseInt(data.level, 10) || this.defaultLevel.number;
          return newData;
      }
      /**
       * Return Tool's view
       *
       * @returns {HTMLDivElement}
       */
      render() {
          return this._element;
      }
      renderSettings() {
          const holder = document.createElement('DIV');
          // do not add settings button, when only one level is configured
          if (this.levels.length <= 1) {
              return holder;
          }
          /** Add type selectors */
          this.levels.forEach(level => {
              const selectTypeButton = document.createElement('SPAN');
              selectTypeButton.classList.add(this._CSS.settingsButton);
              /**
               * Highlight current level button
               */
              if (this.currentLevel.number === level.number) {
                  selectTypeButton.classList.add(this._CSS.settingsButtonActive);
              }
              /**
               * Add SVG icon
               */
              selectTypeButton.innerHTML = level.svg;
              /**
               * Save level to its button
               */
              selectTypeButton.dataset.level = level.number.toString();
              /**
               * Set up click handler
               */
              selectTypeButton.addEventListener('click', () => {
                  this.setLevel(level.number);
              });
              /**
               * Append settings button to holder
               */
              holder.appendChild(selectTypeButton);
              /**
               * Save settings buttons
               */
              this.settingsButtons.push(selectTypeButton);
          });
          return holder;
      }
      /**
       * Callback for Block's settings buttons
       *
       * @param {number} level - level to set
       */
      setLevel(level) {
          this.data = {
              level,
              text: this.data.text,
          };
          /**
           * Highlight button by selected level
           */
          this.settingsButtons.forEach(button => {
              button.classList.toggle(this._CSS.settingsButtonActive, parseInt(button.dataset.level, 10) === level);
          });
      }
      /**
       * Method that specified how to merge two Text blocks.
       * Called by Editor.js by backspace at the beginning of the Block
       * @param {ParagraphData} data
       * @public
       */
      merge(data) {
          const newData = {
              text: this.data.text + data.text,
              level: this.data.level
          };
          this.data = newData;
      }
      /**
       * Validate Paragraph block data:
       * - check for emptiness
       *
       * @param {ParagraphData} savedData — data received after saving
       * @returns {boolean} false if saved data is not correct, otherwise true
       * @public
       */
      validate(savedData) {
          if (savedData.text.trim() === '' && !this._preserveBlank) {
              return false;
          }
          return true;
      }
      /**
       * Extract Tool's data from the view
       * @param {HTMLParagraphElement} toolsContent - Paragraph tools rendered view
       * @returns {ParagraphData} - saved data
       * @public
       */
      save(toolsContent) {
          return {
              text: toolsContent.innerHTML,
              level: this.currentLevel.number
          };
      }
      /**
       * Enable Conversion Toolbar. Paragraph can be converted to/from other tools
       */
      static get conversionConfig() {
          return {
              export: 'text',
              import: 'text' // to covert other block's exported string to Paragraph, fill 'text' property of tool data
          };
      }
      /**
       * Sanitizer rules
       */
      static get sanitize() {
          return {
              level: false,
              text: {
                  br: true,
              }
          };
      }
      /**
       * Returns true to notify core that read-only is supported
       *
       * @returns {boolean}
       */
      static get isReadOnlySupported() {
          return true;
      }
      /**
       * Get current Tools`s data
       * @returns {ParagraphData} Current data
       * @private
       */
      get data() {
          this._data.text = this._element.innerHTML;
          this._data.level = this.currentLevel.number;
          return this._data;
      }
      /**
       * Store data in plugin:
       * - at the this._data property
       * - at the HTML
       *
       * @param {ParagraphData} data — data to set
       * @private
       */
      set data(data) {
          this._data = this.normalizeData(data);
          /**
           * If level is set and block in DOM
           * then replace it to a new block
           */
          if (data.level !== undefined && this._element.parentNode) {
              /**
               * Create a new tag
               *
               * @type {HTMLParagraphElement}
               */
              const newParagraph = this.getTag();
              /**
               * Save Block's content
               */
              newParagraph.innerHTML = this._element.innerHTML;
              /**
               * Replace blocks
               */
              this._element.parentNode.replaceChild(newParagraph, this._element);
              /**
               * Save new block to private variable
               *
               * @type {HTMLHeadingElement}
               * @private
               */
              this._element = newParagraph;
          }
          /**
           * If data.text was passed then update block's content
           */
          if (data.text !== undefined) {
              this._element.innerHTML = this._data.text || '';
          }
      }
      /**
       * Get tag for target level
       * By default returns second-leveled
       *
       * @return {HTMLElement}
       * @private
       */
      getTag() {
          /**
           * Create element for current Block's level
           */
          const tag = document.createElement(this.currentLevel.tag);
          /**
           * Add text to block
           */
          tag.innerHTML = this._data.text || '';
          /**
           * Add class to block
           */
          tag.classList.add(this.currentLevel.className);
          /**
           * Add data-level attribute to block
           */
          tag.dataset.level = this.currentLevel.number.toString();
          /**
           * Make tag editable or not
           */
          if (!this.readOnly) {
              tag.contentEditable = 'true';
              tag.addEventListener('keyup', this.onKeyUp);
          }
          else {
              tag.contentEditable = 'false';
          }
          return tag;
      }
      /**
       * Get current level
       *
       * @returns {level}
       */
      get currentLevel() {
          let level = this.levels.find(levelItem => levelItem.number === this._data.level);
          if (!level) {
              level = this.defaultLevel;
          }
          return level;
      }
      /**
       * Return default level
       *
       * @returns {level}
       */
      get defaultLevel() {
          /**
           * User can specify own default level value
           */
          if (this._settings.defaultLevel) {
              const userSpecified = this.levels.find(levelItem => {
                  return levelItem.number === this._settings.defaultLevel;
              });
              if (userSpecified) {
                  return userSpecified;
              }
              else {
                  console.warn('(ง\'̀-\'́)ง Paragraph Tool: the default level specified was not found in available levels');
              }
          }
          /**
           * With no additional options, there will be paragraph - level 2 by default
           *
           * @type {level}
           */
          return this.levels[1];
      }
      /**
       * Available header levels
       *
       * @returns {level[]}
       */
      get levels() {
          const availableLevels = [
              {
                  number: 1,
                  tag: 'P',
                  className: 'Eica-text-1',
                  svg: '<svg width="16" height="14" xmlns="http://www.w3.org/2000/svg"><path d="M2.14 1.494V4.98h4.62V1.494c0-.498.098-.871.293-1.12A.927.927 0 0 1 7.82 0c.322 0 .583.123.782.37.2.246.3.62.3 1.124v9.588c0 .503-.101.88-.303 1.128a.957.957 0 0 1-.779.374.921.921 0 0 1-.77-.378c-.193-.251-.29-.626-.29-1.124V6.989H2.14v4.093c0 .503-.1.88-.302 1.128a.957.957 0 0 1-.778.374.921.921 0 0 1-.772-.378C.096 11.955 0 11.58 0 11.082V1.494C0 .996.095.623.285.374A.922.922 0 0 1 1.06 0c.321 0 .582.123.782.37.199.246.299.62.299 1.124zm11.653 9.985V5.27c-1.279.887-2.14 1.33-2.583 1.33a.802.802 0 0 1-.563-.228.703.703 0 0 1-.245-.529c0-.232.08-.402.241-.511.161-.11.446-.25.854-.424.61-.259 1.096-.532 1.462-.818a5.84 5.84 0 0 0 .97-.962c.282-.355.466-.573.552-.655.085-.082.246-.123.483-.123.267 0 .481.093.642.28.161.186.242.443.242.77v7.813c0 .914-.345 1.371-1.035 1.371-.307 0-.554-.093-.74-.28-.187-.186-.28-.461-.28-.825z"/></svg>',
              },
              {
                  number: 2,
                  tag: 'P',
                  className: 'Eica-text-2',
                  svg: '<svg width="18" height="14" xmlns="http://www.w3.org/2000/svg"><path d="M2.152 1.494V4.98h4.646V1.494c0-.498.097-.871.293-1.12A.934.934 0 0 1 7.863 0c.324 0 .586.123.786.37.2.246.301.62.301 1.124v9.588c0 .503-.101.88-.304 1.128a.964.964 0 0 1-.783.374.928.928 0 0 1-.775-.378c-.194-.251-.29-.626-.29-1.124V6.989H2.152v4.093c0 .503-.101.88-.304 1.128a.964.964 0 0 1-.783.374.928.928 0 0 1-.775-.378C.097 11.955 0 11.58 0 11.082V1.494C0 .996.095.623.286.374A.929.929 0 0 1 1.066 0c.323 0 .585.123.786.37.2.246.3.62.3 1.124zm10.99 9.288h3.527c.351 0 .62.072.804.216.185.144.277.34.277.588 0 .22-.073.408-.22.56-.146.154-.368.23-.665.23h-4.972c-.338 0-.601-.093-.79-.28a.896.896 0 0 1-.284-.659c0-.162.06-.377.182-.645s.255-.478.399-.631a38.617 38.617 0 0 1 1.621-1.598c.482-.444.827-.735 1.034-.875.369-.261.676-.523.922-.787.245-.263.432-.534.56-.81.129-.278.193-.549.193-.815 0-.288-.069-.546-.206-.773a1.428 1.428 0 0 0-.56-.53 1.618 1.618 0 0 0-.774-.19c-.59 0-1.054.26-1.392.777-.045.068-.12.252-.226.554-.106.302-.225.534-.358.696-.133.162-.328.243-.585.243a.76.76 0 0 1-.56-.223c-.149-.148-.223-.351-.223-.608 0-.31.07-.635.21-.972.139-.338.347-.645.624-.92a3.093 3.093 0 0 1 1.054-.665c.426-.169.924-.253 1.496-.253.69 0 1.277.108 1.764.324.315.144.592.343.83.595.24.252.425.544.558.875.133.33.2.674.2 1.03 0 .558-.14 1.066-.416 1.523-.277.457-.56.815-.848 1.074-.288.26-.771.666-1.45 1.22-.677.554-1.142.984-1.394 1.29a3.836 3.836 0 0 0-.331.44z"/></svg>',
              },
              {
                  number: 3,
                  tag: 'P',
                  className: 'Eica-text-3',
                  svg: '<svg width="18" height="14" xmlns="http://www.w3.org/2000/svg"><path d="M2.152 1.494V4.98h4.646V1.494c0-.498.097-.871.293-1.12A.934.934 0 0 1 7.863 0c.324 0 .586.123.786.37.2.246.301.62.301 1.124v9.588c0 .503-.101.88-.304 1.128a.964.964 0 0 1-.783.374.928.928 0 0 1-.775-.378c-.194-.251-.29-.626-.29-1.124V6.989H2.152v4.093c0 .503-.101.88-.304 1.128a.964.964 0 0 1-.783.374.928.928 0 0 1-.775-.378C.097 11.955 0 11.58 0 11.082V1.494C0 .996.095.623.286.374A.929.929 0 0 1 1.066 0c.323 0 .585.123.786.37.2.246.3.62.3 1.124zm11.61 4.919c.418 0 .778-.123 1.08-.368.301-.245.452-.597.452-1.055 0-.35-.12-.65-.36-.902-.241-.252-.566-.378-.974-.378-.277 0-.505.038-.684.116a1.1 1.1 0 0 0-.426.306 2.31 2.31 0 0 0-.296.49c-.093.2-.178.388-.255.565a.479.479 0 0 1-.245.225.965.965 0 0 1-.409.081.706.706 0 0 1-.5-.22c-.152-.148-.228-.345-.228-.59 0-.236.071-.484.214-.745a2.72 2.72 0 0 1 .627-.746 3.149 3.149 0 0 1 1.024-.568 4.122 4.122 0 0 1 1.368-.214c.44 0 .842.06 1.205.18.364.12.679.294.947.52.267.228.47.49.606.79.136.3.204.622.204.967 0 .454-.099.843-.296 1.168-.198.324-.48.64-.848.95.354.19.653.408.895.653.243.245.426.516.548.813.123.298.184.619.184.964 0 .413-.083.812-.248 1.198-.166.386-.41.73-.732 1.031a3.49 3.49 0 0 1-1.147.708c-.443.17-.932.256-1.467.256a3.512 3.512 0 0 1-1.464-.293 3.332 3.332 0 0 1-1.699-1.64c-.142-.314-.214-.573-.214-.777 0-.263.085-.475.255-.636a.89.89 0 0 1 .637-.242c.127 0 .25.037.367.112a.53.53 0 0 1 .232.27c.236.63.489 1.099.759 1.405.27.306.65.46 1.14.46a1.714 1.714 0 0 0 1.46-.824c.17-.273.256-.588.256-.947 0-.53-.145-.947-.436-1.249-.29-.302-.694-.453-1.212-.453-.09 0-.231.01-.422.028-.19.018-.313.027-.367.027-.25 0-.443-.062-.579-.187-.136-.125-.204-.299-.204-.521 0-.218.081-.394.245-.528.163-.134.406-.2.728-.2h.28z"/></svg>',
              },
              {
                  number: 4,
                  tag: 'P',
                  className: 'Eica-text-4',
                  svg: '<svg width="20" height="14" xmlns="http://www.w3.org/2000/svg"><path d="M2.152 1.494V4.98h4.646V1.494c0-.498.097-.871.293-1.12A.934.934 0 0 1 7.863 0c.324 0 .586.123.786.37.2.246.301.62.301 1.124v9.588c0 .503-.101.88-.304 1.128a.964.964 0 0 1-.783.374.928.928 0 0 1-.775-.378c-.194-.251-.29-.626-.29-1.124V6.989H2.152v4.093c0 .503-.101.88-.304 1.128a.964.964 0 0 1-.783.374.928.928 0 0 1-.775-.378C.097 11.955 0 11.58 0 11.082V1.494C0 .996.095.623.286.374A.929.929 0 0 1 1.066 0c.323 0 .585.123.786.37.2.246.3.62.3 1.124zm13.003 10.09v-1.252h-3.38c-.427 0-.746-.097-.96-.29-.213-.193-.32-.456-.32-.788 0-.085.016-.171.048-.259.031-.088.078-.18.141-.276.063-.097.128-.19.195-.28.068-.09.15-.2.25-.33l3.568-4.774a5.44 5.44 0 0 1 .576-.683.763.763 0 0 1 .542-.212c.682 0 1.023.39 1.023 1.171v5.212h.29c.346 0 .623.047.832.142.208.094.313.3.313.62 0 .26-.086.45-.256.568-.17.12-.427.179-.768.179h-.41v1.252c0 .346-.077.603-.23.771-.152.168-.356.253-.612.253a.78.78 0 0 1-.61-.26c-.154-.173-.232-.427-.232-.764zm-2.895-2.76h2.895V4.91L12.26 8.823z"/></svg>',
              },
              {
                  number: 5,
                  tag: 'P',
                  className: 'Eica-text-5',
                  svg: '<svg width="18" height="14" xmlns="http://www.w3.org/2000/svg"><path d="M2.152 1.494V4.98h4.646V1.494c0-.498.097-.871.293-1.12A.934.934 0 0 1 7.863 0c.324 0 .586.123.786.37.2.246.301.62.301 1.124v9.588c0 .503-.101.88-.304 1.128a.964.964 0 0 1-.783.374.928.928 0 0 1-.775-.378c-.194-.251-.29-.626-.29-1.124V6.989H2.152v4.093c0 .503-.101.88-.304 1.128a.964.964 0 0 1-.783.374.928.928 0 0 1-.775-.378C.097 11.955 0 11.58 0 11.082V1.494C0 .996.095.623.286.374A.929.929 0 0 1 1.066 0c.323 0 .585.123.786.37.2.246.3.62.3 1.124zm14.16 2.645h-3.234l-.388 2.205c.644-.344 1.239-.517 1.783-.517.436 0 .843.082 1.222.245.38.164.712.39.998.677.286.289.51.63.674 1.025.163.395.245.82.245 1.273 0 .658-.148 1.257-.443 1.797-.295.54-.72.97-1.276 1.287-.556.318-1.197.477-1.923.477-.813 0-1.472-.15-1.978-.45-.506-.3-.865-.643-1.076-1.031-.21-.388-.316-.727-.316-1.018 0-.177.073-.345.22-.504a.725.725 0 0 1 .556-.238c.381 0 .665.22.85.66.182.404.427.719.736.943.309.225.654.337 1.035.337.35 0 .656-.09.919-.272.263-.182.466-.431.61-.749.142-.318.214-.678.214-1.082 0-.436-.078-.808-.232-1.117a1.607 1.607 0 0 0-.62-.69 1.674 1.674 0 0 0-.864-.229c-.39 0-.67.048-.837.143-.168.095-.41.262-.725.5-.316.239-.576.358-.78.358a.843.843 0 0 1-.592-.242c-.173-.16-.259-.344-.259-.548 0-.022.025-.177.075-.463l.572-3.26c.063-.39.181-.675.354-.852.172-.177.454-.265.844-.265h3.595c.708 0 1.062.27 1.062.81a.711.711 0 0 1-.26.572c-.172.145-.426.218-.762.218z"/></svg>',
              },
              {
                  number: 6,
                  tag: 'P',
                  className: 'Eica-text-6',
                  svg: '<svg width="18" height="14" xmlns="http://www.w3.org/2000/svg"><path d="M2.152 1.494V4.98h4.646V1.494c0-.498.097-.871.293-1.12A.934.934 0 0 1 7.863 0c.324 0 .586.123.786.37.2.246.301.62.301 1.124v9.588c0 .503-.101.88-.304 1.128a.964.964 0 0 1-.783.374.928.928 0 0 1-.775-.378c-.194-.251-.29-.626-.29-1.124V6.989H2.152v4.093c0 .503-.101.88-.304 1.128a.964.964 0 0 1-.783.374.928.928 0 0 1-.775-.378C.097 11.955 0 11.58 0 11.082V1.494C0 .996.095.623.286.374A.929.929 0 0 1 1.066 0c.323 0 .585.123.786.37.2.246.3.62.3 1.124zM12.53 7.058a3.093 3.093 0 0 1 1.004-.814 2.734 2.734 0 0 1 1.214-.264c.43 0 .827.08 1.19.24.365.161.684.39.957.686.274.296.485.645.635 1.048a3.6 3.6 0 0 1 .223 1.262c0 .637-.145 1.216-.437 1.736-.292.52-.699.926-1.221 1.218-.522.292-1.114.438-1.774.438-.76 0-1.416-.186-1.967-.557-.552-.37-.974-.919-1.265-1.645-.292-.726-.438-1.613-.438-2.662 0-.855.088-1.62.265-2.293.176-.674.43-1.233.76-1.676.33-.443.73-.778 1.2-1.004.47-.226 1.006-.339 1.608-.339.579 0 1.089.113 1.53.34.44.225.773.506.997.84.224.335.335.656.335.964 0 .185-.07.354-.21.505a.698.698 0 0 1-.536.227.874.874 0 0 1-.529-.18 1.039 1.039 0 0 1-.36-.498 1.42 1.42 0 0 0-.495-.655 1.3 1.3 0 0 0-.786-.247c-.24 0-.479.069-.716.207a1.863 1.863 0 0 0-.6.56c-.33.479-.525 1.333-.584 2.563zm1.832 4.213c.456 0 .834-.186 1.133-.56.298-.373.447-.862.447-1.468 0-.412-.07-.766-.21-1.062a1.584 1.584 0 0 0-.577-.678 1.47 1.47 0 0 0-.807-.234c-.28 0-.548.074-.804.224-.255.149-.461.365-.617.647a2.024 2.024 0 0 0-.234.994c0 .61.158 1.12.475 1.527.316.407.714.61 1.194.61z"/></svg>',
              },
          ];
          return this._settings.levels ? availableLevels.filter(l => this._settings.levels.includes(l.number)) : availableLevels;
      }
      /**
       * On paste callback fired from Editor.
       *
       * @param {PasteEvent} event - event with pasted data
       */
      onPaste(event) {
          const content = event.detail.data;
          /**
           * Define default level value
           *
           * @type {number}
           */
          let level = this.defaultLevel.number;
          // get data-level attribute
          if (content.dataset.level && (parseInt(content.dataset.level, 10) < 7 && parseInt(content.dataset.level, 10) > 0)) {
              level = parseInt(content.dataset.level, 10);
          }
          if (this._settings.levels) {
              // Fallback to nearest level when specified not available
              level = this._settings.levels.reduce((prevLevel, currLevel) => {
                  return Math.abs(currLevel - level) < Math.abs(prevLevel - level) ? currLevel : prevLevel;
              });
          }
          this.data = {
              level,
              text: event.detail.data.innerHTML
          };
      }
      /**
       * Used by Editor paste handling API.
       * Provides configuration to handle P tags.
       *
       * @returns {{tags: string[]}}
       */
      static get pasteConfig() {
          return {
              tags: ['P']
          };
      }
      /**
       * Check if text content is empty and set empty string to inner html.
       * We need this because some browsers (e.g. Safari) insert <br> into empty contenteditanle elements
       *
       * @param {KeyboardEvent} e - key up event
       */
      onKeyUp(e) {
          if (e.code !== 'Backspace' && e.code !== 'Delete') {
              return;
          }
          const { textContent } = this._element;
          if (textContent === '') {
              this._element.innerHTML = '';
          }
      }
      /**
       * Icon and title for displaying at the Toolbox
       *
       * @return {{icon: string, title: string}}
       */
      static get toolbox() {
          return {
              icon: ParagraphSvgIcon,
              title: 'Paragraph'
          };
      }
  }
  Paragraph.displayName = 'Paragraph';

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation.

  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */

  function __awaiter(thisArg, _arguments, P, generator) {
      function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
      return new (P || (P = Promise))(function (resolve, reject) {
          function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
          function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
          function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
  }

  /**
   * Class Util
   */
  /**
   * Possible log levels
   */
  var LogLevels;
  (function (LogLevels) {
      LogLevels["VERBOSE"] = "VERBOSE";
      LogLevels["INFO"] = "INFO";
      LogLevels["WARN"] = "WARN";
      LogLevels["ERROR"] = "ERROR";
  })(LogLevels || (LogLevels = {}));
  /**
   * Editor.js utils
   */
  /**
   * Returns basic keycodes as constants
   *
   * @returns {{}}
   */
  const keyCodes = {
      BACKSPACE: 8,
      TAB: 9,
      ENTER: 13,
      SHIFT: 16,
      CTRL: 17,
      ALT: 18,
      ESC: 27,
      SPACE: 32,
      LEFT: 37,
      UP: 38,
      DOWN: 40,
      RIGHT: 39,
      DELETE: 46,
      META: 91,
  };
  /**
   * Return mouse buttons codes
   */
  const mouseButtons = {
      LEFT: 0,
      WHEEL: 1,
      RIGHT: 2,
      BACKWARD: 3,
      FORWARD: 4,
  };
  /**
   * Custom logger
   *
   * @param {boolean} labeled — if true, Editor.js label is shown
   * @param {string} msg  - message
   * @param {string} type - logging type 'log'|'warn'|'error'|'info'
   * @param {*} [args]      - argument to log with a message
   * @param {string} style  - additional styling to message
   */
  function _log(labeled, msg, type = 'log', 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args, style = 'color: inherit') {
      if (!('console' in window) || !window.console[type]) {
          return;
      }
      const isSimpleType = ['info', 'log', 'warn', 'error'].includes(type);
      const argsToPass = [];
      switch (_log.logLevel) {
          case LogLevels.ERROR:
              if (type !== 'error') {
                  return;
              }
              break;
          case LogLevels.WARN:
              if (!['error', 'warn'].includes(type)) {
                  return;
              }
              break;
          case LogLevels.INFO:
              if (!isSimpleType || labeled) {
                  return;
              }
              break;
      }
      if (args) {
          argsToPass.push(args);
      }
      const editorLabelText = 'Editor.js 2.19.1';
      const editorLabelStyle = `line-height: 1em;
            color: #006FEA;
            display: inline-block;
            font-size: 11px;
            line-height: 1em;
            background-color: #fff;
            padding: 4px 9px;
            border-radius: 30px;
            border: 1px solid rgba(56, 138, 229, 0.16);
            margin: 4px 5px 4px 0;`;
      if (labeled) {
          if (isSimpleType) {
              argsToPass.unshift(editorLabelStyle, style);
              msg = `%c${editorLabelText}%c ${msg}`;
          }
          else {
              msg = `( ${editorLabelText} )${msg}`;
          }
      }
      try {
          if (!isSimpleType) {
              console[type](msg);
          }
          else if (args) {
              console[type](`${msg} %o`, ...argsToPass);
          }
          else {
              console[type](msg, ...argsToPass);
          }
      }
      catch (ignored) { }
  }
  /**
   * Current log level
   */
  _log.logLevel = LogLevels.VERBOSE;
  /**
   * Set current log level
   *
   * @param {LogLevels} logLevel - log level to set
   */
  function setLogLevel(logLevel) {
      _log.logLevel = logLevel;
  }
  /**
   * _log method proxy without Editor.js label
   */
  const log = _log.bind(window, false);
  /**
   * _log method proxy with Editor.js label
   */
  const logLabeled = _log.bind(window, true);
  /**
   * Returns true if passed key code is printable (a-Z, 0-9, etc) character.
   *
   * @param {number} keyCode - key code
   *
   * @returns {boolean}
   */
  function isPrintableKey(keyCode) {
      return (keyCode > 47 && keyCode < 58) || // number keys
          keyCode === 32 || keyCode === 13 || // Spacebar & return key(s)
          keyCode === 229 || // processing key input for certain languages — Chinese, Japanese, etc.
          (keyCode > 64 && keyCode < 91) || // letter keys
          (keyCode > 95 && keyCode < 112) || // Numpad keys
          (keyCode > 185 && keyCode < 193) || // ;=,-./` (in order)
          (keyCode > 218 && keyCode < 223); // [\]' (in order)
  }
  /**
   * Fires a promise sequence asynchronously
   *
   * @param {ChainData[]} chains - list or ChainData's
   * @param {Function} success - success callback
   * @param {Function} fallback - callback that fires in case of errors
   *
   * @returns {Promise}
   */
  function sequence(chains, 
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  success = () => { }, 
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  fallback = () => { }) {
      return __awaiter(this, void 0, void 0, function* () {
          /**
           * Decorator
           *
           * @param {ChainData} chainData - Chain data
           *
           * @param {Function} successCallback - success callback
           * @param {Function} fallbackCallback - fail callback
           *
           * @returns {Promise}
           */
          function waitNextBlock(chainData, successCallback, fallbackCallback) {
              return __awaiter(this, void 0, void 0, function* () {
                  try {
                      yield chainData.function(chainData.data);
                      yield successCallback(typeof chainData.data !== 'undefined' ? chainData.data : {});
                  }
                  catch (e) {
                      fallbackCallback(typeof chainData.data !== 'undefined' ? chainData.data : {});
                  }
              });
          }
          /**
           * pluck each element from queue
           * First, send resolved Promise as previous value
           * Each plugins "prepare" method returns a Promise, that's why
           * reduce current element will not be able to continue while can't get
           * a resolved Promise
           */
          return chains.reduce((previousValue, currentValue) => __awaiter(this, void 0, void 0, function* () {
              yield previousValue;
              return waitNextBlock(currentValue, success, fallback);
          }), Promise.resolve());
      });
  }
  /**
   * Make array from array-like collection
   *
   * @param {ArrayLike} collection - collection to convert to array
   *
   * @returns {Array}
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function array(collection) {
      return Array.prototype.slice.call(collection);
  }
  /**
   * Check if passed variable is a function
   *
   * @param {*} fn - function to check
   *
   * @returns {boolean}
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function isFunction(fn) {
      return typeof fn === 'function';
  }
  /**
   * Checks if object is empty
   *
   * @param {object} object - object to check
   *
   * @returns {boolean}
   */
  function isEmpty(object) {
      if (!object) {
          return true;
      }
      return Object.keys(object).length === 0 && object.constructor === Object;
  }
  /**
   * Delays method execution
   *
   * @param {Function} method - method to execute
   * @param {number} timeout - timeout in ms
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function delay(method, timeout) {
      return function () {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const context = this, 
          // eslint-disable-next-line prefer-rest-params
          args = arguments;
          window.setTimeout(() => method.apply(context, args), timeout);
      };
  }
  /**
   * Get file extension
   *
   * @param {File} file - file
   *
   * @returns {string}
   */
  function getFileExtension(file) {
      return file.name.split('.').pop();
  }
  /**
   * Check if string is MIME type
   *
   * @param {string} type - string to check
   *
   * @returns {boolean}
   */
  function isValidMimeType(type) {
      return /^[-\w]+\/([-+\w]+|\*)$/.test(type);
  }
  /**
   * Debouncing method
   * Call method after passed time
   *
   * Note that this method returns Function and declared variable need to be called
   *
   * @param {Function} func - function that we're throttling
   * @param {number} wait - time in milliseconds
   * @param {boolean} immediate - call now
   * @returns {Function}
   */
  function debounce(func, wait, immediate) {
      let timeout;
      return () => {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const context = this, 
          // eslint-disable-next-line prefer-rest-params
          args = arguments;
          // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
          const later = () => {
              timeout = null;
              if (!immediate) {
                  func.apply(context, args);
              }
          };
          const callNow = immediate && !timeout;
          window.clearTimeout(timeout);
          timeout = window.setTimeout(later, wait);
          if (callNow) {
              func.apply(context, args);
          }
      };
  }
  /**
   * Returns object with os name as key and boolean as value. Shows current user OS
   */
  function getUserOS() {
      const OS = {
          win: false,
          mac: false,
          x11: false,
          linux: false,
      };
      const userOS = Object.keys(OS).find((os) => navigator.appVersion.toLowerCase().indexOf(os) !== -1);
      if (userOS) {
          OS[userOS] = true;
          return OS;
      }
      return OS;
  }
  /**
   * Capitalizes first letter of the string
   *
   * @param {string} text - text to capitalize
   *
   * @returns {string}
   */
  function capitalize(text) {
      return text[0].toUpperCase() + text.slice(1);
  }
  /**
   * Return string representation of the object type
   *
   * @param {*} object - object to get type
   *
   * @returns {string}
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function typeOf(object) {
      return Object.prototype.toString.call(object).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
  }
  /**
   * Merge to objects recursively
   *
   * @param {object} target - merge target
   * @param {object[]} sources - merge sources
   * @returns {object}
   */
  function deepMerge(target, ...sources) {
      const isObject = (item) => item && typeOf(item) === 'object';
      if (!sources.length) {
          return target;
      }
      const source = sources.shift();
      if (isObject(target) && isObject(source)) {
          for (const key in source) {
              if (isObject(source[key])) {
                  if (!target[key]) {
                      Object.assign(target, { [key]: {} });
                  }
                  deepMerge(target[key], source[key]);
              }
              else {
                  Object.assign(target, { [key]: source[key] });
              }
          }
      }
      return deepMerge(target, ...sources);
  }
  /**
   * Make shortcut command more human-readable
   *
   * @param {string} shortcut — string like 'CMD+B'
   */
  function beautifyShortcut(shortcut) {
      const OS = getUserOS();
      shortcut = shortcut
          .replace(/shift/gi, '⇧')
          .replace(/backspace/gi, '⌫')
          .replace(/enter/gi, '⏎')
          .replace(/up/gi, '↑')
          .replace(/left/gi, '→')
          .replace(/down/gi, '↓')
          .replace(/right/gi, '←')
          .replace(/escape/gi, '⎋')
          .replace(/insert/gi, 'Ins')
          .replace(/delete/gi, '␡')
          .replace(/\+/gi, ' + ');
      if (OS.mac) {
          shortcut = shortcut.replace(/ctrl|cmd/gi, '⌘').replace(/alt/gi, '⌥');
      }
      else {
          shortcut = shortcut.replace(/cmd/gi, 'Ctrl').replace(/windows/gi, 'WIN');
      }
      return shortcut;
  }
  /**
   * Returns valid URL. If it is going outside and valid, it returns itself
   * If url has `one slash`, then it concatenates with window location origin
   * or when url has `two lack` it appends only protocol
   *
   * @param {string} url - url to prettify
   */
  function getValidUrl(url) {
      try {
          const urlObject = new URL(url);
          return urlObject.href;
      }
      catch (e) {
          // do nothing but handle below
      }
      if (url.substring(0, 2) === '//') {
          return window.location.protocol + url;
      }
      else {
          return window.location.origin + url;
      }
  }
  /**
   * Opens new Tab with passed URL
   *
   * @param {string} url - URL address to redirect
   */
  function openTab(url) {
      window.open(url, '_blank');
  }
  /**
   * Returns random generated identifier
   *
   * @param {string} prefix - identifier prefix
   *
   * @returns {string}
   */
  function generateId(prefix = '') {
      // tslint:disable-next-line:no-bitwise
      return `${prefix}${(Math.floor(Math.random() * 1e8)).toString(16)}`;
  }
  /**
   * Common method for printing a warning about the usage of deprecated property or method.
   *
   * @param condition - condition for deprecation.
   * @param oldProperty - deprecated property.
   * @param newProperty - the property that should be used instead.
   */
  function deprecationAssert(condition, oldProperty, newProperty) {
      const message = `«${oldProperty}» is deprecated and will be removed in the next major release. Please use the «${newProperty}» instead.`;
      if (condition) {
          logLabeled(message, 'warn');
      }
  }

  /**
   * DOM manipulations helper
   */
  class Dom {
      /**
       * Check if passed tag has no closed tag
       *
       * @param {HTMLElement} tag - element to check
       * @returns {boolean}
       */
      static isSingleTag(tag) {
          return tag.tagName && [
              'AREA',
              'BASE',
              'BR',
              'COL',
              'COMMAND',
              'EMBED',
              'HR',
              'IMG',
              'INPUT',
              'KEYGEN',
              'LINK',
              'META',
              'PARAM',
              'SOURCE',
              'TRACK',
              'WBR',
          ].includes(tag.tagName);
      }
      /**
       * Check if element is BR or WBR
       *
       * @param {HTMLElement} element - element to check
       * @returns {boolean}
       */
      static isLineBreakTag(element) {
          return element && element.tagName && [
              'BR',
              'WBR',
          ].includes(element.tagName);
      }
      /**
       * Helper for making Elements with classname and attributes
       *
       * @param  {string} tagName - new Element tag name
       * @param  {string[]|string} [classNames] - list or name of CSS classname(s)
       * @param  {object} [attributes] - any attributes
       *
       * @returns {HTMLElement}
       */
      static make(tagName, classNames = null, attributes = {}) {
          const el = document.createElement(tagName);
          if (Array.isArray(classNames)) {
              el.classList.add(...classNames);
          }
          else if (classNames) {
              el.classList.add(classNames);
          }
          for (const attrName in attributes) {
              if (Object.prototype.hasOwnProperty.call(attributes, attrName)) {
                  el[attrName] = attributes[attrName];
              }
          }
          return el;
      }
      /**
       * Creates Text Node with the passed content
       *
       * @param {string} content - text content
       *
       * @returns {Text}
       */
      static text(content) {
          return document.createTextNode(content);
      }
      /**
       * Creates SVG icon linked to the sprite
       *
       * @param {string} name - name (id) of icon from sprite
       * @param {number} [width] - icon width
       * @param {number} [height] - icon height
       *
       * @returns {SVGElement}
       */
      static svg(name, width = 14, height = 14) {
          const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          icon.classList.add('icon', 'icon--' + name);
          icon.setAttribute('width', width + 'px');
          icon.setAttribute('height', height + 'px');
          icon.innerHTML = `<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#${name}"></use>`;
          return icon;
      }
      /**
       * Append one or several elements to the parent
       *
       * @param  {Element|DocumentFragment} parent - where to append
       * @param  {Element|Element[]|DocumentFragment|Text|Text[]} elements - element or elements list
       */
      static append(parent, elements) {
          if (Array.isArray(elements)) {
              elements.forEach((el) => parent.appendChild(el));
          }
          else {
              parent.appendChild(elements);
          }
      }
      /**
       * Append element or a couple to the beginning of the parent elements
       *
       * @param {Element} parent - where to append
       * @param {Element|Element[]} elements - element or elements list
       */
      static prepend(parent, elements) {
          if (Array.isArray(elements)) {
              elements = elements.reverse();
              elements.forEach((el) => parent.prepend(el));
          }
          else {
              parent.prepend(elements);
          }
      }
      /**
       * Swap two elements in parent
       *
       * @param {HTMLElement} el1 - from
       * @param {HTMLElement} el2 - to
       * @deprecated
       */
      static swap(el1, el2) {
          // create marker element and insert it where el1 is
          const temp = document.createElement('div'), parent = el1.parentNode;
          parent.insertBefore(temp, el1);
          // move el1 to right before el2
          parent.insertBefore(el1, el2);
          // move el2 to right before where el1 used to be
          parent.insertBefore(el2, temp);
          // remove temporary marker node
          parent.removeChild(temp);
      }
      /**
       * Selector Decorator
       *
       * Returns first match
       *
       * @param {Element} el - element we searching inside. Default - DOM Document
       * @param {string} selector - searching string
       *
       * @returns {Element}
       */
      static find(el = document, selector) {
          return el.querySelector(selector);
      }
      /**
       * Get Element by Id
       *
       * @param {string} id - id to find
       * @returns {HTMLElement | null}
       */
      static get(id) {
          return document.getElementById(id);
      }
      /**
       * Selector Decorator.
       *
       * Returns all matches
       *
       * @param {Element|Document} el - element we searching inside. Default - DOM Document
       * @param {string} selector - searching string
       *
       * @returns {NodeList}
       */
      static findAll(el = document, selector) {
          return el.querySelectorAll(selector);
      }
      /**
       * Returns CSS selector for all text inputs
       */
      static get allInputsSelector() {
          const allowedInputTypes = ['text', 'password', 'email', 'number', 'search', 'tel', 'url'];
          return '[contenteditable], textarea, input:not([type]), ' +
              allowedInputTypes.map((type) => `input[type="${type}"]`).join(', ');
      }
      /**
       * Find all contendeditable, textarea and editable input elements passed holder contains
       *
       * @param holder - element where to find inputs
       */
      static findAllInputs(holder) {
          return array(holder.querySelectorAll(Dom.allInputsSelector))
              /**
               * If contenteditable element contains block elements, treat them as inputs.
               */
              .reduce((result, input) => {
              if (Dom.isNativeInput(input) || Dom.containsOnlyInlineElements(input)) {
                  return [...result, input];
              }
              return [...result, ...Dom.getDeepestBlockElements(input)];
          }, []);
      }
      /**
       * Search for deepest node which is Leaf.
       * Leaf is the vertex that doesn't have any child nodes
       *
       * @description Method recursively goes throw the all Node until it finds the Leaf
       *
       * @param {Node} node - root Node. From this vertex we start Deep-first search
       *                      {@link https://en.wikipedia.org/wiki/Depth-first_search}
       * @param {boolean} [atLast] - find last text node
       *
       * @returns {Node} - it can be text Node or Element Node, so that caret will able to work with it
       */
      static getDeepestNode(node, atLast = false) {
          /**
           * Current function have two directions:
           *  - starts from first child and every time gets first or nextSibling in special cases
           *  - starts from last child and gets last or previousSibling
           *
           * @type {string}
           */
          const child = atLast ? 'lastChild' : 'firstChild', sibling = atLast ? 'previousSibling' : 'nextSibling';
          if (node && node.nodeType === Node.ELEMENT_NODE && node[child]) {
              let nodeChild = node[child];
              /**
               * special case when child is single tag that can't contain any content
               */
              if (Dom.isSingleTag(nodeChild) &&
                  !Dom.isNativeInput(nodeChild) &&
                  !Dom.isLineBreakTag(nodeChild)) {
                  /**
                   * 1) We need to check the next sibling. If it is Node Element then continue searching for deepest
                   * from sibling
                   *
                   * 2) If single tag's next sibling is null, then go back to parent and check his sibling
                   * In case of Node Element continue searching
                   *
                   * 3) If none of conditions above happened return parent Node Element
                   */
                  if (nodeChild[sibling]) {
                      nodeChild = nodeChild[sibling];
                  }
                  else if (nodeChild.parentNode[sibling]) {
                      nodeChild = nodeChild.parentNode[sibling];
                  }
                  else {
                      return nodeChild.parentNode;
                  }
              }
              return this.getDeepestNode(nodeChild, atLast);
          }
          return node;
      }
      /**
       * Check if object is DOM node
       *
       * @param {*} node - object to check
       *
       * @returns {boolean}
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      static isElement(node) {
          return node && typeof node === 'object' && node.nodeType && node.nodeType === Node.ELEMENT_NODE;
      }
      /**
       * Check if object is DocumentFragment node
       *
       * @param {object} node - object to check
       * @returns {boolean}
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      static isFragment(node) {
          return node && typeof node === 'object' && node.nodeType && node.nodeType === Node.DOCUMENT_FRAGMENT_NODE;
      }
      /**
       * Check if passed element is contenteditable
       *
       * @param {HTMLElement} element - html element to check
       *
       * @returns {boolean}
       */
      static isContentEditable(element) {
          return element.contentEditable === 'true';
      }
      /**
       * Checks target if it is native input
       *
       * @param {*} target - HTML element or string
       *
       * @returns {boolean}
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      static isNativeInput(target) {
          const nativeInputs = [
              'INPUT',
              'TEXTAREA',
          ];
          return target && target.tagName ? nativeInputs.includes(target.tagName) : false;
      }
      /**
       * Checks if we can set caret
       *
       * @param {HTMLElement} target - target to check
       *
       * @returns {boolean}
       */
      static canSetCaret(target) {
          let result = true;
          if (Dom.isNativeInput(target)) {
              switch (target.type) {
                  case 'file':
                  case 'checkbox':
                  case 'radio':
                  case 'hidden':
                  case 'submit':
                  case 'button':
                  case 'image':
                  case 'reset':
                      result = false;
                      break;
              }
          }
          else {
              result = Dom.isContentEditable(target);
          }
          return result;
      }
      /**
       * Checks node if it is empty
       *
       * @description Method checks simple Node without any childs for emptiness
       * If you have Node with 2 or more children id depth, you better use {@link Dom#isEmpty} method
       *
       * @param {Node} node - node to check
       *
       * @returns {boolean} true if it is empty
       */
      static isNodeEmpty(node) {
          let nodeText;
          if (this.isSingleTag(node) && !this.isLineBreakTag(node)) {
              return false;
          }
          if (this.isElement(node) && this.isNativeInput(node)) {
              nodeText = node.value;
          }
          else {
              nodeText = node.textContent.replace('\u200B', '');
          }
          return nodeText.trim().length === 0;
      }
      /**
       * checks node if it is doesn't have any child nodes
       *
       * @param {Node} node - node to check
       *
       * @returns {boolean}
       */
      static isLeaf(node) {
          if (!node) {
              return false;
          }
          return node.childNodes.length === 0;
      }
      /**
       * breadth-first search (BFS)
       * {@link https://en.wikipedia.org/wiki/Breadth-first_search}
       *
       * @description Pushes to stack all DOM leafs and checks for emptiness
       *
       * @param {Node} node - node to check
       * @returns {boolean}
       */
      static isEmpty(node) {
          /**
           * Normalize node to merge several text nodes to one to reduce tree walker iterations
           */
          node.normalize();
          const treeWalker = [node];
          while (treeWalker.length > 0) {
              node = treeWalker.shift();
              if (!node) {
                  continue;
              }
              if (this.isLeaf(node) && !this.isNodeEmpty(node)) {
                  return false;
              }
              if (node.childNodes) {
                  treeWalker.push(...Array.from(node.childNodes));
              }
          }
          return true;
      }
      /**
       * Check if string contains html elements
       *
       * @param {string} str - string to check
       *
       * @returns {boolean}
       */
      static isHTMLString(str) {
          const wrapper = Dom.make('div');
          wrapper.innerHTML = str;
          return wrapper.childElementCount > 0;
      }
      /**
       * Return length of node`s text content
       *
       * @param {Node} node - node with content
       *
       * @returns {number}
       */
      static getContentLength(node) {
          if (Dom.isNativeInput(node)) {
              return node.value.length;
          }
          if (node.nodeType === Node.TEXT_NODE) {
              return node.length;
          }
          return node.textContent.length;
      }
      /**
       * Return array of names of block html elements
       *
       * @returns {string[]}
       */
      static get blockElements() {
          return [
              'address',
              'article',
              'aside',
              'blockquote',
              'canvas',
              'div',
              'dl',
              'dt',
              'fieldset',
              'figcaption',
              'figure',
              'footer',
              'form',
              'h1',
              'h2',
              'h3',
              'h4',
              'h5',
              'h6',
              'header',
              'hgroup',
              'hr',
              'li',
              'main',
              'nav',
              'noscript',
              'ol',
              'output',
              'p',
              'pre',
              'ruby',
              'section',
              'table',
              'tr',
              'tfoot',
              'ul',
              'video',
          ];
      }
      /**
       * Check if passed content includes only inline elements
       *
       * @param {string|HTMLElement} data - element or html string
       *
       * @returns {boolean}
       */
      static containsOnlyInlineElements(data) {
          let wrapper;
          if (typeof data === 'string') {
              wrapper = document.createElement('div');
              wrapper.innerHTML = data;
          }
          else {
              wrapper = data;
          }
          const check = (element) => {
              return !Dom.blockElements.includes(element.tagName.toLowerCase()) &&
                  Array.from(element.children).every(check);
          };
          return Array.from(wrapper.children).every(check);
      }
      /**
       * Find and return all block elements in the passed parent (including subtree)
       *
       * @param {HTMLElement} parent - root element
       *
       * @returns {HTMLElement[]}
       */
      static getDeepestBlockElements(parent) {
          if (Dom.containsOnlyInlineElements(parent)) {
              return [parent];
          }
          return Array.from(parent.children).reduce((result, element) => {
              return [...result, ...Dom.getDeepestBlockElements(element)];
          }, []);
      }
      /**
       * Helper for get holder from {string} or return HTMLElement
       *
       * @param {string | HTMLElement} element - holder's id or holder's HTML Element
       *
       * @returns {HTMLElement}
       */
      static getHolder(element) {
          if (typeof element === 'string') {
              return document.getElementById(element);
          }
          return element;
      }
      /**
       * Method checks passed Node if it is some extension Node
       *
       * @param {Node} node - any node
       *
       * @returns {boolean}
       */
      static isExtensionNode(node) {
          const extensions = [
              'GRAMMARLY-EXTENSION',
          ];
          return node && extensions.includes(node.nodeName);
      }
      /**
       * Returns true if element is anchor (is A tag)
       *
       * @param {Element} element - element to check
       *
       * @returns {boolean}
       */
      static isAnchor(element) {
          return element.tagName.toLowerCase() === 'a';
      }
  }

  var ui={blockTunes:{toggler:{"Click to tune":"","or drag to move":""}},inlineToolbar:{converter:{"Convert to":""}},toolbar:{toolbox:{Add:""}}};var toolNames={Text:"",Link:"",Bold:"",Italic:""};var tools={link:{"Add a link":""},stub:{"The block can not be displayed correctly.":""}};var blockTunes={"delete":{Delete:""},moveUp:{"Move up":""},moveDown:{"Move down":""}};var defaultDictionary = {ui:ui,toolNames:toolNames,tools:tools,blockTunes:blockTunes};

  /**
   * This class will responsible for the translation through the language dictionary
   */
  class I18nConstructor {
      /**
       * Type-safe translation for internal UI texts:
       * Perform translation of the string by namespace and a key
       *
       * @example I18n.ui(I18nInternalNS.ui.blockTunes.toggler, 'Click to tune')
       *
       * @param internalNamespace - path to translated string in dictionary
       * @param dictKey - dictionary key. Better to use default locale original text
       */
      static ui(internalNamespace, dictKey) {
          return I18nConstructor._t(internalNamespace, dictKey);
      }
      /**
       * Translate for external strings that is not presented in default dictionary.
       * For example, for user-specified tool names
       *
       * @param namespace - path to translated string in dictionary
       * @param dictKey - dictionary key. Better to use default locale original text
       */
      static t(namespace, dictKey) {
          return I18nConstructor._t(namespace, dictKey);
      }
      /**
       * Adjust module for using external dictionary
       *
       * @param dictionary - new messages list to override default
       */
      static setDictionary(dictionary) {
          I18nConstructor.currentDictionary = dictionary;
      }
      /**
       * Perform translation both for internal and external namespaces
       * If there is no translation found, returns passed key as a translated message
       *
       * @param namespace - path to translated string in dictionary
       * @param dictKey - dictionary key. Better to use default locale original text
       */
      static _t(namespace, dictKey) {
          const section = I18nConstructor.getNamespace(namespace);
          /**
           * For Console Message to Check Section is defined or not
           * if (section === undefined) {
           *  _.logLabeled('I18n: section %o was not found in current dictionary', 'log', namespace);
           * }
           */
          if (!section || !section[dictKey]) {
              return dictKey;
          }
          return section[dictKey];
      }
      /**
       * Find messages section by namespace path
       *
       * @param namespace - path to section
       */
      static getNamespace(namespace) {
          const parts = namespace.split('.');
          return parts.reduce((section, part) => {
              if (!section || !Object.keys(section).length) {
                  return {};
              }
              return section[part];
          }, I18nConstructor.currentDictionary);
      }
  }
  /**
   * Property that stores messages dictionary
   */
  I18nConstructor.currentDictionary = defaultDictionary;

  /**
   * This type of exception will destroy the Editor! Be careful when using it
   */
  class CriticalError extends Error {
  }

  /**
   * Constructs new BlockAPI object
   *
   * @class
   *
   * @param {Block} block - Block to expose
   */
  function BlockAPI(block) {
      const blockAPI = {
          /**
           * Tool name
           *
           * @returns {string}
           */
          get name() {
              return block.name;
          },
          /**
           * Tool config passed on Editor's initialization
           *
           * @returns {ToolConfig}
           */
          get config() {
              return block.config;
          },
          /**
           * .ce-block element, that wraps plugin contents
           *
           * @returns {HTMLElement}
           */
          get holder() {
              return block.holder;
          },
          /**
           * True if Block content is empty
           *
           * @returns {boolean}
           */
          get isEmpty() {
              return block.isEmpty;
          },
          /**
           * True if Block is selected with Cross-Block selection
           *
           * @returns {boolean}
           */
          get selected() {
              return block.selected;
          },
          /**
           * Set Block's stretch state
           *
           * @param {boolean} state — state to set
           */
          set stretched(state) {
              block.stretched = state;
          },
          /**
           * True if Block is stretched
           *
           * @returns {boolean}
           */
          get stretched() {
              return block.stretched;
          },
          /**
           * Call Tool method with errors handler under-the-hood
           *
           * @param {string} methodName - method to call
           * @param {object} param - object with parameters
           *
           * @returns {unknown}
           */
          call(methodName, param) {
              return block.call(methodName, param);
          },
          /**
           * Save Block content
           *
           * @returns {Promise<void|SavedData>}
           */
          save() {
              return block.save();
          },
          /**
           * Validate Block data
           *
           * @param {BlockToolData} data - data to validate
           *
           * @returns {Promise<boolean>}
           */
          validate(data) {
              return block.validate(data);
          },
      };
      Object.setPrototypeOf(this, blockAPI);
  }

  /**
   * @abstract
   * @class      Module
   * @classdesc  All modules inherits from this class.
   *
   * @typedef {Module} Module
   * @property {object} config - Editor user settings
   * @property {EditorModules} Editor - List of Editor modules
   */
  class Module {
      /**
       * @class
       * @param {EditorConfig} config - Editor's config
       */
      constructor({ config }) {
          /**
           * Each module can provide some UI elements that will be stored in this property
           */
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.nodes = {};
          /**
           * This object provides methods to push into set of listeners that being dropped when read-only mode is enabled
           */
          this.readOnlyMutableListeners = {
              /**
               * Assigns event listener on DOM element and pushes into special array that might be removed
               *
               * @param {EventTarget} element - DOM Element
               * @param {string} eventType - Event name
               * @param {Function} handler - Event handler
               * @param {boolean|AddEventListenerOptions} options - Listening options
               */
              on: (element, eventType, handler, options = false) => {
                  const { Listeners } = this.Editor;
                  this.mutableListenerIds.push(Listeners.on(element, eventType, handler, options));
              },
              /**
               * Clears all mutable listeners
               */
              clearAll: () => {
                  const { Listeners } = this.Editor;
                  for (const id of this.mutableListenerIds) {
                      Listeners.offById(id);
                  }
                  this.mutableListenerIds = [];
              },
          };
          /**
           * The set of listener identifiers which will be dropped in read-only mode
           */
          this.mutableListenerIds = [];
          if (new.target === Module) {
              throw new TypeError('Constructors for abstract class Module are not allowed.');
          }
          this.config = config;
      }
      /**
       * Editor modules setter
       *
       * @param {EditorModules} Editor - Editor's Modules
       */
      set state(Editor) {
          this.Editor = Editor;
      }
      /**
       * Remove memorized nodes
       */
      removeAllNodes() {
          for (const key in this.nodes) {
              const node = this.nodes[key];
              if (node instanceof HTMLElement) {
                  node.remove();
              }
          }
      }
      /**
       * Returns true if current direction is RTL (Right-To-Left)
       */
      get isRtl() {
          return this.config.i18n.direction === 'rtl';
      }
  }

  /**
   * @class BlocksAPI
   * provides with methods working with Block
   */
  class BlocksAPI extends Module {
      constructor() {
          super(...arguments);
          /**
           * Insert new Block
           *
           * @param {string} type — Tool name
           * @param {BlockToolData} data — Tool data to insert
           * @param {ToolConfig} config — Tool config
           * @param {number?} index — index where to insert new Block
           * @param {boolean?} needToFocus - flag to focus inserted Block
           */
          this.insert = (type = this.config.defaultBlock, data = {}, config = {}, index, needToFocus) => {
              this.Editor.BlockManager.insert({
                  tool: type,
                  data,
                  index,
                  needToFocus,
              });
          };
      }
      /**
       * Available methods
       *
       * @returns {Blocks}
       */
      get methods() {
          return {
              clear: () => this.clear(),
              render: (data) => this.render(data),
              renderFromHTML: (data) => this.renderFromHTML(data),
              delete: (index) => this.delete(index),
              swap: (fromIndex, toIndex) => this.swap(fromIndex, toIndex),
              move: (toIndex, fromIndex) => this.move(toIndex, fromIndex),
              getBlockByIndex: (index) => this.getBlockByIndex(index),
              getCurrentBlockIndex: () => this.getCurrentBlockIndex(),
              getBlocksCount: () => this.getBlocksCount(),
              stretchBlock: (index, status = true) => this.stretchBlock(index, status),
              insertNewBlock: () => this.insertNewBlock(),
              insert: this.insert,
          };
      }
      /**
       * Returns Blocks count
       *
       * @returns {number}
       */
      getBlocksCount() {
          return this.Editor.BlockManager.blocks.length;
      }
      /**
       * Returns current block index
       *
       * @returns {number}
       */
      getCurrentBlockIndex() {
          return this.Editor.BlockManager.currentBlockIndex;
      }
      /**
       * Returns BlockAPI object by Block index
       *
       * @param {number} index - index to get
       */
      getBlockByIndex(index) {
          const block = this.Editor.BlockManager.getBlockByIndex(index);
          if (block === undefined) {
              logLabeled('There is no block at index `' + index + '`', 'warn');
              return;
          }
          return new BlockAPI(block);
      }
      /**
       * Call Block Manager method that swap Blocks
       *
       * @param {number} fromIndex - position of first Block
       * @param {number} toIndex - position of second Block
       * @deprecated — use 'move' instead
       */
      swap(fromIndex, toIndex) {
          log('`blocks.swap()` method is deprecated and will be removed in the next major release. ' +
              'Use `block.move()` method instead', 'info');
          this.Editor.BlockManager.swap(fromIndex, toIndex);
          /**
           * Move toolbar
           * DO not close the settings
           */
          this.Editor.Toolbar.move(false);
      }
      /**
       * Move block from one index to another
       *
       * @param {number} toIndex - index to move to
       * @param {number} fromIndex - index to move from
       */
      move(toIndex, fromIndex) {
          this.Editor.BlockManager.move(toIndex, fromIndex);
          /**
           * Move toolbar
           * DO not close the settings
           */
          this.Editor.Toolbar.move(false);
      }
      /**
       * Deletes Block
       *
       * @param {number} blockIndex - index of Block to delete
       */
      delete(blockIndex) {
          try {
              this.Editor.BlockManager.removeBlock(blockIndex);
          }
          catch (e) {
              logLabeled(e, 'warn');
              return;
          }
          /**
           * in case of last block deletion
           * Insert the new default empty block
           */
          if (this.Editor.BlockManager.blocks.length === 0) {
              this.Editor.BlockManager.insert();
          }
          /**
           * After Block deletion currentBlock is updated
           */
          if (this.Editor.BlockManager.currentBlock) {
              this.Editor.Caret.setToBlock(this.Editor.BlockManager.currentBlock, this.Editor.Caret.positions.END);
          }
          this.Editor.Toolbar.close();
      }
      /**
       * Clear Editor's area
       */
      clear() {
          this.Editor.BlockManager.clear(true);
          this.Editor.InlineToolbar.close();
      }
      /**
       * Fills Editor with Blocks data
       *
       * @param {OutputData} data — Saved Editor data
       */
      render(data) {
          this.Editor.BlockManager.clear();
          return this.Editor.Renderer.render(data.blocks);
      }
      /**
       * Render passed HTML string
       *
       * @param {string} data - HTML string to render
       * @returns {Promise<void>}
       */
      renderFromHTML(data) {
          this.Editor.BlockManager.clear();
          return this.Editor.Paste.processText(data, true);
      }
      /**
       * Stretch Block's content
       *
       * @param {number} index - index of Block to stretch
       * @param {boolean} status - true to enable, false to disable
       *
       * @deprecated Use BlockAPI interface to stretch Blocks
       */
      stretchBlock(index, status = true) {
          deprecationAssert(true, 'blocks.stretchBlock()', 'BlockAPI');
          const block = this.Editor.BlockManager.getBlockByIndex(index);
          if (!block) {
              return;
          }
          block.stretched = status;
      }
      /**
       * Insert new Block
       * After set caret to this Block
       *
       * @todo remove in 3.0.0
       *
       * @deprecated with insert() method
       */
      insertNewBlock() {
          log('Method blocks.insertNewBlock() is deprecated and it will be removed in the next major release. ' +
              'Use blocks.insert() instead.', 'warn');
          this.insert();
      }
  }
  BlocksAPI.displayName = 'BlocksAPI';

  /**
   * @class CaretAPI
   * provides with methods to work with caret
   */
  class CaretAPI extends Module {
      constructor() {
          super(...arguments);
          /**
           * Sets caret to the first Block
           *
           * @param {string} position - position where to set caret
           * @param {number} offset - caret offset
           *
           * @returns {boolean}
           */
          this.setToFirstBlock = (position = this.Editor.Caret.positions.DEFAULT, offset = 0) => {
              if (!this.Editor.BlockManager.firstBlock) {
                  return false;
              }
              this.Editor.Caret.setToBlock(this.Editor.BlockManager.firstBlock, position, offset);
              return true;
          };
          /**
           * Sets caret to the last Block
           *
           * @param {string} position - position where to set caret
           * @param {number} offset - caret offset
           *
           * @returns {boolean}
           */
          this.setToLastBlock = (position = this.Editor.Caret.positions.DEFAULT, offset = 0) => {
              if (!this.Editor.BlockManager.lastBlock) {
                  return false;
              }
              this.Editor.Caret.setToBlock(this.Editor.BlockManager.lastBlock, position, offset);
              return true;
          };
          /**
           * Sets caret to the previous Block
           *
           * @param {string} position - position where to set caret
           * @param {number} offset - caret offset
           *
           * @returns {boolean}
           */
          this.setToPreviousBlock = (position = this.Editor.Caret.positions.DEFAULT, offset = 0) => {
              if (!this.Editor.BlockManager.previousBlock) {
                  return false;
              }
              this.Editor.Caret.setToBlock(this.Editor.BlockManager.previousBlock, position, offset);
              return true;
          };
          /**
           * Sets caret to the next Block
           *
           * @param {string} position - position where to set caret
           * @param {number} offset - caret offset
           *
           * @returns {boolean}
           */
          this.setToNextBlock = (position = this.Editor.Caret.positions.DEFAULT, offset = 0) => {
              if (!this.Editor.BlockManager.nextBlock) {
                  return false;
              }
              this.Editor.Caret.setToBlock(this.Editor.BlockManager.nextBlock, position, offset);
              return true;
          };
          /**
           * Sets caret to the Block by passed index
           *
           * @param {number} index - index of Block where to set caret
           * @param {string} position - position where to set caret
           * @param {number} offset - caret offset
           *
           * @returns {boolean}
           */
          this.setToBlock = (index, position = this.Editor.Caret.positions.DEFAULT, offset = 0) => {
              if (!this.Editor.BlockManager.blocks[index]) {
                  return false;
              }
              this.Editor.Caret.setToBlock(this.Editor.BlockManager.blocks[index], position, offset);
              return true;
          };
          /**
           * Sets caret to the Editor
           *
           * @param {boolean} atEnd - if true, set Caret to the end of the Editor
           *
           * @returns {boolean}
           */
          this.focus = (atEnd = false) => {
              if (atEnd) {
                  return this.setToLastBlock(this.Editor.Caret.positions.END);
              }
              return this.setToFirstBlock(this.Editor.Caret.positions.START);
          };
      }
      /**
       * Available methods
       *
       * @returns {Caret}
       */
      get methods() {
          return {
              setToFirstBlock: this.setToFirstBlock,
              setToLastBlock: this.setToLastBlock,
              setToPreviousBlock: this.setToPreviousBlock,
              setToNextBlock: this.setToNextBlock,
              setToBlock: this.setToBlock,
              focus: this.focus,
          };
      }
  }
  CaretAPI.displayName = 'CaretAPI';

  /**
   * @class EventsAPI
   * provides with methods working with Toolbar
   */
  class EventsAPI extends Module {
      /**
       * Available methods
       *
       * @returns {Events}
       */
      get methods() {
          return {
              emit: (eventName, data) => this.emit(eventName, data),
              off: (eventName, callback) => this.off(eventName, callback),
              on: (eventName, callback) => this.on(eventName, callback),
          };
      }
      /**
       * Subscribe on Events
       *
       * @param {string} eventName - event name to subscribe
       * @param {Function} callback - event handler
       */
      on(eventName, callback) {
          this.Editor.Events.on(eventName, callback);
      }
      /**
       * Emit event with data
       *
       * @param {string} eventName - event to emit
       * @param {object} data - event's data
       */
      emit(eventName, data) {
          this.Editor.Events.emit(eventName, data);
      }
      /**
       * Unsubscribe from Event
       *
       * @param {string} eventName - event to unsubscribe
       * @param {Function} callback - event handler
       */
      off(eventName, callback) {
          this.Editor.Events.off(eventName, callback);
      }
  }
  EventsAPI.displayName = 'EventsAPI';

  /**
   * Bold Tool
   *
   * Inline Toolbar Tool
   *
   * Makes selected text bolder
   */
  class BoldInlineTool {
      constructor() {
          /**
           * Native Document's command that uses for Bold
           */
          this.commandName = 'bold';
          /**
           * Styles
           */
          this.CSS = {
              button: 'ce-inline-tool',
              buttonActive: 'ce-inline-tool--active',
              buttonModifier: 'ce-inline-tool--bold',
          };
          /**
           * Elements
           */
          this.nodes = {
              button: undefined,
          };
      }
      /**
       * Sanitizer Rule
       * Leave <b> tags
       *
       * @returns {object}
       */
      static get sanitize() {
          return {
              b: {},
          };
      }
      /**
       * Create button for Inline Toolbar
       */
      render() {
          this.nodes.button = document.createElement('button');
          this.nodes.button.type = 'button';
          this.nodes.button.classList.add(this.CSS.button, this.CSS.buttonModifier);
          this.nodes.button.appendChild(Dom.svg('bold', 12, 14));
          return this.nodes.button;
      }
      /**
       * Wrap range with <b> tag
       *
       * @param {Range} range - range to wrap
       */
      surround(range) {
          document.execCommand(this.commandName);
      }
      /**
       * Check selection and set activated state to button if there are <b> tag
       *
       * @param {Selection} selection - selection to check
       *
       * @returns {boolean}
       */
      checkState(selection) {
          const isActive = document.queryCommandState(this.commandName);
          this.nodes.button.classList.toggle(this.CSS.buttonActive, isActive);
          return isActive;
      }
      /**
       * Set a shortcut
       *
       * @returns {boolean}
       */
      get shortcut() {
          return 'CMD+B';
      }
  }
  /**
   * Specifies Tool as Inline Toolbar Tool
   *
   * @returns {boolean}
   */
  BoldInlineTool.isInline = true;
  /**
   * Title for hover-tooltip
   */
  BoldInlineTool.title = 'Bold';

  /**
   * Italic Tool
   *
   * Inline Toolbar Tool
   *
   * Style selected text with italic
   */
  class ItalicInlineTool {
      constructor() {
          /**
           * Native Document's command that uses for Italic
           */
          this.commandName = 'italic';
          /**
           * Styles
           */
          this.CSS = {
              button: 'ce-inline-tool',
              buttonActive: 'ce-inline-tool--active',
              buttonModifier: 'ce-inline-tool--italic',
          };
          /**
           * Elements
           */
          this.nodes = {
              button: null,
          };
      }
      /**
       * Sanitizer Rule
       * Leave <i> tags
       *
       * @returns {object}
       */
      static get sanitize() {
          return {
              i: {},
          };
      }
      /**
       * Create button for Inline Toolbar
       */
      render() {
          this.nodes.button = document.createElement('button');
          this.nodes.button.type = 'button';
          this.nodes.button.classList.add(this.CSS.button, this.CSS.buttonModifier);
          this.nodes.button.appendChild(Dom.svg('italic', 4, 11));
          return this.nodes.button;
      }
      /**
       * Wrap range with <i> tag
       *
       * @param {Range} range - range to wrap
       */
      surround(range) {
          document.execCommand(this.commandName);
      }
      /**
       * Check selection and set activated state to button if there are <i> tag
       *
       * @param {Selection} selection - selection to check
       */
      checkState(selection) {
          const isActive = document.queryCommandState(this.commandName);
          this.nodes.button.classList.toggle(this.CSS.buttonActive, isActive);
          return isActive;
      }
      /**
       * Set a shortcut
       */
      get shortcut() {
          return 'CMD+I';
      }
  }
  /**
   * Specifies Tool as Inline Toolbar Tool
   *
   * @returns {boolean}
   */
  ItalicInlineTool.isInline = true;
  /**
   * Title for hover-tooltip
   */
  ItalicInlineTool.title = 'Italic';

  /**
   * TextRange interface fot IE9-
   */
  /**
   * Working with selection
   *
   * @typedef {SelectionUtils} SelectionUtils
   */
  class SelectionUtils {
      constructor() {
          /**
           * Selection instances
           *
           * @todo Check if this is still relevant
           */
          this.instance = null;
          this.selection = null;
          /**
           * This property can store SelectionUtils's range for restoring later
           *
           * @type {Range|null}
           */
          this.savedSelectionRange = null;
          /**
           * Fake background is active
           *
           * @returns {boolean}
           */
          this.isFakeBackgroundEnabled = false;
          /**
           * Native Document's commands for fake background
           */
          this.commandBackground = 'backColor';
          this.commandRemoveFormat = 'removeFormat';
      }
      /**
       * Editor styles
       *
       * @returns {{editorWrapper: string, editorZone: string}}
       */
      static get CSS() {
          return {
              editorWrapper: 'codex-editor',
              editorZone: 'codex-editor__redactor',
          };
      }
      /**
       * Returns selected anchor
       * {@link https://developer.mozilla.org/ru/docs/Web/API/Selection/anchorNode}
       *
       * @returns {Node|null}
       */
      static get anchorNode() {
          const selection = window.getSelection();
          return selection ? selection.anchorNode : null;
      }
      /**
       * Returns selected anchor element
       *
       * @returns {Element|null}
       */
      static get anchorElement() {
          const selection = window.getSelection();
          if (!selection) {
              return null;
          }
          const anchorNode = selection.anchorNode;
          if (!anchorNode) {
              return null;
          }
          if (!Dom.isElement(anchorNode)) {
              return anchorNode.parentElement;
          }
          else {
              return anchorNode;
          }
      }
      /**
       * Returns selection offset according to the anchor node
       * {@link https://developer.mozilla.org/ru/docs/Web/API/Selection/anchorOffset}
       *
       * @returns {number|null}
       */
      static get anchorOffset() {
          const selection = window.getSelection();
          return selection ? selection.anchorOffset : null;
      }
      /**
       * Is current selection range collapsed
       *
       * @returns {boolean|null}
       */
      static get isCollapsed() {
          const selection = window.getSelection();
          return selection ? selection.isCollapsed : null;
      }
      /**
       * Check current selection if it is at Editor's zone
       *
       * @returns {boolean}
       */
      static get isAtEditor() {
          const selection = SelectionUtils.get();
          /**
           * Something selected on document
           */
          let selectedNode = (selection.anchorNode || selection.focusNode);
          if (selectedNode && selectedNode.nodeType === Node.TEXT_NODE) {
              selectedNode = selectedNode.parentNode;
          }
          let editorZone = null;
          if (selectedNode) {
              editorZone = selectedNode.closest(`.${SelectionUtils.CSS.editorZone}`);
          }
          /**
           * SelectionUtils is not out of Editor because Editor's wrapper was found
           */
          return editorZone && editorZone.nodeType === Node.ELEMENT_NODE;
      }
      /**
       * Methods return boolean that true if selection exists on the page
       */
      static get isSelectionExists() {
          const selection = SelectionUtils.get();
          return !!selection.anchorNode;
      }
      /**
       * Return first range
       *
       * @returns {Range|null}
       */
      static get range() {
          const selection = window.getSelection();
          return selection && selection.rangeCount ? selection.getRangeAt(0) : null;
      }
      /**
       * Calculates position and size of selected text
       *
       * @returns {DOMRect | ClientRect}
       */
      static get rect() {
          let sel = document.selection, range;
          let rect = {
              x: 0,
              y: 0,
              width: 0,
              height: 0,
          };
          if (sel && sel.type !== 'Control') {
              sel = sel;
              range = sel.createRange();
              rect.x = range.boundingLeft;
              rect.y = range.boundingTop;
              rect.width = range.boundingWidth;
              rect.height = range.boundingHeight;
              return rect;
          }
          if (!window.getSelection) {
              log('Method window.getSelection is not supported', 'warn');
              return rect;
          }
          sel = window.getSelection();
          if (sel.rangeCount === null || isNaN(sel.rangeCount)) {
              log('Method SelectionUtils.rangeCount is not supported', 'warn');
              return rect;
          }
          if (sel.rangeCount === 0) {
              return rect;
          }
          range = sel.getRangeAt(0).cloneRange();
          if (range.getBoundingClientRect) {
              rect = range.getBoundingClientRect();
          }
          // Fall back to inserting a temporary element
          if (rect.x === 0 && rect.y === 0) {
              const span = document.createElement('span');
              if (span.getBoundingClientRect) {
                  // Ensure span has dimensions and position by
                  // adding a zero-width space character
                  span.appendChild(document.createTextNode('\u200b'));
                  range.insertNode(span);
                  rect = span.getBoundingClientRect();
                  const spanParent = span.parentNode;
                  spanParent.removeChild(span);
                  // Glue any broken text nodes back together
                  spanParent.normalize();
              }
          }
          return rect;
      }
      /**
       * Returns selected text as String
       *
       * @returns {string}
       */
      static get text() {
          return window.getSelection ? window.getSelection().toString() : '';
      }
      /**
       * Returns window SelectionUtils
       * {@link https://developer.mozilla.org/ru/docs/Web/API/Window/getSelection}
       *
       * @returns {Selection}
       */
      static get() {
          return window.getSelection();
      }
      /**
       * Set focus to contenteditable or native input element
       *
       * @param element - element where to set focus
       * @param offset - offset of cursor
       *
       * @returns {DOMRect} of range
       */
      static setCursor(element, offset = 0) {
          const range = document.createRange();
          const selection = window.getSelection();
          /** if found deepest node is native input */
          if (Dom.isNativeInput(element)) {
              if (!Dom.canSetCaret(element)) {
                  return;
              }
              element.focus();
              element.selectionStart = element.selectionEnd = offset;
              return element.getBoundingClientRect();
          }
          range.setStart(element, offset);
          range.setEnd(element, offset);
          selection.removeAllRanges();
          selection.addRange(range);
          return range.getBoundingClientRect();
      }
      /**
       * Removes fake background
       */
      removeFakeBackground() {
          if (!this.isFakeBackgroundEnabled) {
              return;
          }
          this.isFakeBackgroundEnabled = false;
          document.execCommand(this.commandRemoveFormat);
      }
      /**
       * Sets fake background
       */
      setFakeBackground() {
          document.execCommand(this.commandBackground, false, '#a8d6ff');
          this.isFakeBackgroundEnabled = true;
      }
      /**
       * Save SelectionUtils's range
       */
      save() {
          this.savedSelectionRange = SelectionUtils.range;
      }
      /**
       * Restore saved SelectionUtils's range
       */
      restore() {
          if (!this.savedSelectionRange) {
              return;
          }
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(this.savedSelectionRange);
      }
      /**
       * Clears saved selection
       */
      clearSaved() {
          this.savedSelectionRange = null;
      }
      /**
       * Collapse current selection
       */
      collapseToEnd() {
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(sel.focusNode);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
      }
      /**
       * Looks ahead to find passed tag from current selection
       *
       * @param  {string} tagName       - tag to found
       * @param  {string} [className]   - tag's class name
       * @param  {number} [searchDepth] - count of tags that can be included. For better performance.
       *
       * @returns {HTMLElement|null}
       */
      findParentTag(tagName, className, searchDepth = 10) {
          const selection = window.getSelection();
          let parentTag = null;
          /**
           * If selection is missing or no anchorNode or focusNode were found then return null
           */
          if (!selection || !selection.anchorNode || !selection.focusNode) {
              return null;
          }
          /**
           * Define Nodes for start and end of selection
           */
          const boundNodes = [
              /** the Node in which the selection begins */
              selection.anchorNode,
              /** the Node in which the selection ends */
              selection.focusNode,
          ];
          /**
           * For each selection parent Nodes we try to find target tag [with target class name]
           * It would be saved in parentTag variable
           */
          boundNodes.forEach((parent) => {
              /** Reset tags limit */
              let searchDepthIterable = searchDepth;
              while (searchDepthIterable > 0 && parent.parentNode) {
                  /**
                   * Check tag's name
                   */
                  if (parent.tagName === tagName) {
                      /**
                       * Save the result
                       */
                      parentTag = parent;
                      /**
                       * Optional additional check for class-name mismatching
                       */
                      if (className && parent.classList && !parent.classList.contains(className)) {
                          parentTag = null;
                      }
                      /**
                       * If we have found required tag with class then go out from the cycle
                       */
                      if (parentTag) {
                          break;
                      }
                  }
                  /**
                   * Target tag was not found. Go up to the parent and check it
                   */
                  parent = parent.parentNode;
                  searchDepthIterable--;
              }
          });
          /**
           * Return found tag or null
           */
          return parentTag;
      }
      /**
       * Expands selection range to the passed parent node
       *
       * @param {HTMLElement} element - element which contents should be selcted
       */
      expandToTag(element) {
          const selection = window.getSelection();
          selection.removeAllRanges();
          const range = document.createRange();
          range.selectNodeContents(element);
          selection.addRange(range);
      }
  }

  /**
   * Link Tool
   *
   * Inline Toolbar Tool
   *
   * Wrap selected text with <a> tag
   */
  class LinkInlineTool {
      /**
       * @param {API} api - Editor.js API
       */
      constructor({ api }) {
          /**
           * Native Document's commands for link/unlink
           */
          this.commandLink = 'createLink';
          this.commandUnlink = 'unlink';
          /**
           * Enter key code
           */
          this.ENTER_KEY = 13;
          /**
           * Styles
           */
          this.CSS = {
              button: 'ce-inline-tool',
              buttonActive: 'ce-inline-tool--active',
              buttonModifier: 'ce-inline-tool--link',
              buttonUnlink: 'ce-inline-tool--unlink',
              input: 'ce-inline-tool-input',
              inputShowed: 'ce-inline-tool-input--showed',
          };
          /**
           * Elements
           */
          this.nodes = {
              button: null,
              input: null,
          };
          /**
           * Input opening state
           */
          this.inputOpened = false;
          this.toolbar = api.toolbar;
          this.inlineToolbar = api.inlineToolbar;
          this.notifier = api.notifier;
          this.i18n = api.i18n;
          this.selection = new SelectionUtils();
      }
      /**
       * Sanitizer Rule
       * Leave <a> tags
       *
       * @returns {object}
       */
      static get sanitize() {
          return {
              a: {
                  href: true,
                  target: '_blank',
                  rel: 'nofollow',
              },
          };
      }
      /**
       * Create button for Inline Toolbar
       */
      render() {
          this.nodes.button = document.createElement('button');
          this.nodes.button.type = 'button';
          this.nodes.button.classList.add(this.CSS.button, this.CSS.buttonModifier);
          this.nodes.button.appendChild(Dom.svg('link', 14, 10));
          this.nodes.button.appendChild(Dom.svg('unlink', 15, 11));
          return this.nodes.button;
      }
      /**
       * Input for the link
       */
      renderActions() {
          this.nodes.input = document.createElement('input');
          this.nodes.input.placeholder = this.i18n.t('Add a link');
          this.nodes.input.classList.add(this.CSS.input);
          this.nodes.input.addEventListener('keydown', (event) => {
              if (event.keyCode === this.ENTER_KEY) {
                  this.enterPressed(event);
              }
          });
          return this.nodes.input;
      }
      /**
       * Handle clicks on the Inline Toolbar icon
       *
       * @param {Range} range - range to wrap with link
       */
      surround(range) {
          /**
           * Range will be null when user makes second click on the 'link icon' to close opened input
           */
          if (range) {
              /**
               * Save selection before change focus to the input
               */
              if (!this.inputOpened) {
                  /** Create blue background instead of selection */
                  this.selection.setFakeBackground();
                  this.selection.save();
              }
              else {
                  this.selection.restore();
                  this.selection.removeFakeBackground();
              }
              const parentAnchor = this.selection.findParentTag('A');
              /**
               * Unlink icon pressed
               */
              if (parentAnchor) {
                  this.selection.expandToTag(parentAnchor);
                  this.unlink();
                  this.closeActions();
                  this.checkState();
                  this.toolbar.close();
                  return;
              }
          }
          this.toggleActions();
      }
      /**
       * Check selection and set activated state to button if there are <a> tag
       *
       * @param {Selection} selection - selection to check
       */
      checkState(selection) {
          const anchorTag = this.selection.findParentTag('A');
          if (anchorTag) {
              this.nodes.button.classList.add(this.CSS.buttonUnlink);
              this.nodes.button.classList.add(this.CSS.buttonActive);
              this.openActions();
              /**
               * Fill input value with link href
               */
              const hrefAttr = anchorTag.getAttribute('href');
              this.nodes.input.value = hrefAttr !== 'null' ? hrefAttr : '';
              this.selection.save();
          }
          else {
              this.nodes.button.classList.remove(this.CSS.buttonUnlink);
              this.nodes.button.classList.remove(this.CSS.buttonActive);
          }
          return !!anchorTag;
      }
      /**
       * Function called with Inline Toolbar closing
       */
      clear() {
          this.closeActions();
      }
      /**
       * Set a shortcut
       */
      get shortcut() {
          return 'CMD+K';
      }
      /**
       * Show/close link input
       */
      toggleActions() {
          if (!this.inputOpened) {
              this.openActions(true);
          }
          else {
              this.closeActions(false);
          }
      }
      /**
       * @param {boolean} needFocus - on link creation we need to focus input. On editing - nope.
       */
      openActions(needFocus = false) {
          this.nodes.input.classList.add(this.CSS.inputShowed);
          if (needFocus) {
              this.nodes.input.focus();
          }
          this.inputOpened = true;
      }
      /**
       * Close input
       *
       * @param {boolean} clearSavedSelection — we don't need to clear saved selection
       *                                        on toggle-clicks on the icon of opened Toolbar
       */
      closeActions(clearSavedSelection = true) {
          if (this.selection.isFakeBackgroundEnabled) {
              // if actions is broken by other selection We need to save new selection
              const currentSelection = new SelectionUtils();
              currentSelection.save();
              this.selection.restore();
              this.selection.removeFakeBackground();
              // and recover new selection after removing fake background
              currentSelection.restore();
          }
          this.nodes.input.classList.remove(this.CSS.inputShowed);
          this.nodes.input.value = '';
          if (clearSavedSelection) {
              this.selection.clearSaved();
          }
          this.inputOpened = false;
      }
      /**
       * Enter pressed on input
       *
       * @param {KeyboardEvent} event - enter keydown event
       */
      enterPressed(event) {
          let value = this.nodes.input.value || '';
          if (!value.trim()) {
              this.selection.restore();
              this.unlink();
              event.preventDefault();
              this.closeActions();
          }
          if (!this.validateURL(value)) {
              this.notifier.show({
                  message: 'Pasted link is not valid.',
                  style: 'error',
              });
              log('Incorrect Link pasted', 'warn', value);
              return;
          }
          value = this.prepareLink(value);
          this.selection.restore();
          this.selection.removeFakeBackground();
          this.insertLink(value);
          /**
           * Preventing events that will be able to happen
           */
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          this.selection.collapseToEnd();
          this.inlineToolbar.close();
      }
      /**
       * Detects if passed string is URL
       *
       * @param {string} str - string to validate
       * @returns {boolean}
       */
      validateURL(str) {
          /**
           * Don't allow spaces
           */
          return !/\s/.test(str);
      }
      /**
       * Process link before injection
       * - sanitize
       * - add protocol for links like 'google.com'
       *
       * @param {string} link - raw user input
       */
      prepareLink(link) {
          link = link.trim();
          link = this.addProtocol(link);
          return link;
      }
      /**
       * Add 'http' protocol to the links like 'vc.ru', 'google.com'
       *
       * @param {string} link - string to process
       */
      addProtocol(link) {
          /**
           * If protocol already exists, do nothing
           */
          if (/^(\w+):(\/\/)?/.test(link)) {
              return link;
          }
          /**
           * We need to add missed HTTP protocol to the link, but skip 2 cases:
           *     1) Internal links like "/general"
           *     2) Anchors looks like "#results"
           *     3) Protocol-relative URLs like "//google.com"
           */
          const isInternal = /^\/[^/\s]/.test(link), isAnchor = link.substring(0, 1) === '#', isProtocolRelative = /^\/\/[^/\s]/.test(link);
          if (!isInternal && !isAnchor && !isProtocolRelative) {
              link = 'http://' + link;
          }
          return link;
      }
      /**
       * Inserts <a> tag with "href"
       *
       * @param {string} link - "href" value
       */
      insertLink(link) {
          /**
           * Edit all link, not selected part
           */
          const anchorTag = this.selection.findParentTag('A');
          if (anchorTag) {
              this.selection.expandToTag(anchorTag);
          }
          document.execCommand(this.commandLink, false, link);
      }
      /**
       * Removes <a> tag
       */
      unlink() {
          document.execCommand(this.commandUnlink);
      }
  }
  /**
   * Specifies Tool as Inline Toolbar Tool
   *
   * @returns {boolean}
   */
  LinkInlineTool.isInline = true;
  /**
   * Title for hover-tooltip
   */
  LinkInlineTool.title = 'Link';

  /**
   * This tool will be shown in place of a block without corresponding plugin
   * It will store its data inside and pass it back with article saving
   */
  class Stub {
      /**
       * @param options - constructor options
       * @param options.data - stub tool data
       * @param options.api - Editor.js API
       */
      constructor({ data, api }) {
          /**
           * Stub styles
           *
           * @type {{wrapper: string, info: string, title: string, subtitle: string}}
           */
          this.CSS = {
              wrapper: 'ce-stub',
              info: 'ce-stub__info',
              title: 'ce-stub__title',
              subtitle: 'ce-stub__subtitle',
          };
          this.api = api;
          this.title = data.title || this.api.i18n.t('Error');
          this.subtitle = this.api.i18n.t('The block can not be displayed correctly.');
          this.savedData = data.savedData;
          this.wrapper = this.make();
      }
      /**
       * Returns stub holder
       *
       * @returns {HTMLElement}
       */
      render() {
          return this.wrapper;
      }
      /**
       * Return original Tool data
       *
       * @returns {BlockToolData}
       */
      save() {
          return this.savedData;
      }
      /**
       * Create Tool html markup
       *
       * @returns {HTMLElement}
       */
      make() {
          const wrapper = Dom.make('div', this.CSS.wrapper);
          const icon = Dom.svg('sad-face', 52, 52);
          const infoContainer = Dom.make('div', this.CSS.info);
          const title = Dom.make('div', this.CSS.title, {
              textContent: this.title,
          });
          const subtitle = Dom.make('div', this.CSS.subtitle, {
              textContent: this.subtitle,
          });
          wrapper.appendChild(icon);
          infoContainer.appendChild(title);
          infoContainer.appendChild(subtitle);
          wrapper.appendChild(infoContainer);
          return wrapper;
      }
  }
  /**
   * Notify core that tool supports read-only mode
   */
  Stub.isReadOnlySupported = true;

  /**
   * @module Editor.js Tools Submodule
   *
   * Creates Instances from Plugins and binds external config to the instances
   */
  /**
   * Class properties:
   *
   * @typedef {Tools} Tools
   * @property {Tools[]} toolsAvailable - available Tools
   * @property {Tools[]} toolsUnavailable - unavailable Tools
   * @property {object} toolsClasses - all classes
   * @property {object} toolsSettings - Tools settings
   * @property {EditorConfig} config - Editor config
   */
  class Tools extends Module {
      /**
       * @class
       *
       * @param {EditorConfig} config - Editor's configuration
       */
      constructor({ config }) {
          super({ config });
          /**
           * Name of Stub Tool
           * Stub Tool is used to substitute unavailable block Tools and store their data
           *
           * @type {string}
           */
          this.stubTool = 'stub';
          /**
           * Map {name: Class, ...} where:
           *  name — block type name in JSON. Got from EditorConfig.tools keys
           *
           * @type {object}
           */
          this.toolsClasses = {};
          /**
           * Tools` classes available to use
           */
          this.toolsAvailable = {};
          /**
           * Tools` classes not available to use because of preparation failure
           */
          this.toolsUnavailable = {};
          /**
           * Tools settings in a map {name: settings, ...}
           *
           * @type {object}
           */
          this.toolsSettings = {};
          /**
           * Cache for the prepared inline tools
           *
           * @type {null|object}
           * @private
           */
          this._inlineTools = {};
          this.toolsClasses = {};
          this.toolsSettings = {};
          /**
           * Available tools list
           * {name: Class, ...}
           *
           * @type {object}
           */
          this.toolsAvailable = {};
          /**
           * Tools that rejected a prepare method
           * {name: Class, ... }
           *
           * @type {object}
           */
          this.toolsUnavailable = {};
          this._inlineTools = null;
      }
      /**
       * Returns available Tools
       *
       * @returns {object<Tool>}
       */
      get available() {
          return this.toolsAvailable;
      }
      /**
       * Returns unavailable Tools
       *
       * @returns {Tool[]}
       */
      get unavailable() {
          return this.toolsUnavailable;
      }
      /**
       * Return Tools for the Inline Toolbar
       *
       * @returns {object} - object of Inline Tool's classes
       */
      get inline() {
          if (this._inlineTools) {
              return this._inlineTools;
          }
          const tools = Object.entries(this.available).filter(([name, tool]) => {
              if (!tool[this.INTERNAL_SETTINGS.IS_INLINE]) {
                  return false;
              }
              /**
               * Some Tools validation
               */
              const inlineToolRequiredMethods = ['render', 'surround', 'checkState'];
              const notImplementedMethods = inlineToolRequiredMethods.filter((method) => !this.constructInline(tool, name)[method]);
              if (notImplementedMethods.length) {
                  log(`Incorrect Inline Tool: ${tool.name}. Some of required methods is not implemented %o`, 'warn', notImplementedMethods);
                  return false;
              }
              return true;
          });
          /**
           * collected inline tools with key of tool name
           */
          const result = {};
          tools.forEach(([name, tool]) => {
              result[name] = tool;
          });
          /**
           * Cache prepared Tools
           */
          this._inlineTools = result;
          return this._inlineTools;
      }
      /**
       * Return editor block tools
       */
      get blockTools() {
          const tools = Object.entries(this.available).filter(([, tool]) => {
              return !tool[this.INTERNAL_SETTINGS.IS_INLINE];
          });
          /**
           * collected block tools with key of tool name
           */
          const result = {};
          tools.forEach(([name, tool]) => {
              result[name] = tool;
          });
          return result;
      }
      /**
       * Constant for available Tools internal settings provided by Tool developer
       *
       * @returns {object}
       */
      get INTERNAL_SETTINGS() {
          return {
              IS_ENABLED_LINE_BREAKS: 'enableLineBreaks',
              IS_INLINE: 'isInline',
              TITLE: 'title',
              SHORTCUT: 'shortcut',
              TOOLBOX: 'toolbox',
              SANITIZE_CONFIG: 'sanitize',
              CONVERSION_CONFIG: 'conversionConfig',
              IS_READ_ONLY_SUPPORTED: 'isReadOnlySupported',
          };
      }
      /**
       * Constant for available Tools settings provided by user
       *
       * return {object}
       */
      get USER_SETTINGS() {
          return {
              SHORTCUT: 'shortcut',
              TOOLBOX: 'toolbox',
              ENABLED_INLINE_TOOLS: 'inlineToolbar',
              CONFIG: 'config',
          };
      }
      /**
       * Creates instances via passed or default configuration
       *
       * @returns {Promise<void>}
       */
      prepare() {
          this.validateTools();
          /**
           * Assign internal tools
           */
          this.config.tools = deepMerge({}, this.internalTools, this.config.tools);
          if (!Object.prototype.hasOwnProperty.call(this.config, 'tools') || Object.keys(this.config.tools).length === 0) {
              throw Error('Can\'t start without tools');
          }
          /**
           * Save Tools settings to a map
           */
          for (const toolName in this.config.tools) {
              /**
               * If Tool is an object not a Tool's class then
               * save class and settings separately
               */
              if (typeof this.config.tools[toolName] === 'object') {
                  /**
                   * Save Tool's class from 'class' field
                   *
                   * @type {Tool}
                   */
                  this.toolsClasses[toolName] = this.config.tools[toolName].class;
                  /**
                   * Save Tool's settings
                   *
                   * @type {ToolSettings}
                   */
                  this.toolsSettings[toolName] = this.config.tools[toolName];
                  /**
                   * Remove Tool's class from settings
                   */
                  delete this.toolsSettings[toolName].class;
              }
              else {
                  /**
                   * Save Tool's class
                   *
                   * @type {Tool}
                   */
                  this.toolsClasses[toolName] = this.config.tools[toolName];
                  /**
                   * Set empty settings for Block by default
                   *
                   * @type {{}}
                   */
                  this.toolsSettings[toolName] = { class: this.config.tools[toolName] };
              }
          }
          /**
           * getting classes that has prepare method
           */
          const sequenceData = this.getListOfPrepareFunctions();
          /**
           * if sequence data contains nothing then resolve current chain and run other module prepare
           */
          if (sequenceData.length === 0) {
              return Promise.resolve();
          }
          /**
           * to see how it works {@link '../utils.ts#sequence'}
           */
          return sequence(sequenceData, (data) => {
              this.success(data);
          }, (data) => {
              this.fallback(data);
          });
      }
      /**
       * Success callback
       *
       * @param {object} data - append tool to available list
       */
      success(data) {
          this.toolsAvailable[data.toolName] = this.toolsClasses[data.toolName];
      }
      /**
       * Fail callback
       *
       * @param {object} data - append tool to unavailable list
       */
      fallback(data) {
          this.toolsUnavailable[data.toolName] = this.toolsClasses[data.toolName];
      }
      /**
       * Return Inline Tool's instance
       *
       * @param {InlineTool} tool - Inline Tool instance
       * @param {string} name - tool name
       * @param {ToolSettings} toolSettings - tool settings
       *
       * @returns {InlineTool} — instance
       */
      constructInline(tool, name, toolSettings = {}) {
          const constructorOptions = {
              api: this.Editor.API.getMethodsForTool(name),
              config: (toolSettings[this.USER_SETTINGS.CONFIG] || {}),
          };
          // eslint-disable-next-line new-cap
          return new tool(constructorOptions);
      }
      /**
       * Check if passed Tool is an instance of Default Block Tool
       *
       * @param {Tool} tool - Tool to check
       *
       * @returns {boolean}
       */
      isDefault(tool) {
          return tool instanceof this.available[this.config.defaultBlock];
      }
      /**
       * Return Tool's config by name
       *
       * @param {string} toolName - name of tool
       *
       * @returns {ToolSettings}
       */
      getToolSettings(toolName) {
          const settings = this.toolsSettings[toolName];
          const config = settings[this.USER_SETTINGS.CONFIG] || {};
          // Pass placeholder to default Block config
          if (toolName === this.config.defaultBlock && !config.placeholder) {
              config.placeholder = this.config.placeholder;
              settings[this.USER_SETTINGS.CONFIG] = config;
          }
          return settings;
      }
      /**
       * Returns internal tools
       * Includes Bold, Italic, Link and Paragraph
       */
      get internalTools() {
          return {
              bold: { class: BoldInlineTool },
              italic: { class: ItalicInlineTool },
              link: { class: LinkInlineTool },
              paragraph: {
                  class: Paragraph,
                  inlineToolbar: true,
              },
              stub: { class: Stub },
          };
      }
      /**
       * Returns true if tool supports read-only mode
       *
       * @param tool - tool to check
       */
      isReadOnlySupported(tool) {
          return tool[this.INTERNAL_SETTINGS.IS_READ_ONLY_SUPPORTED] === true;
      }
      /**
       * Calls each Tool reset method to clean up anything set by Tool
       */
      destroy() {
          Object.values(this.available).forEach((tool) => __awaiter(this, void 0, void 0, function* () {
              if (isFunction(tool.reset)) {
                  yield tool.reset();
              }
          }));
      }
      /**
       * Binds prepare function of plugins with user or default config
       *
       * @returns {Array} list of functions that needs to be fired sequentially
       */
      getListOfPrepareFunctions() {
          const toolPreparationList = [];
          for (const toolName in this.toolsClasses) {
              if (Object.prototype.hasOwnProperty.call(this.toolsClasses, toolName)) {
                  const toolClass = this.toolsClasses[toolName];
                  const toolConfig = this.toolsSettings[toolName][this.USER_SETTINGS.CONFIG];
                  /**
                   * If Tool hasn't a prepare method,
                   * still push it to tool preparation list to save tools order in Toolbox.
                   * As Tool's prepare method might be async, _.sequence util helps to save the order.
                   */
                  toolPreparationList.push({
                      // eslint-disable-next-line @typescript-eslint/no-empty-function
                      function: isFunction(toolClass.prepare) ? toolClass.prepare : () => { },
                      data: {
                          toolName,
                          config: toolConfig,
                      },
                  });
              }
          }
          return toolPreparationList;
      }
      /**
       * Validate Tools configuration objects and throw Error for user if it is invalid
       */
      validateTools() {
          /**
           * Check Tools for a class containing
           */
          for (const toolName in this.config.tools) {
              if (Object.prototype.hasOwnProperty.call(this.config.tools, toolName)) {
                  if (toolName in this.internalTools) {
                      return;
                  }
                  const tool = this.config.tools[toolName];
                  if (!isFunction(tool) && !isFunction(tool.class)) {
                      throw Error(`Tool «${toolName}» must be a constructor function or an object with function in the «class» property`);
                  }
              }
          }
      }
  }
  Tools.displayName = 'Tools';
  /**
   * What kind of plugins developers can create
   */
  var ToolType;
  (function (ToolType) {
      /**
       * Block tool
       */
      ToolType[ToolType["Block"] = 0] = "Block";
      /**
       * Inline tool
       */
      ToolType[ToolType["Inline"] = 1] = "Inline";
      /**
       * Block tune
       */
      ToolType[ToolType["Tune"] = 2] = "Tune";
  })(ToolType || (ToolType = {}));

  /**
   * Provides methods for working with i18n
   */
  class I18nAPI extends Module {
      /**
       * Return namespace section for tool or block tune
       *
       * @param toolName - name of tool. Used to provide dictionary only for this tool
       * @param toolType - 'block' for Block Tool, 'inline' for Inline Tool, 'tune' for Block Tunes
       */
      static getNamespace(toolName, toolType) {
          switch (toolType) {
              case ToolType.Block:
              case ToolType.Inline:
                  return `tools.${toolName}`;
              case ToolType.Tune:
                  return `blockTunes.${toolName}`;
          }
      }
      /**
       * Return I18n API methods with global dictionary access
       */
      get methods() {
          return {
              t: () => {
                  logLabeled('I18n.t() method can be accessed only from Tools', 'warn');
                  return undefined;
              },
          };
      }
      /**
       * Return I18n API methods with tool namespaced dictionary
       *
       * @param toolName - name of tool. Used to provide dictionary only for this tool
       * @param toolType - 'block' for Block Tool, 'inline' for Inline Tool, 'tune' for Block Tunes
       */
      getMethodsForTool(toolName, toolType) {
          return Object.assign(this.methods, {
              t: (dictKey) => {
                  return I18nConstructor.t(I18nAPI.getNamespace(toolName, toolType), dictKey);
              },
          });
      }
  }
  I18nAPI.displayName = 'I18nAPI';

  /**
   * @module API
   * @copyright <CodeX> 2018
   *
   * Each block has an Editor API instance to use provided public methods
   * if you cant to read more about how API works, please see docs
   */
  /**
   * @class API
   */
  class API extends Module {
      /**
       * Editor.js Core API modules
       */
      get methods() {
          return {
              blocks: this.Editor.BlocksAPI.methods,
              caret: this.Editor.CaretAPI.methods,
              events: this.Editor.EventsAPI.methods,
              listeners: this.Editor.ListenersAPI.methods,
              notifier: this.Editor.NotifierAPI.methods,
              sanitizer: this.Editor.SanitizerAPI.methods,
              saver: this.Editor.SaverAPI.methods,
              selection: this.Editor.SelectionAPI.methods,
              styles: this.Editor.StylesAPI.classes,
              toolbar: this.Editor.ToolbarAPI.methods,
              inlineToolbar: this.Editor.InlineToolbarAPI.methods,
              tooltip: this.Editor.TooltipAPI.methods,
              i18n: this.Editor.I18nAPI.methods,
              readOnly: this.Editor.ReadOnlyAPI.methods,
          };
      }
      /**
       * Returns Editor.js Core API methods for passed tool
       *
       * @param toolName - how user name tool. It can be used in some API logic,
       *                   for example in i18n to provide namespaced dictionary
       *
       * @param toolType - 'block' for Block Tool, 'inline' for Inline Tool, 'tune' for Block Tunes
       */
      getMethodsForTool(toolName, toolType = ToolType.Block) {
          return Object.assign(this.methods, {
              i18n: this.Editor.I18nAPI.getMethodsForTool(toolName, toolType),
          });
      }
  }
  API.displayName = 'API';

  /**
   * @class InlineToolbarAPI
   * Provides methods for working with the Inline Toolbar
   */
  class InlineToolbarAPI extends Module {
      /**
       * Available methods
       *
       * @returns {InlineToolbar}
       */
      get methods() {
          return {
              close: () => this.close(),
              open: () => this.open(),
          };
      }
      /**
       * Open Inline Toolbar
       */
      open() {
          this.Editor.InlineToolbar.tryToShow();
      }
      /**
       * Close Inline Toolbar
       */
      close() {
          this.Editor.InlineToolbar.close();
      }
  }
  InlineToolbarAPI.displayName = 'InlineToolbarAPI';

  /**
   * @class ListenersAPI
   * Provides with methods working with DOM Listener
   */
  class ListenersAPI extends Module {
      /**
       * Available methods
       *
       * @returns {Listeners}
       */
      get methods() {
          return {
              on: (element, eventType, handler, useCapture) => this.on(element, eventType, handler, useCapture),
              off: (element, eventType, handler, useCapture) => this.off(element, eventType, handler, useCapture),
          };
      }
      /**
       * adds DOM event listener
       *
       * @param {HTMLElement} element - Element to set handler to
       * @param {string} eventType - event type
       * @param {() => void} handler - event handler
       * @param {boolean} useCapture - capture event or not
       */
      on(element, eventType, handler, useCapture) {
          this.Editor.Listeners.on(element, eventType, handler, useCapture);
      }
      /**
       * Removes DOM listener from element
       *
       * @param {Element} element - Element to remove handler from
       * @param eventType - event type
       * @param handler - event handler
       * @param {boolean} useCapture - capture event or not
       */
      off(element, eventType, handler, useCapture) {
          this.Editor.Listeners.off(element, eventType, handler, useCapture);
      }
  }
  ListenersAPI.displayName = 'ListenersAPI';

  /**
   *
   */
  class NotifierAPI extends Module {
      /**
       * Available methods
       */
      get methods() {
          return {
              show: (options) => this.show(options),
          };
      }
      /**
       * Show notification
       *
       * @param {NotifierOptions} options - message option
       */
      show(options) {
          return this.Editor.Notifier.show(options);
      }
  }
  NotifierAPI.displayName = 'NotifierAPI';

  /**
   * @class ReadOnlyAPI
   * @classdesc ReadOnly API
   */
  class ReadOnlyAPI extends Module {
      /**
       * Available methods
       */
      get methods() {
          return {
              toggle: (state) => this.toggle(state),
          };
      }
      /**
       * Set or toggle read-only state
       *
       * @param {boolean|undefined} state - set or toggle state
       *
       * @returns {boolean} current value
       */
      toggle(state) {
          return this.Editor.ReadOnly.toggle(state);
      }
  }
  ReadOnlyAPI.displayName = 'ReadOnlyAPI';

  /**
   * @class SanitizerAPI
   * Provides Editor.js Sanitizer that allows developers to clean their HTML
   */
  class SanitizerAPI extends Module {
      /**
       * Available methods
       *
       * @returns {Sanitizer}
       */
      get methods() {
          return {
              clean: (taintString, config) => this.clean(taintString, config),
          };
      }
      /**
       * Perform sanitizing of a string
       *
       * @param {string} taintString - what to sanitize
       * @param {SanitizerConfig} config - sanitizer config
       *
       * @returns {string}
       */
      clean(taintString, config) {
          return this.Editor.Sanitizer.clean(taintString, config);
      }
  }
  SanitizerAPI.displayName = 'SanitizerAPI';

  /**
   * @class SaverAPI
   * provides with methods to save data
   */
  class SaverAPI extends Module {
      /**
       * Available methods
       *
       * @returns {Saver}
       */
      get methods() {
          return {
              save: () => this.save(),
          };
      }
      /**
       * Return Editor's data
       *
       * @returns {OutputData}
       */
      save() {
          const errorText = 'Editor\'s content can not be saved in read-only mode';
          if (this.Editor.ReadOnly.isEnabled) {
              logLabeled(errorText, 'warn');
              return Promise.reject(new Error(errorText));
          }
          return this.Editor.Saver.save();
      }
  }
  SaverAPI.displayName = 'SaverAPI';

  /**
   * @class SelectionAPI
   * Provides with methods working with SelectionUtils
   */
  class SelectionAPI extends Module {
      /**
       * Available methods
       *
       * @returns {SelectionAPIInterface}
       */
      get methods() {
          return {
              findParentTag: (tagName, className) => this.findParentTag(tagName, className),
              expandToTag: (node) => this.expandToTag(node),
          };
      }
      /**
       * Looks ahead from selection and find passed tag with class name
       *
       * @param {string} tagName - tag to find
       * @param {string} className - tag's class name
       *
       * @returns {HTMLElement|null}
       */
      findParentTag(tagName, className) {
          return new SelectionUtils().findParentTag(tagName, className);
      }
      /**
       * Expand selection to passed tag
       *
       * @param {HTMLElement} node - tag that should contain selection
       */
      expandToTag(node) {
          new SelectionUtils().expandToTag(node);
      }
  }
  SelectionAPI.displayName = 'SelectionAPI';

  /**
   *
   */
  class StylesAPI extends Module {
      /**
       * Exported classes
       */
      get classes() {
          return {
              /**
               * Base Block styles
               */
              block: 'cdx-block',
              /**
               * Inline Tools styles
               */
              inlineToolButton: 'ce-inline-tool',
              inlineToolButtonActive: 'ce-inline-tool--active',
              /**
               * UI elements
               */
              input: 'cdx-input',
              loader: 'cdx-loader',
              button: 'cdx-button',
              /**
               * Settings styles
               */
              settingsButton: 'cdx-settings-button',
              settingsButtonActive: 'cdx-settings-button--active',
          };
      }
  }
  StylesAPI.displayName = 'StylesAPI';

  /**
   * @class ToolbarAPI
   * Provides methods for working with the Toolbar
   */
  class ToolbarAPI extends Module {
      /**
       * Available methods
       *
       * @returns {Toolbar}
       */
      get methods() {
          return {
              close: () => this.close(),
              open: () => this.open(),
          };
      }
      /**
       * Open toolbar
       */
      open() {
          this.Editor.Toolbar.open();
      }
      /**
       * Close toolbar and all included elements
       */
      close() {
          this.Editor.Toolbar.close();
      }
  }
  ToolbarAPI.displayName = 'ToolbarAPI';

  /**
   * @class TooltipAPI
   * @classdesc Tooltip API
   */
  class TooltipAPI extends Module {
      /**
       * Available methods
       */
      get methods() {
          return {
              show: (element, content, options) => this.show(element, content, options),
              hide: () => this.hide(),
              onHover: (element, content, options) => this.onHover(element, content, options),
          };
      }
      /**
       * Method show tooltip on element with passed HTML content
       *
       * @param {HTMLElement} element - element on which tooltip should be shown
       * @param {TooltipContent} content - tooltip content
       * @param {TooltipOptions} options - tooltip options
       */
      show(element, content, options) {
          this.Editor.Tooltip.show(element, content, options);
      }
      /**
       * Method hides tooltip on HTML page
       */
      hide() {
          this.Editor.Tooltip.hide();
      }
      /**
       * Decorator for showing Tooltip by mouseenter/mouseleave
       *
       * @param {HTMLElement} element - element on which tooltip should be shown
       * @param {TooltipContent} content - tooltip content
       * @param {TooltipOptions} options - tooltip options
       */
      onHover(element, content, options) {
          this.Editor.Tooltip.onHover(element, content, options);
      }
  }
  TooltipAPI.displayName = 'TooltipAPI';

  const APIModules = [
      BlocksAPI, CaretAPI, EventsAPI, I18nAPI, API, InlineToolbarAPI, ListenersAPI, NotifierAPI, ReadOnlyAPI, SanitizerAPI, SaverAPI, SelectionAPI, StylesAPI, ToolbarAPI, TooltipAPI
  ];

  /**
   * Iterator above passed Elements list.
   * Each next or previous action adds provides CSS-class and sets cursor to this item
   */
  class DomIterator {
      /**
       * @param {HTMLElement[]} nodeList — the list of iterable HTML-items
       * @param {string} focusedCssClass - user-provided CSS-class that will be set in flipping process
       */
      constructor(nodeList, focusedCssClass) {
          /**
           * Focused button index.
           * Default is -1 which means nothing is active
           *
           * @type {number}
           */
          this.cursor = -1;
          /**
           * Items to flip
           */
          this.items = [];
          this.items = nodeList || [];
          this.focusedCssClass = focusedCssClass;
      }
      /**
       * Returns Focused button Node
       *
       * @returns {HTMLElement}
       */
      get currentItem() {
          if (this.cursor === -1) {
              return null;
          }
          return this.items[this.cursor];
      }
      /**
       * Sets items. Can be used when iterable items changed dynamically
       *
       * @param {HTMLElement[]} nodeList - nodes to iterate
       */
      setItems(nodeList) {
          this.items = nodeList;
      }
      /**
       * Sets cursor next to the current
       */
      next() {
          this.cursor = this.leafNodesAndReturnIndex(DomIterator.directions.RIGHT);
      }
      /**
       * Sets cursor before current
       */
      previous() {
          this.cursor = this.leafNodesAndReturnIndex(DomIterator.directions.LEFT);
      }
      /**
       * Sets cursor to the default position and removes CSS-class from previously focused item
       */
      dropCursor() {
          if (this.cursor === -1) {
              return;
          }
          this.items[this.cursor].classList.remove(this.focusedCssClass);
          this.cursor = -1;
      }
      /**
       * Leafs nodes inside the target list from active element
       *
       * @param {string} direction - leaf direction. Can be 'left' or 'right'
       * @returns {number} index of focused node
       */
      leafNodesAndReturnIndex(direction) {
          /**
           * if items are empty then there is nothing to leaf
           */
          if (this.items.length === 0) {
              return this.cursor;
          }
          let focusedButtonIndex = this.cursor;
          /**
           * If activeButtonIndex === -1 then we have no chosen Tool in Toolbox
           */
          if (focusedButtonIndex === -1) {
              /**
               * Normalize "previous" Tool index depending on direction.
               * We need to do this to highlight "first" Tool correctly
               *
               * Order of Tools: [0] [1] ... [n - 1]
               *   [0 = n] because of: n % n = 0 % n
               *
               * Direction 'right': for [0] the [n - 1] is a previous index
               *   [n - 1] -> [0]
               *
               * Direction 'left': for [n - 1] the [0] is a previous index
               *   [n - 1] <- [0]
               *
               * @type {number}
               */
              focusedButtonIndex = direction === DomIterator.directions.RIGHT ? -1 : 0;
          }
          else {
              /**
               * If we have chosen Tool then remove highlighting
               */
              this.items[focusedButtonIndex].classList.remove(this.focusedCssClass);
          }
          /**
           * Count index for next Tool
           */
          if (direction === DomIterator.directions.RIGHT) {
              /**
               * If we go right then choose next (+1) Tool
               *
               * @type {number}
               */
              focusedButtonIndex = (focusedButtonIndex + 1) % this.items.length;
          }
          else {
              /**
               * If we go left then choose previous (-1) Tool
               * Before counting module we need to add length before because of "The JavaScript Modulo Bug"
               *
               * @type {number}
               */
              focusedButtonIndex = (this.items.length + focusedButtonIndex - 1) % this.items.length;
          }
          if (Dom.canSetCaret(this.items[focusedButtonIndex])) {
              /**
               * Focus input with micro-delay to ensure DOM is updated
               */
              delay(() => SelectionUtils.setCursor(this.items[focusedButtonIndex]), 50)();
          }
          /**
           * Highlight new chosen Tool
           */
          this.items[focusedButtonIndex].classList.add(this.focusedCssClass);
          /**
           * Return focused button's index
           */
          return focusedButtonIndex;
      }
  }
  /**
   * This is a static property that defines iteration directions
   *
   * @type {{RIGHT: string, LEFT: string}}
   */
  DomIterator.directions = {
      RIGHT: 'right',
      LEFT: 'left',
  };

  /**
   * Flipper is a component that iterates passed items array by TAB or Arrows and clicks it by ENTER
   */
  class Flipper {
      /**
       * @param {FlipperOptions} options - different constructing settings
       */
      constructor(options) {
          /**
           * Instance of flipper iterator
           *
           * @type {DomIterator|null}
           */
          this.iterator = null;
          /**
           * Flag that defines activation status
           *
           * @type {boolean}
           */
          this.activated = false;
          /**
           * Flag that allows arrows usage to flip items
           *
           * @type {boolean}
           */
          this.allowArrows = true;
          /**
           * KeyDown event handler
           *
           * @param event - keydown event
           */
          this.onKeyDown = (event) => {
              const isReady = this.isEventReadyForHandling(event);
              if (!isReady) {
                  return;
              }
              /**
               * Prevent only used keys default behaviour
               * (allows to navigate by ARROW DOWN, for example)
               */
              if (Flipper.usedKeys.includes(event.keyCode)) {
                  event.preventDefault();
              }
              switch (event.keyCode) {
                  case keyCodes.TAB:
                      this.handleTabPress(event);
                      break;
                  case keyCodes.LEFT:
                  case keyCodes.UP:
                      this.flipLeft();
                      break;
                  case keyCodes.RIGHT:
                  case keyCodes.DOWN:
                      this.flipRight();
                      break;
                  case keyCodes.ENTER:
                      this.handleEnterPress(event);
                      break;
              }
          };
          this.allowArrows = typeof options.allowArrows === 'boolean' ? options.allowArrows : true;
          this.iterator = new DomIterator(options.items, options.focusedItemClass);
          this.activateCallback = options.activateCallback;
      }
      /**
       * Array of keys (codes) that is handled by Flipper
       * Used to:
       *  - preventDefault only for this keys, not all keydowns (@see constructor)
       *  - to skip external behaviours only for these keys, when filler is activated (@see BlockEvents@arrowRightAndDown)
       */
      static get usedKeys() {
          return [
              keyCodes.TAB,
              keyCodes.LEFT,
              keyCodes.RIGHT,
              keyCodes.ENTER,
              keyCodes.UP,
              keyCodes.DOWN,
          ];
      }
      /**
       * Active tab/arrows handling by flipper
       *
       * @param {HTMLElement[]} items - Some modules (like, InlineToolbar, BlockSettings) might refresh buttons dynamically
       */
      activate(items) {
          this.activated = true;
          if (items) {
              this.iterator.setItems(items);
          }
          /**
           * Listening all keydowns on document and react on TAB/Enter press
           * TAB will leaf iterator items
           * ENTER will click the focused item
           */
          document.addEventListener('keydown', this.onKeyDown);
      }
      /**
       * Disable tab/arrows handling by flipper
       */
      deactivate() {
          this.activated = false;
          this.dropCursor();
          document.removeEventListener('keydown', this.onKeyDown);
      }
      /**
       * Return current focused button
       *
       * @returns {HTMLElement|null}
       */
      get currentItem() {
          return this.iterator.currentItem;
      }
      /**
       * Focus first item
       */
      focusFirst() {
          this.dropCursor();
          this.flipRight();
      }
      /**
       * Focuses previous flipper iterator item
       */
      flipLeft() {
          this.iterator.previous();
      }
      /**
       * Focuses next flipper iterator item
       */
      flipRight() {
          this.iterator.next();
      }
      /**
       * Drops flipper's iterator cursor
       *
       * @see DomIterator#dropCursor
       */
      dropCursor() {
          this.iterator.dropCursor();
      }
      /**
       * This function is fired before handling flipper keycodes
       * The result of this function defines if it is need to be handled or not
       *
       * @param {KeyboardEvent} event - keydown keyboard event
       * @returns {boolean}
       */
      isEventReadyForHandling(event) {
          const handlingKeyCodeList = [
              keyCodes.TAB,
              keyCodes.ENTER,
          ];
          const isCurrentItemIsFocusedInput = this.iterator.currentItem == document.activeElement;
          if (this.allowArrows && !isCurrentItemIsFocusedInput) {
              handlingKeyCodeList.push(keyCodes.LEFT, keyCodes.RIGHT, keyCodes.UP, keyCodes.DOWN);
          }
          return this.activated && handlingKeyCodeList.indexOf(event.keyCode) !== -1;
      }
      /**
       * When flipper is activated tab press will leaf the items
       *
       * @param {KeyboardEvent} event - tab keydown event
       */
      handleTabPress(event) {
          /** this property defines leaf direction */
          const shiftKey = event.shiftKey, direction = shiftKey ? DomIterator.directions.LEFT : DomIterator.directions.RIGHT;
          switch (direction) {
              case DomIterator.directions.RIGHT:
                  this.flipRight();
                  break;
              case DomIterator.directions.LEFT:
                  this.flipLeft();
                  break;
          }
      }
      /**
       * Enter press will click current item if flipper is activated
       *
       * @param {KeyboardEvent} event - enter keydown event
       */
      handleEnterPress(event) {
          if (!this.activated) {
              return;
          }
          if (this.iterator.currentItem) {
              this.iterator.currentItem.click();
          }
          if (isFunction(this.activateCallback)) {
              this.activateCallback(this.iterator.currentItem);
          }
          event.preventDefault();
          event.stopPropagation();
      }
  }

  /**
   * Block Settings
   *
   *   ____ Settings Panel ____
   *  | ...................... |
   *  | .   Tool Settings    . |
   *  | ...................... |
   *  | .  Default Settings  . |
   *  | ...................... |
   *  |________________________|
   */
  class BlockSettings extends Module {
      constructor() {
          super(...arguments);
          /**
           * List of buttons
           */
          this.buttons = [];
          /**
           * Instance of class that responses for leafing buttons by arrows/tab
           *
           * @type {Flipper|null}
           */
          this.flipper = null;
          /**
           * Page selection utils
           */
          this.selection = new SelectionUtils();
      }
      /**
       * Module Events
       *
       * @returns {{opened: string, closed: string}}
       */
      get events() {
          return {
              opened: 'block-settings-opened',
              closed: 'block-settings-closed',
          };
      }
      /**
       * Block Settings CSS
       *
       * @returns {{wrapper, wrapperOpened, toolSettings, defaultSettings, button}}
       */
      get CSS() {
          return {
              // Settings Panel
              wrapper: 'ce-settings',
              wrapperOpened: 'ce-settings--opened',
              toolSettings: 'ce-settings__plugin-zone',
              defaultSettings: 'ce-settings__default-zone',
              button: 'ce-settings__button',
              focusedButton: 'ce-settings__button--focused',
              focusedButtonAnimated: 'ce-settings__button--focused-animated',
          };
      }
      /**
       * Is Block Settings opened or not
       *
       * @returns {boolean}
       */
      get opened() {
          return this.nodes.wrapper.classList.contains(this.CSS.wrapperOpened);
      }
      /**
       * Panel with block settings with 2 sections:
       *  - Tool's Settings
       *  - Default Settings [Move, Remove, etc]
       */
      make() {
          this.nodes.wrapper = Dom.make('div', this.CSS.wrapper);
          this.nodes.toolSettings = Dom.make('div', this.CSS.toolSettings);
          this.nodes.defaultSettings = Dom.make('div', this.CSS.defaultSettings);
          Dom.append(this.nodes.wrapper, [this.nodes.toolSettings, this.nodes.defaultSettings]);
          /**
           * Active leafing by arrows/tab
           * Buttons will be filled on opening
           */
          this.enableFlipper();
      }
      /**
       * Destroys module
       */
      destroy() {
          /**
           * Sometimes (in read-only mode) there is no Flipper
           */
          if (this.flipper) {
              this.flipper.deactivate();
              this.flipper = null;
          }
          this.removeAllNodes();
      }
      /**
       * Open Block Settings pane
       */
      open() {
          this.nodes.wrapper.classList.add(this.CSS.wrapperOpened);
          /**
           * If block settings contains any inputs, focus will be set there,
           * so we need to save current selection to restore it after block settings is closed
           */
          this.selection.save();
          /**
           * Highlight content of a Block we are working with
           */
          this.Editor.BlockManager.currentBlock.selected = true;
          this.Editor.BlockSelection.clearCache();
          /**
           * Fill Tool's settings
           */
          this.addToolSettings();
          /**
           * Add default settings that presents for all Blocks
           */
          this.addDefaultSettings();
          /** Tell to subscribers that block settings is opened */
          this.Editor.Events.emit(this.events.opened);
          this.flipper.activate(this.blockTunesButtons);
      }
      /**
       * Close Block Settings pane
       */
      close() {
          this.nodes.wrapper.classList.remove(this.CSS.wrapperOpened);
          /**
           * If selection is at editor on Block Settings closing,
           * it means that caret placed at some editable element inside the Block Settings.
           * Previously we have saved the selection, then open the Block Settings and set caret to the input
           *
           * So, we need to restore selection back to Block after closing the Block Settings
           */
          if (!SelectionUtils.isAtEditor) {
              this.selection.restore();
          }
          this.selection.clearSaved();
          /** Clear settings */
          this.nodes.toolSettings.innerHTML = '';
          this.nodes.defaultSettings.innerHTML = '';
          /** Tell to subscribers that block settings is closed */
          this.Editor.Events.emit(this.events.closed);
          /** Clear cached buttons */
          this.buttons = [];
          /** Clear focus on active button */
          this.flipper.deactivate();
      }
      /**
       * Returns Tools Settings and Default Settings
       *
       * @returns {HTMLElement[]}
       */
      get blockTunesButtons() {
          const { StylesAPI } = this.Editor;
          /**
           * Return from cache
           * if exists
           */
          if (this.buttons.length !== 0) {
              return this.buttons;
          }
          const toolSettings = this.nodes.toolSettings.querySelectorAll(
          // Select buttons and inputs
          `.${StylesAPI.classes.settingsButton}, ${Dom.allInputsSelector}`);
          const defaultSettings = this.nodes.defaultSettings.querySelectorAll(`.${this.CSS.button}`);
          toolSettings.forEach((item) => {
              this.buttons.push(item);
          });
          defaultSettings.forEach((item) => {
              this.buttons.push(item);
          });
          return this.buttons;
      }
      /**
       * Add Tool's settings
       */
      addToolSettings() {
          if (isFunction(this.Editor.BlockManager.currentBlock.tool.renderSettings)) {
              Dom.append(this.nodes.toolSettings, this.Editor.BlockManager.currentBlock.tool.renderSettings());
          }
      }
      /**
       * Add default settings
       */
      addDefaultSettings() {
          Dom.append(this.nodes.defaultSettings, this.Editor.BlockManager.currentBlock.renderTunes());
      }
      /**
       * Active leafing by arrows/tab
       * Buttons will be filled on opening
       */
      enableFlipper() {
          this.flipper = new Flipper({
              focusedItemClass: this.CSS.focusedButton,
              /**
               * @param {HTMLElement} focusedItem - activated Tune
               */
              activateCallback: (focusedItem) => {
                  /**
                   * If focused item is editable element, close block settings
                   */
                  if (focusedItem && Dom.canSetCaret(focusedItem)) {
                      this.close();
                      return;
                  }
                  /**
                   * Restoring focus on current Block after settings clicked.
                   * For example, when H3 changed to H2 — DOM Elements replaced, so we need to focus a new one
                   */
                  delay(() => {
                      this.Editor.Caret.setToBlock(this.Editor.BlockManager.currentBlock);
                  }, 50)();
              },
          });
      }
  }
  BlockSettings.displayName = 'BlockSettings';

  /**
   * Evaluate messages dictionary and return object for namespace chaining
   *
   * @param dict - Messages dictionary
   * @param [keyPath] - subsection path (used in recursive call)
   */
  function getNamespaces(dict, keyPath) {
      const result = {};
      Object.entries(dict).forEach(([key, section]) => {
          if (typeOf(section) === 'object') {
              const newPath = keyPath ? `${keyPath}.${key}` : key;
              /**
               * Check current section values, if all of them are strings, so there is the last section
               */
              const isLastSection = Object.values(section).every((sectionValue) => {
                  return typeOf(sectionValue) === 'string';
              });
              /**
               * In last section, we substitute namespace path instead of object with translates
               *
               * ui.toolbar.toolbox – "ui.toolbar.toolbox"
               * instead of
               * ui.toolbar.toolbox – {"Add": ""}
               */
              if (isLastSection) {
                  result[key] = newPath;
              }
              else {
                  result[key] = getNamespaces(section, newPath);
              }
              return;
          }
          result[key] = section;
      });
      return result;
  }
  /**
   * Type safe access to the internal messages dictionary sections
   *
   * @example I18n.ui(I18nInternalNS.ui.blockTunes.toggler, 'Click to tune');
   */
  const I18nInternalNS = getNamespaces(defaultDictionary);

  /**
   * Block Converter
   */
  class ConversionToolbar extends Module {
      constructor() {
          super(...arguments);
          /**
           * Conversion Toolbar open/close state
           *
           * @type {boolean}
           */
          this.opened = false;
          /**
           * Available tools
           */
          this.tools = {};
          /**
           * Instance of class that responses for leafing buttons by arrows/tab
           *
           * @type {Flipper|null}
           */
          this.flipper = null;
          /**
           * Callback that fill be fired on open/close and accepts an opening state
           */
          this.togglingCallback = null;
      }
      /**
       * CSS getter
       */
      static get CSS() {
          return {
              conversionToolbarWrapper: 'ce-conversion-toolbar',
              conversionToolbarShowed: 'ce-conversion-toolbar--showed',
              conversionToolbarTools: 'ce-conversion-toolbar__tools',
              conversionToolbarLabel: 'ce-conversion-toolbar__label',
              conversionTool: 'ce-conversion-tool',
              conversionToolHidden: 'ce-conversion-tool--hidden',
              conversionToolIcon: 'ce-conversion-tool__icon',
              conversionToolFocused: 'ce-conversion-tool--focused',
              conversionToolActive: 'ce-conversion-tool--active',
          };
      }
      /**
       * Create UI of Conversion Toolbar
       */
      make() {
          this.nodes.wrapper = Dom.make('div', [
              ConversionToolbar.CSS.conversionToolbarWrapper,
              ...(this.isRtl ? [this.Editor.UI.CSS.editorRtlFix] : []),
          ]);
          this.nodes.tools = Dom.make('div', ConversionToolbar.CSS.conversionToolbarTools);
          const label = Dom.make('div', ConversionToolbar.CSS.conversionToolbarLabel, {
              textContent: I18nConstructor.ui(I18nInternalNS.ui.inlineToolbar.converter, 'Convert to'),
          });
          /**
           * Add Tools that has 'import' method
           */
          this.addTools();
          /**
           * Prepare Flipper to be able to leaf tools by arrows/tab
           */
          this.enableFlipper();
          Dom.append(this.nodes.wrapper, label);
          Dom.append(this.nodes.wrapper, this.nodes.tools);
          return this.nodes.wrapper;
      }
      /**
       * Deactivates flipper and removes all nodes
       */
      destroy() {
          /**
           * Sometimes (in read-only mode) there is no Flipper
           */
          if (this.flipper) {
              this.flipper.deactivate();
              this.flipper = null;
          }
          this.removeAllNodes();
      }
      /**
       * Toggle conversion dropdown visibility
       *
       * @param {Function} [togglingCallback] — callback that will accept opening state
       */
      toggle(togglingCallback) {
          if (!this.opened) {
              this.open();
          }
          else {
              this.close();
          }
          if (isFunction(togglingCallback)) {
              this.togglingCallback = togglingCallback;
          }
      }
      /**
       * Shows Conversion Toolbar
       */
      open() {
          this.filterTools();
          this.opened = true;
          this.nodes.wrapper.classList.add(ConversionToolbar.CSS.conversionToolbarShowed);
          /**
           * We use timeout to prevent bubbling Enter keydown on first dropdown item
           * Conversion flipper will be activated after dropdown will open
           */
          setTimeout(() => {
              this.flipper.activate(Object.values(this.tools).filter((button) => {
                  return !button.classList.contains(ConversionToolbar.CSS.conversionToolHidden);
              }));
              this.flipper.focusFirst();
              if (isFunction(this.togglingCallback)) {
                  this.togglingCallback(true);
              }
          }, 50);
      }
      /**
       * Closes Conversion Toolbar
       */
      close() {
          this.opened = false;
          this.flipper.deactivate();
          this.nodes.wrapper.classList.remove(ConversionToolbar.CSS.conversionToolbarShowed);
          if (isFunction(this.togglingCallback)) {
              this.togglingCallback(false);
          }
      }
      /**
       * Returns true if it has more than one tool available for convert in
       */
      hasTools() {
          const tools = Object.keys(this.tools); // available tools in array representation
          return !(tools.length === 1 && tools.shift() === this.config.defaultBlock);
      }
      /**
       * Replaces one Block with another
       * For that Tools must provide import/export methods
       *
       * @param {string} replacingToolName - name of Tool which replaces current
       */
      replaceWithBlock(replacingToolName) {
          return __awaiter(this, void 0, void 0, function* () {
              /**
               * At first, we get current Block data
               *
               * @type {BlockToolConstructable}
               */
              const currentBlockClass = this.Editor.BlockManager.currentBlock.class;
              const currentBlockName = this.Editor.BlockManager.currentBlock.name;
              const savedBlock = yield this.Editor.BlockManager.currentBlock.save();
              const { INTERNAL_SETTINGS } = this.Editor.Tools;
              const blockData = savedBlock.data;
              /**
               * When current Block name is equals to the replacing tool Name,
               * than convert this Block back to the default Block
               */
              if (currentBlockName === replacingToolName) {
                  replacingToolName = this.config.defaultBlock;
              }
              /**
               * Getting a class of replacing Tool
               *
               * @type {BlockToolConstructable}
               */
              const replacingTool = this.Editor.Tools.toolsClasses[replacingToolName];
              /**
               * Export property can be:
               * 1) Function — Tool defines which data to return
               * 2) String — the name of saved property
               *
               * In both cases returning value must be a string
               */
              let exportData = '';
              const exportProp = currentBlockClass[INTERNAL_SETTINGS.CONVERSION_CONFIG].export;
              if (isFunction(exportProp)) {
                  exportData = exportProp(blockData);
              }
              else if (typeof exportProp === 'string') {
                  exportData = blockData[exportProp];
              }
              else {
                  log('Conversion «export» property must be a string or function. ' +
                      'String means key of saved data object to export. Function should export processed string to export.');
                  return;
              }
              /**
               * Clean exported data with replacing sanitizer config
               */
              const cleaned = this.Editor.Sanitizer.clean(exportData, replacingTool.sanitize);
              /**
               * «import» property can be Function or String
               * function — accept imported string and compose tool data object
               * string — the name of data field to import
               */
              let newBlockData = {};
              const importProp = replacingTool[INTERNAL_SETTINGS.CONVERSION_CONFIG].import;
              if (isFunction(importProp)) {
                  newBlockData = importProp(cleaned);
              }
              else if (typeof importProp === 'string') {
                  newBlockData[importProp] = cleaned;
              }
              else {
                  log('Conversion «import» property must be a string or function. ' +
                      'String means key of tool data to import. Function accepts a imported string and return composed tool data.');
                  return;
              }
              this.Editor.BlockManager.replace({
                  tool: replacingToolName,
                  data: newBlockData,
              });
              this.Editor.BlockSelection.clearSelection();
              this.close();
              this.Editor.InlineToolbar.close();
              delay(() => {
                  this.Editor.Caret.setToBlock(this.Editor.BlockManager.currentBlock);
              }, 10)();
          });
      }
      /**
       * Iterates existing Tools and inserts to the ConversionToolbar
       * if tools have ability to import
       */
      addTools() {
          const tools = this.Editor.Tools.blockTools;
          for (const toolName in tools) {
              if (!Object.prototype.hasOwnProperty.call(tools, toolName)) {
                  continue;
              }
              const internalSettings = this.Editor.Tools.INTERNAL_SETTINGS;
              const toolClass = tools[toolName];
              const toolToolboxSettings = toolClass[internalSettings.TOOLBOX];
              const conversionConfig = toolClass[internalSettings.CONVERSION_CONFIG];
              const userSettings = this.Editor.Tools.USER_SETTINGS;
              const userToolboxSettings = this.Editor.Tools.getToolSettings(toolName)[userSettings.TOOLBOX];
              const toolboxSettings = userToolboxSettings !== null && userToolboxSettings !== void 0 ? userToolboxSettings : toolToolboxSettings;
              /**
               * Skip tools that don't pass 'toolbox' property
               */
              if (isEmpty(toolboxSettings) || !toolboxSettings.icon) {
                  continue;
              }
              /**
               * Skip tools without «import» rule specified
               */
              if (!conversionConfig || !conversionConfig.import) {
                  continue;
              }
              this.addTool(toolName, toolboxSettings.icon, toolboxSettings.title);
          }
      }
      /**
       * Add tool to the Conversion Toolbar
       *
       * @param {string} toolName - name of Tool to add
       * @param {string} toolIcon - Tool icon
       * @param {string} title - button title
       */
      addTool(toolName, toolIcon, title) {
          const tool = Dom.make('div', [ConversionToolbar.CSS.conversionTool]);
          const icon = Dom.make('div', [ConversionToolbar.CSS.conversionToolIcon]);
          tool.dataset.tool = toolName;
          icon.innerHTML = toolIcon;
          Dom.append(tool, icon);
          Dom.append(tool, Dom.text(I18nConstructor.t(I18nInternalNS.toolNames, title || capitalize(toolName))));
          Dom.append(this.nodes.tools, tool);
          this.tools[toolName] = tool;
          this.Editor.Listeners.on(tool, 'click', () => __awaiter(this, void 0, void 0, function* () {
              yield this.replaceWithBlock(toolName);
          }));
      }
      /**
       * Hide current Tool and show others
       */
      filterTools() {
          const { currentBlock } = this.Editor.BlockManager;
          /**
           * Show previously hided
           */
          Object.entries(this.tools).forEach(([name, button]) => {
              button.hidden = false;
              button.classList.toggle(ConversionToolbar.CSS.conversionToolHidden, name === currentBlock.name);
          });
      }
      /**
       * Prepare Flipper to be able to leaf tools by arrows/tab
       */
      enableFlipper() {
          this.flipper = new Flipper({
              focusedItemClass: ConversionToolbar.CSS.conversionToolFocused,
          });
      }
  }
  ConversionToolbar.displayName = 'ConversionToolbar';

  /**
   *
   * «Toolbar» is the node that moves up/down over current block
   *
   *  ______________________________________ Toolbar ____________________________________________
   * |                                                                                           |
   * |  ..................... Content .........................................................  |
   * |  .                                                   ........ Block Actions ...........   |
   * |  .                                                   .        [Open Settings]         .   |
   * |  .  [Plus Button]  [Toolbox: {Tool1}, {Tool2}]       .                                .   |
   * |  .                                                   .        [Settings Panel]        .   |
   * |  .                                                   ..................................   |
   * |  .......................................................................................  |
   * |                                                                                           |
   * |___________________________________________________________________________________________|
   *
   *
   * Toolbox — its an Element contains tools buttons. Can be shown by Plus Button.
   *
   *  _______________ Toolbox _______________
   * |                                       |
   * | [Header] [Image] [List] [Quote] ...   |
   * |_______________________________________|
   *
   *
   * Settings Panel — is an Element with block settings:
   *
   *   ____ Settings Panel ____
   *  | ...................... |
   *  | .   Tool Settings    . |
   *  | ...................... |
   *  | .  Default Settings  . |
   *  | ...................... |
   *  |________________________|
   *
   *
   * @class
   * @classdesc Toolbar module
   *
   * @typedef {Toolbar} Toolbar
   * @property {object} nodes - Toolbar nodes
   * @property {Element} nodes.wrapper        - Toolbar main element
   * @property {Element} nodes.content        - Zone with Plus button and toolbox.
   * @property {Element} nodes.actions        - Zone with Block Settings and Remove Button
   * @property {Element} nodes.blockActionsButtons   - Zone with Block Buttons: [Settings]
   * @property {Element} nodes.plusButton     - Button that opens or closes Toolbox
   * @property {Element} nodes.toolbox        - Container for tools
   * @property {Element} nodes.settingsToggler - open/close Settings Panel button
   * @property {Element} nodes.settings          - Settings Panel
   * @property {Element} nodes.pluginSettings    - Plugin Settings section of Settings Panel
   * @property {Element} nodes.defaultSettings   - Default Settings section of Settings Panel
   */
  class Toolbar extends Module {
      /**
       * CSS styles
       *
       * @returns {object}
       */
      get CSS() {
          return {
              toolbar: 'ce-toolbar',
              content: 'ce-toolbar__content',
              actions: 'ce-toolbar__actions',
              actionsOpened: 'ce-toolbar__actions--opened',
              toolbarOpened: 'ce-toolbar--opened',
              // Content Zone
              plusButton: 'ce-toolbar__plus',
              plusButtonShortcut: 'ce-toolbar__plus-shortcut',
              plusButtonHidden: 'ce-toolbar__plus--hidden',
              // Actions Zone
              blockActionsButtons: 'ce-toolbar__actions-buttons',
              settingsToggler: 'ce-toolbar__settings-btn',
          };
      }
      /**
       * Returns the Toolbar opening state
       *
       * @returns {boolean}
       */
      get opened() {
          return this.nodes.wrapper.classList.contains(this.CSS.toolbarOpened);
      }
      /**
       * Plus Button public methods
       *
       * @returns {{hide: function(): void, show: function(): void}}
       */
      get plusButton() {
          return {
              hide: () => this.nodes.plusButton.classList.add(this.CSS.plusButtonHidden),
              show: () => {
                  if (this.Editor.Toolbox.isEmpty) {
                      return;
                  }
                  this.nodes.plusButton.classList.remove(this.CSS.plusButtonHidden);
              },
          };
      }
      /**
       * Block actions appearance manipulations
       *
       * @returns {{hide: function(): void, show: function(): void}}
       */
      get blockActions() {
          return {
              hide: () => {
                  this.nodes.actions.classList.remove(this.CSS.actionsOpened);
              },
              show: () => {
                  this.nodes.actions.classList.add(this.CSS.actionsOpened);
              },
          };
      }
      /**
       * Toggles read-only mode
       *
       * @param {boolean} readOnlyEnabled - read-only mode
       */
      toggleReadOnly(readOnlyEnabled) {
          if (!readOnlyEnabled) {
              this.drawUI();
              this.enableModuleBindings();
          }
          else {
              this.destroy();
              this.Editor.Toolbox.destroy();
              this.Editor.BlockSettings.destroy();
              this.disableModuleBindings();
          }
      }
      /**
       * Move Toolbar to the Current Block
       *
       * @param {boolean} forceClose - force close Toolbar Settings and Toolbar
       */
      move(forceClose = true) {
          if (forceClose) {
              /** Close Toolbox when we move toolbar */
              this.Editor.Toolbox.close();
              this.Editor.BlockSettings.close();
          }
          const currentBlock = this.Editor.BlockManager.currentBlock.holder;
          /**
           * If no one Block selected as a Current
           */
          if (!currentBlock) {
              return;
          }
          const { isMobile } = this.Editor.UI;
          const blockHeight = currentBlock.offsetHeight;
          let toolbarY = currentBlock.offsetTop;
          /**
           * 1) On desktop — Toolbar at the top of Block, Plus/Toolbox moved the center of Block
           * 2) On mobile — Toolbar at the bottom of Block
           */
          if (!isMobile) {
              const contentOffset = Math.floor(blockHeight / 2);
              this.nodes.plusButton.style.transform = `translate3d(0, calc(${contentOffset}px - 50%), 0)`;
              this.Editor.Toolbox.nodes.toolbox.style.transform = `translate3d(0, calc(${contentOffset}px - 50%), 0)`;
          }
          else {
              toolbarY += blockHeight;
          }
          /**
           * Move Toolbar to the Top coordinate of Block
           */
          this.nodes.wrapper.style.transform = `translate3D(0, ${Math.floor(toolbarY)}px, 0)`;
      }
      /**
       * Open Toolbar with Plus Button and Actions
       *
       * @param {boolean} withBlockActions - by default, Toolbar opens with Block Actions.
       *                                     This flag allows to open Toolbar without Actions.
       * @param {boolean} needToCloseToolbox - by default, Toolbar will be moved with opening
       *                                      (by click on Block, or by enter)
       *                                      with closing Toolbox and Block Settings
       *                                      This flag allows to open Toolbar with Toolbox
       */
      open(withBlockActions = true, needToCloseToolbox = true) {
          delay(() => {
              this.move(needToCloseToolbox);
              this.nodes.wrapper.classList.add(this.CSS.toolbarOpened);
              if (withBlockActions) {
                  this.blockActions.show();
              }
              else {
                  this.blockActions.hide();
              }
          }, 50)();
      }
      /**
       * Close the Toolbar
       */
      close() {
          this.nodes.wrapper.classList.remove(this.CSS.toolbarOpened);
          /** Close components */
          this.blockActions.hide();
          this.Editor.Toolbox.close();
          this.Editor.BlockSettings.close();
      }
      /**
       * Draws Toolbar elements
       */
      make() {
          this.nodes.wrapper = Dom.make('div', this.CSS.toolbar);
          /**
           * Make Content Zone and Actions Zone
           */
          ['content', 'actions'].forEach((el) => {
              this.nodes[el] = Dom.make('div', this.CSS[el]);
          });
          /**
           * Actions will be included to the toolbar content so we can align in to the right of the content
           */
          Dom.append(this.nodes.wrapper, this.nodes.content);
          Dom.append(this.nodes.content, this.nodes.actions);
          /**
           * Fill Content Zone:
           *  - Plus Button
           *  - Toolbox
           */
          this.nodes.plusButton = Dom.make('div', this.CSS.plusButton);
          Dom.append(this.nodes.plusButton, Dom.svg('plus', 14, 14));
          Dom.append(this.nodes.content, this.nodes.plusButton);
          this.readOnlyMutableListeners.on(this.nodes.plusButton, 'click', () => {
              this.plusButtonClicked();
          }, false);
          /**
           * Add events to show/hide tooltip for plus button
           */
          const tooltipContent = Dom.make('div');
          tooltipContent.appendChild(document.createTextNode(I18nConstructor.ui(I18nInternalNS.ui.toolbar.toolbox, 'Add')));
          tooltipContent.appendChild(Dom.make('div', this.CSS.plusButtonShortcut, {
              textContent: '⇥ Tab',
          }));
          this.Editor.Tooltip.onHover(this.nodes.plusButton, tooltipContent);
          /**
           * Fill Actions Zone:
           *  - Settings Toggler
           *  - Remove Block Button
           *  - Settings Panel
           */
          this.nodes.blockActionsButtons = Dom.make('div', this.CSS.blockActionsButtons);
          this.nodes.settingsToggler = Dom.make('span', this.CSS.settingsToggler);
          const settingsIcon = Dom.svg('dots', 8, 8);
          Dom.append(this.nodes.settingsToggler, settingsIcon);
          Dom.append(this.nodes.blockActionsButtons, this.nodes.settingsToggler);
          Dom.append(this.nodes.actions, this.nodes.blockActionsButtons);
          this.Editor.Tooltip.onHover(this.nodes.settingsToggler, I18nConstructor.ui(I18nInternalNS.ui.blockTunes.toggler, 'Click to tune'), {
              placement: 'top',
          });
          /**
           * Appending Toolbar components to itself
           */
          Dom.append(this.nodes.content, this.Editor.Toolbox.nodes.toolbox);
          Dom.append(this.nodes.actions, this.Editor.BlockSettings.nodes.wrapper);
          /**
           * Append toolbar to the Editor
           */
          Dom.append(this.Editor.UI.nodes.wrapper, this.nodes.wrapper);
      }
      /**
       * Handler for Plus Button
       */
      plusButtonClicked() {
          this.Editor.Toolbox.toggle();
      }
      /**
       * Enable bindings
       */
      enableModuleBindings() {
          /**
           * Settings toggler
           */
          this.readOnlyMutableListeners.on(this.nodes.settingsToggler, 'click', () => {
              this.settingsTogglerClicked();
          });
      }
      /**
       * Disable bindings
       */
      disableModuleBindings() {
          this.readOnlyMutableListeners.clearAll();
      }
      /**
       * Clicks on the Block Settings toggler
       */
      settingsTogglerClicked() {
          if (this.Editor.BlockSettings.opened) {
              this.Editor.BlockSettings.close();
          }
          else {
              this.Editor.BlockSettings.open();
          }
      }
      /**
       * Draws Toolbar UI
       *
       * Toolbar contains BlockSettings and Toolbox.
       * Thats why at first we draw its components and then Toolbar itself
       *
       * Steps:
       *  - Make Toolbar dependent components like BlockSettings, Toolbox and so on
       *  - Make itself and append dependent nodes to itself
       *
       */
      drawUI() {
          /**
           * Make BlockSettings Panel
           */
          this.Editor.BlockSettings.make();
          /**
           * Make Toolbox
           */
          this.Editor.Toolbox.make();
          /**
           * Make Toolbar
           */
          this.make();
      }
      /**
       * Removes all created and saved HTMLElements
       * It is used in Read-Only mode
       */
      destroy() {
          this.removeAllNodes();
      }
  }
  Toolbar.displayName = 'Toolbar';

  /**
   * @class MoveUpTune
   * @classdesc Editor's default tune that moves up selected block
   *
   * @copyright <CodeX Team> 2018
   */
  /**
   *
   */
  class MoveUpTune {
      /**
       * MoveUpTune constructor
       *
       * @param {API} api - Editor's API
       */
      constructor({ api }) {
          /**
           * Styles
           *
           * @type {{wrapper: string}}
           */
          this.CSS = {
              button: 'ce-settings__button',
              wrapper: 'ce-tune-move-up',
              animation: 'wobble',
          };
          this.api = api;
      }
      /**
       * Create "MoveUp" button and add click event listener
       *
       * @returns {HTMLElement}
       */
      render() {
          const moveUpButton = Dom.make('div', [this.CSS.button, this.CSS.wrapper], {});
          moveUpButton.appendChild(Dom.svg('arrow-up', 14, 14));
          this.api.listeners.on(moveUpButton, 'click', (event) => this.handleClick(event, moveUpButton), false);
          /**
           * Enable tooltip module on button
           */
          this.api.tooltip.onHover(moveUpButton, this.api.i18n.t('Move up'));
          return moveUpButton;
      }
      /**
       * Move current block up
       *
       * @param {MouseEvent} event - click event
       * @param {HTMLElement} button - clicked button
       */
      handleClick(event, button) {
          const currentBlockIndex = this.api.blocks.getCurrentBlockIndex();
          const currentBlock = this.api.blocks.getBlockByIndex(currentBlockIndex);
          const previousBlock = this.api.blocks.getBlockByIndex(currentBlockIndex - 1);
          if (currentBlockIndex === 0 || !currentBlock || !previousBlock) {
              button.classList.add(this.CSS.animation);
              window.setTimeout(() => {
                  button.classList.remove(this.CSS.animation);
              }, 500);
              return;
          }
          const currentBlockElement = currentBlock.holder;
          const previousBlockElement = previousBlock.holder;
          /**
           * Here is two cases:
           *  - when previous block has negative offset and part of it is visible on window, then we scroll
           *  by window's height and add offset which is mathematically difference between two blocks
           *
           *  - when previous block is visible and has offset from the window,
           *      than we scroll window to the difference between this offsets.
           */
          const currentBlockCoords = currentBlockElement.getBoundingClientRect(), previousBlockCoords = previousBlockElement.getBoundingClientRect();
          let scrollUpOffset;
          if (previousBlockCoords.top > 0) {
              scrollUpOffset = Math.abs(currentBlockCoords.top) - Math.abs(previousBlockCoords.top);
          }
          else {
              scrollUpOffset = window.innerHeight - Math.abs(currentBlockCoords.top) + Math.abs(previousBlockCoords.top);
          }
          window.scrollBy(0, -1 * scrollUpOffset);
          /** Change blocks positions */
          this.api.blocks.move(currentBlockIndex - 1);
          /** Hide the Tooltip */
          this.api.tooltip.hide();
      }
  }

  /**
   *
   */
  class DeleteTune {
      /**
       * DeleteTune constructor
       *
       * @param {API} api - Editor's API
       */
      constructor({ api }) {
          /**
           * Styles
           */
          this.CSS = {
              button: 'ce-settings__button',
              buttonDelete: 'ce-settings__button--delete',
              buttonConfirm: 'ce-settings__button--confirm',
          };
          /**
           * Tune nodes
           */
          this.nodes = {
              button: null,
          };
          this.api = api;
          this.resetConfirmation = () => {
              this.setConfirmation(false);
          };
      }
      /**
       * Create "Delete" button and add click event listener
       *
       * @returns {HTMLElement}
       */
      render() {
          this.nodes.button = Dom.make('div', [this.CSS.button, this.CSS.buttonDelete], {});
          this.nodes.button.appendChild(Dom.svg('cross', 12, 12));
          this.api.listeners.on(this.nodes.button, 'click', (event) => this.handleClick(event), false);
          /**
           * Enable tooltip module
           */
          this.api.tooltip.onHover(this.nodes.button, this.api.i18n.t('Delete'));
          return this.nodes.button;
      }
      /**
       * Delete block conditions passed
       *
       * @param {MouseEvent} event - click event
       */
      handleClick(event) {
          /**
           * if block is not waiting the confirmation, subscribe on block-settings-closing event to reset
           * otherwise delete block
           */
          if (!this.needConfirmation) {
              this.setConfirmation(true);
              /**
               * Subscribe on event.
               * When toolbar block settings is closed but block deletion is not confirmed,
               * then reset confirmation state
               */
              this.api.events.on('block-settings-closed', this.resetConfirmation);
          }
          else {
              /**
               * Unsubscribe from block-settings closing event
               */
              this.api.events.off('block-settings-closed', this.resetConfirmation);
              this.api.blocks.delete();
              this.api.toolbar.close();
              this.api.tooltip.hide();
              /**
               * Prevent firing ui~documentClicked that can drop currentBlock pointer
               */
              event.stopPropagation();
          }
      }
      /**
       * change tune state
       *
       * @param {boolean} state - delete confirmation state
       */
      setConfirmation(state) {
          this.needConfirmation = state;
          this.nodes.button.classList.add(this.CSS.buttonConfirm);
      }
  }

  /**
   * @class MoveDownTune
   * @classdesc Editor's default tune - Moves down highlighted block
   *
   * @copyright <CodeX Team> 2018
   */
  /**
   *
   */
  class MoveDownTune {
      /**
       * MoveDownTune constructor
       *
       * @param {API} api — Editor's API
       */
      constructor({ api }) {
          /**
           * Styles
           *
           * @type {{wrapper: string}}
           */
          this.CSS = {
              button: 'ce-settings__button',
              wrapper: 'ce-tune-move-down',
              animation: 'wobble',
          };
          this.api = api;
      }
      /**
       * Return 'move down' button
       *
       * @returns {HTMLElement}
       */
      render() {
          const moveDownButton = Dom.make('div', [this.CSS.button, this.CSS.wrapper], {});
          moveDownButton.appendChild(Dom.svg('arrow-down', 14, 14));
          this.api.listeners.on(moveDownButton, 'click', (event) => this.handleClick(event, moveDownButton), false);
          /**
           * Enable tooltip module on button
           */
          this.api.tooltip.onHover(moveDownButton, this.api.i18n.t('Move down'));
          return moveDownButton;
      }
      /**
       * Handle clicks on 'move down' button
       *
       * @param {MouseEvent} event - click event
       * @param {HTMLElement} button - clicked button
       */
      handleClick(event, button) {
          const currentBlockIndex = this.api.blocks.getCurrentBlockIndex();
          const nextBlock = this.api.blocks.getBlockByIndex(currentBlockIndex + 1);
          // If Block is last do nothing
          if (!nextBlock) {
              button.classList.add(this.CSS.animation);
              window.setTimeout(() => {
                  button.classList.remove(this.CSS.animation);
              }, 500);
              return;
          }
          const nextBlockElement = nextBlock.holder;
          const nextBlockCoords = nextBlockElement.getBoundingClientRect();
          let scrollOffset = Math.abs(window.innerHeight - nextBlockElement.offsetHeight);
          /**
           * Next block ends on screen.
           * Increment scroll by next block's height to save element onscreen-position
           */
          if (nextBlockCoords.top < window.innerHeight) {
              scrollOffset = window.scrollY + nextBlockElement.offsetHeight;
          }
          window.scrollTo(0, scrollOffset);
          /** Change blocks positions */
          this.api.blocks.move(currentBlockIndex + 1);
          /** Hide the Tooltip */
          this.api.tooltip.hide();
      }
  }

  /**
   * @class Block
   * @classdesc This class describes editor`s block, including block`s HTMLElement, data and tool
   *
   * @property {BlockTool} tool — current block tool (Paragraph, for example)
   * @property {object} CSS — block`s css classes
   *
   */
  /**
   * Available Block Tool API methods
   */
  var BlockToolAPI;
  (function (BlockToolAPI) {
      /**
       * @todo remove method in 3.0.0
       * @deprecated — use 'rendered' hook instead
       */
      BlockToolAPI["APPEND_CALLBACK"] = "appendCallback";
      BlockToolAPI["RENDERED"] = "rendered";
      BlockToolAPI["MOVED"] = "moved";
      BlockToolAPI["UPDATED"] = "updated";
      BlockToolAPI["REMOVED"] = "removed";
      BlockToolAPI["ON_PASTE"] = "onPaste";
  })(BlockToolAPI || (BlockToolAPI = {}));
  /**
   * @classdesc Abstract Block class that contains Block information, Tool name and Tool class instance
   *
   * @property {BlockTool} tool - Tool instance
   * @property {HTMLElement} holder - Div element that wraps block content with Tool's content. Has `ce-block` CSS class
   * @property {HTMLElement} pluginsContent - HTML content that returns by Tool's render function
   */
  class Block {
      /**
       * @param {object} options - block constructor options
       * @param {string} options.name - Tool name that passed on initialization
       * @param {BlockToolData} options.data - Tool's initial data
       * @param {BlockToolConstructable} options.Tool — Tool's class
       * @param {ToolSettings} options.settings - default tool's config
       * @param {Module} options.api - Editor API module for pass it to the Block Tunes
       * @param {boolean} options.readOnly - Read-Only flag
       */
      constructor({ name, data, Tool, settings, api, readOnly, }) {
          /**
           * Cached inputs
           *
           * @type {HTMLElement[]}
           */
          this.cachedInputs = [];
          /**
           * Focused input index
           *
           * @type {number}
           */
          this.inputIndex = 0;
          /**
           * Debounce Timer
           *
           * @type {number}
           */
          this.modificationDebounceTimer = 450;
          /**
           * Is fired when DOM mutation has been happened
           */
          this.didMutated = debounce(() => {
              /**
               * Drop cache
               */
              this.cachedInputs = [];
              /**
               * Update current input
               */
              this.updateCurrentInput();
              this.call(BlockToolAPI.UPDATED);
          }, this.modificationDebounceTimer);
          /**
           * Is fired when text input or contentEditable is focused
           */
          this.handleFocus = () => {
              /**
               * Drop cache
               */
              this.cachedInputs = [];
              /**
               * Update current input
               */
              this.updateCurrentInput();
          };
          this.name = name;
          this.class = Tool;
          this.settings = settings;
          this.config = settings.config || {};
          this.api = api;
          this.blockAPI = new BlockAPI(this);
          this.mutationObserver = new MutationObserver(this.didMutated);
          this.tool = new Tool({
              data,
              config: this.config,
              api: this.api.getMethodsForTool(name, ToolType.Block),
              block: this.blockAPI,
              readOnly,
          });
          this.holder = this.compose();
          /**
           * @type {BlockTune[]}
           */
          this.tunes = this.makeTunes();
      }
      /**
       * CSS classes for the Block
       *
       * @returns {{wrapper: string, content: string}}
       */
      static get CSS() {
          return {
              wrapper: 'ce-block',
              wrapperStretched: 'ce-block--stretched',
              content: 'ce-block__content',
              focused: 'ce-block--focused',
              selected: 'ce-block--selected',
              dropTarget: 'ce-block--drop-target',
          };
      }
      /**
       * Find and return all editable elements (contenteditables and native inputs) in the Tool HTML
       *
       * @returns {HTMLElement[]}
       */
      get inputs() {
          /**
           * Return from cache if existed
           */
          if (this.cachedInputs.length !== 0) {
              return this.cachedInputs;
          }
          const inputs = Dom.findAllInputs(this.holder);
          /**
           * If inputs amount was changed we need to check if input index is bigger then inputs array length
           */
          if (this.inputIndex > inputs.length - 1) {
              this.inputIndex = inputs.length - 1;
          }
          /**
           * Cache inputs
           */
          this.cachedInputs = inputs;
          return inputs;
      }
      /**
       * Return current Tool`s input
       *
       * @returns {HTMLElement}
       */
      get currentInput() {
          return this.inputs[this.inputIndex];
      }
      /**
       * Set input index to the passed element
       *
       * @param {HTMLElement | Node} element - HTML Element to set as current input
       */
      set currentInput(element) {
          const index = this.inputs.findIndex((input) => input === element || input.contains(element));
          if (index !== -1) {
              this.inputIndex = index;
          }
      }
      /**
       * Return first Tool`s input
       *
       * @returns {HTMLElement}
       */
      get firstInput() {
          return this.inputs[0];
      }
      /**
       * Return first Tool`s input
       *
       * @returns {HTMLElement}
       */
      get lastInput() {
          const inputs = this.inputs;
          return inputs[inputs.length - 1];
      }
      /**
       * Return next Tool`s input or undefined if it doesn't exist
       *
       * @returns {HTMLElement}
       */
      get nextInput() {
          return this.inputs[this.inputIndex + 1];
      }
      /**
       * Return previous Tool`s input or undefined if it doesn't exist
       *
       * @returns {HTMLElement}
       */
      get previousInput() {
          return this.inputs[this.inputIndex - 1];
      }
      /**
       * Get Block's JSON data
       *
       * @returns {object}
       */
      get data() {
          return this.save().then((savedObject) => {
              if (savedObject && !isEmpty(savedObject.data)) {
                  return savedObject.data;
              }
              else {
                  return {};
              }
          });
      }
      /**
       * Returns tool's sanitizer config
       *
       * @returns {object}
       */
      get sanitize() {
          return this.tool.sanitize;
      }
      /**
       * is block mergeable
       * We plugin have merge function then we call it mergable
       *
       * @returns {boolean}
       */
      get mergeable() {
          return isFunction(this.tool.merge);
      }
      /**
       * Check block for emptiness
       *
       * @returns {boolean}
       */
      get isEmpty() {
          const emptyText = Dom.isEmpty(this.pluginsContent);
          const emptyMedia = !this.hasMedia;
          return emptyText && emptyMedia;
      }
      /**
       * Check if block has a media content such as images, iframes and other
       *
       * @returns {boolean}
       */
      get hasMedia() {
          /**
           * This tags represents media-content
           *
           * @type {string[]}
           */
          const mediaTags = [
              'img',
              'iframe',
              'video',
              'audio',
              'source',
              'input',
              'textarea',
              'twitterwidget',
          ];
          return !!this.holder.querySelector(mediaTags.join(','));
      }
      /**
       * Set focused state
       *
       * @param {boolean} state - 'true' to select, 'false' to remove selection
       */
      set focused(state) {
          this.holder.classList.toggle(Block.CSS.focused, state);
      }
      /**
       * Get Block's focused state
       */
      get focused() {
          return this.holder.classList.contains(Block.CSS.focused);
      }
      /**
       * Set selected state
       * We don't need to mark Block as Selected when it is empty
       *
       * @param {boolean} state - 'true' to select, 'false' to remove selection
       */
      set selected(state) {
          if (state) {
              this.holder.classList.add(Block.CSS.selected);
          }
          else {
              this.holder.classList.remove(Block.CSS.selected);
          }
      }
      /**
       * Returns True if it is Selected
       *
       * @returns {boolean}
       */
      get selected() {
          return this.holder.classList.contains(Block.CSS.selected);
      }
      /**
       * Set stretched state
       *
       * @param {boolean} state - 'true' to enable, 'false' to disable stretched statte
       */
      set stretched(state) {
          this.holder.classList.toggle(Block.CSS.wrapperStretched, state);
      }
      /**
       * Return Block's stretched state
       *
       * @returns {boolean}
       */
      get stretched() {
          return this.holder.classList.contains(Block.CSS.wrapperStretched);
      }
      /**
       * Toggle drop target state
       *
       * @param {boolean} state - 'true' if block is drop target, false otherwise
       */
      set dropTarget(state) {
          this.holder.classList.toggle(Block.CSS.dropTarget, state);
      }
      /**
       * Returns Plugins content
       *
       * @returns {HTMLElement}
       */
      get pluginsContent() {
          const blockContentNodes = this.holder.querySelector(`.${Block.CSS.content}`);
          if (blockContentNodes && blockContentNodes.childNodes.length) {
              /**
               * Editors Block content can contain different Nodes from extensions
               * We use DOM isExtensionNode to ignore such Nodes and return first Block that does not match filtering list
               */
              for (let child = blockContentNodes.childNodes.length - 1; child >= 0; child--) {
                  const contentNode = blockContentNodes.childNodes[child];
                  if (!Dom.isExtensionNode(contentNode)) {
                      return contentNode;
                  }
              }
          }
          return null;
      }
      /**
       * Calls Tool's method
       *
       * Method checks tool property {MethodName}. Fires method with passes params If it is instance of Function
       *
       * @param {string} methodName - method to call
       * @param {object} params - method argument
       */
      call(methodName, params) {
          /**
           * call Tool's method with the instance context
           */
          if (this.tool[methodName] && this.tool[methodName] instanceof Function) {
              if (methodName === BlockToolAPI.APPEND_CALLBACK) {
                  log('`appendCallback` hook is deprecated and will be removed in the next major release. ' +
                      'Use `rendered` hook instead', 'warn');
              }
              try {
                  // eslint-disable-next-line no-useless-call
                  this.tool[methodName].call(this.tool, params);
              }
              catch (e) {
                  log(`Error during '${methodName}' call: ${e.message}`, 'error');
              }
          }
      }
      /**
       * Call plugins merge method
       *
       * @param {BlockToolData} data - data to merge
       */
      mergeWith(data) {
          return __awaiter(this, void 0, void 0, function* () {
              yield this.tool.merge(data);
          });
      }
      /**
       * Extracts data from Block
       * Groups Tool's save processing time
       *
       * @returns {object}
       */
      save() {
          return __awaiter(this, void 0, void 0, function* () {
              const extractedBlock = yield this.tool.save(this.pluginsContent);
              /**
               * Measuring execution time
               */
              const measuringStart = window.performance.now();
              let measuringEnd;
              return Promise.resolve(extractedBlock)
                  .then((finishedExtraction) => {
                  /** measure promise execution */
                  measuringEnd = window.performance.now();
                  return {
                      tool: this.name,
                      data: finishedExtraction,
                      time: measuringEnd - measuringStart,
                  };
              })
                  .catch((error) => {
                  log(`Saving proccess for ${this.name} tool failed due to the ${error}`, 'log', 'red');
              });
          });
      }
      /**
       * Uses Tool's validation method to check the correctness of output data
       * Tool's validation method is optional
       *
       * @description Method returns true|false whether data passed the validation or not
       *
       * @param {BlockToolData} data - data to validate
       * @returns {Promise<boolean>} valid
       */
      validate(data) {
          return __awaiter(this, void 0, void 0, function* () {
              let isValid = true;
              if (this.tool.validate instanceof Function) {
                  isValid = yield this.tool.validate(data);
              }
              return isValid;
          });
      }
      /**
       * Make an array with default settings
       * Each block has default tune instance that have states
       *
       * @returns {BlockTune[]}
       */
      makeTunes() {
          const tunesList = [
              {
                  name: 'moveUp',
                  Tune: MoveUpTune,
              },
              {
                  name: 'delete',
                  Tune: DeleteTune,
              },
              {
                  name: 'moveDown',
                  Tune: MoveDownTune,
              },
          ];
          // Pluck tunes list and return tune instances with passed Editor API and settings
          return tunesList.map(({ name, Tune }) => {
              return new Tune({
                  api: this.api.getMethodsForTool(name, ToolType.Tune),
                  settings: this.config,
              });
          });
      }
      /**
       * Enumerates initialized tunes and returns fragment that can be appended to the toolbars area
       *
       * @returns {DocumentFragment}
       */
      renderTunes() {
          const tunesElement = document.createDocumentFragment();
          this.tunes.forEach((tune) => {
              Dom.append(tunesElement, tune.render());
          });
          return tunesElement;
      }
      /**
       * Update current input index with selection anchor node
       */
      updateCurrentInput() {
          /**
           * If activeElement is native input, anchorNode points to its parent.
           * So if it is native input use it instead of anchorNode
           *
           * If anchorNode is undefined, also use activeElement
           */
          this.currentInput = Dom.isNativeInput(document.activeElement) || !SelectionUtils.anchorNode
              ? document.activeElement
              : SelectionUtils.anchorNode;
      }
      /**
       * Is fired when Block will be selected as current
       */
      willSelect() {
          /**
           * Observe DOM mutations to update Block inputs
           */
          this.mutationObserver.observe(this.holder.firstElementChild, {
              childList: true,
              subtree: true,
              characterData: true,
              attributes: true,
          });
          /**
           * Mutation observer doesn't track changes in "<input>" and "<textarea>"
           * so we need to track focus events to update current input and clear cache.
           */
          this.addInputEvents();
      }
      /**
       * Is fired when Block will be unselected
       */
      willUnselect() {
          this.mutationObserver.disconnect();
          this.removeInputEvents();
      }
      /**
       * Make default Block wrappers and put Tool`s content there
       *
       * @returns {HTMLDivElement}
       */
      compose() {
          const wrapper = Dom.make('div', Block.CSS.wrapper), contentNode = Dom.make('div', Block.CSS.content), pluginsContent = this.tool.render();
          contentNode.appendChild(pluginsContent);
          wrapper.appendChild(contentNode);
          return wrapper;
      }
      /**
       * Adds focus event listeners to all inputs and contentEditables
       */
      addInputEvents() {
          this.inputs.forEach(input => {
              input.addEventListener('focus', this.handleFocus);
          });
      }
      /**
       * removes focus event listeners from all inputs and contentEditables
       */
      removeInputEvents() {
          this.inputs.forEach(input => {
              input.removeEventListener('focus', this.handleFocus);
          });
      }
  }

  /**
   * @class Toolbox
   * @classdesc Holder for Tools
   *
   * @typedef {Toolbox} Toolbox
   * @property {boolean} opened - opening state
   * @property {object} nodes   - Toolbox nodes
   * @property {object} CSS     - CSS class names
   *
   */
  class Toolbox extends Module {
      constructor() {
          super(...arguments);
          /**
           * Current module HTML Elements
           */
          this.nodes = {
              toolbox: null,
              buttons: [],
          };
          /**
           * Opening state
           *
           * @type {boolean}
           */
          this.opened = false;
          /**
           * How many tools displayed in Toolbox
           *
           * @type {number}
           */
          this.displayedToolsCount = 0;
          /**
           * Instance of class that responses for leafing buttons by arrows/tab
           *
           * @type {Flipper|null}
           */
          this.flipper = null;
      }
      /**
       * CSS styles
       *
       * @returns {object.<string, string>}
       */
      get CSS() {
          return {
              toolbox: 'ce-toolbox',
              toolboxButton: 'ce-toolbox__button',
              toolboxButtonActive: 'ce-toolbox__button--active',
              toolboxOpened: 'ce-toolbox--opened',
              openedToolbarHolderModifier: 'codex-editor--toolbox-opened',
              buttonTooltip: 'ce-toolbox-button-tooltip',
              buttonShortcut: 'ce-toolbox-button-tooltip__shortcut',
          };
      }
      /**
       * Returns True if Toolbox is Empty and nothing to show
       *
       * @returns {boolean}
       */
      get isEmpty() {
          return this.displayedToolsCount === 0;
      }
      /**
       * Makes the Toolbox
       */
      make() {
          this.nodes.toolbox = Dom.make('div', this.CSS.toolbox);
          this.addTools();
          this.enableFlipper();
      }
      /**
       * Destroy Module
       */
      destroy() {
          /**
           * Sometimes (in read-only mode) there is no Flipper
           */
          if (this.flipper) {
              this.flipper.deactivate();
              this.flipper = null;
          }
          this.removeAllNodes();
          this.removeAllShortcuts();
      }
      /**
       * Toolbox Tool's button click handler
       *
       * @param {MouseEvent|KeyboardEvent} event - event that activates toolbox button
       * @param {string} toolName - button to activate
       */
      toolButtonActivate(event, toolName) {
          const tool = this.Editor.Tools.toolsClasses[toolName];
          this.insertNewBlock(tool, toolName);
      }
      /**
       * Open Toolbox with Tools
       */
      open() {
          if (this.isEmpty) {
              return;
          }
          this.Editor.UI.nodes.wrapper.classList.add(this.CSS.openedToolbarHolderModifier);
          this.nodes.toolbox.classList.add(this.CSS.toolboxOpened);
          this.opened = true;
          this.flipper.activate();
      }
      /**
       * Close Toolbox
       */
      close() {
          this.nodes.toolbox.classList.remove(this.CSS.toolboxOpened);
          this.Editor.UI.nodes.wrapper.classList.remove(this.CSS.openedToolbarHolderModifier);
          this.opened = false;
          this.flipper.deactivate();
      }
      /**
       * Close Toolbox
       */
      toggle() {
          if (!this.opened) {
              this.open();
          }
          else {
              this.close();
          }
      }
      /**
       * Iterates available tools and appends them to the Toolbox
       */
      addTools() {
          const tools = this.Editor.Tools.available;
          for (const toolName in tools) {
              if (Object.prototype.hasOwnProperty.call(tools, toolName)) {
                  this.addTool(toolName, tools[toolName]);
              }
          }
      }
      /**
       * Append Tool to the Toolbox
       *
       * @param {string} toolName - tool name
       * @param {BlockToolConstructable} tool - tool class
       */
      addTool(toolName, tool) {
          const internalSettings = this.Editor.Tools.INTERNAL_SETTINGS;
          const userSettings = this.Editor.Tools.USER_SETTINGS;
          const toolToolboxSettings = tool[internalSettings.TOOLBOX];
          /**
           * Skip tools that don't pass 'toolbox' property
           */
          if (isEmpty(toolToolboxSettings)) {
              return;
          }
          if (toolToolboxSettings && !toolToolboxSettings.icon) {
              log('Toolbar icon is missed. Tool %o skipped', 'warn', toolName);
              return;
          }
          /**
           * @todo Add checkup for the render method
           */
          // if (typeof tool.render !== 'function') {
          //   _.log('render method missed. Tool %o skipped', 'warn', tool);
          //   return;
          // }
          const userToolboxSettings = this.Editor.Tools.getToolSettings(toolName)[userSettings.TOOLBOX];
          /**
           * Hide Toolbox button if Toolbox settings is false
           */
          if ((userToolboxSettings !== null && userToolboxSettings !== void 0 ? userToolboxSettings : toolToolboxSettings) === false) {
              return;
          }
          const button = Dom.make('li', [this.CSS.toolboxButton]);
          button.dataset.tool = toolName;
          button.innerHTML = (userToolboxSettings && userToolboxSettings.icon) || toolToolboxSettings.icon;
          Dom.append(this.nodes.toolbox, button);
          this.nodes.toolbox.appendChild(button);
          this.nodes.buttons.push(button);
          /**
           * Add click listener
           */
          this.Editor.Listeners.on(button, 'click', (event) => {
              this.toolButtonActivate(event, toolName);
          });
          /**
           * Add listeners to show/hide toolbox tooltip
           */
          const tooltipContent = this.drawTooltip(toolName);
          this.Editor.Tooltip.onHover(button, tooltipContent, {
              placement: 'bottom',
              hidingDelay: 200,
          });
          const shortcut = this.getToolShortcut(toolName, tool);
          if (shortcut) {
              this.enableShortcut(tool, toolName, shortcut);
          }
          /** Increment Tools count */
          this.displayedToolsCount++;
      }
      /**
       * Returns tool's shortcut
       * It can be specified via internal 'shortcut' static getter or by user settings for tool
       *
       * @param {string} toolName - tool's name
       * @param {ToolConstructable} tool - tool's class (not instance)
       */
      getToolShortcut(toolName, tool) {
          /**
           * Enable shortcut
           */
          const toolSettings = this.Editor.Tools.getToolSettings(toolName);
          const internalToolShortcut = tool[this.Editor.Tools.INTERNAL_SETTINGS.SHORTCUT];
          const userSpecifiedShortcut = toolSettings ? toolSettings[this.Editor.Tools.USER_SETTINGS.SHORTCUT] : null;
          return userSpecifiedShortcut || internalToolShortcut;
      }
      /**
       * Draw tooltip for toolbox tools
       *
       * @param {string} toolName - toolbox tool name
       * @returns {HTMLElement}
       */
      drawTooltip(toolName) {
          const tool = this.Editor.Tools.available[toolName];
          const toolSettings = this.Editor.Tools.getToolSettings(toolName);
          const toolboxSettings = this.Editor.Tools.available[toolName][this.Editor.Tools.INTERNAL_SETTINGS.TOOLBOX] || {};
          const userToolboxSettings = toolSettings.toolbox || {};
          const name = I18nConstructor.t(I18nInternalNS.toolNames, userToolboxSettings.title || toolboxSettings.title || toolName);
          let shortcut = this.getToolShortcut(toolName, tool);
          const tooltip = Dom.make('div', this.CSS.buttonTooltip);
          const hint = document.createTextNode(capitalize(name));
          tooltip.appendChild(hint);
          if (shortcut) {
              shortcut = beautifyShortcut(shortcut);
              tooltip.appendChild(Dom.make('div', this.CSS.buttonShortcut, {
                  textContent: shortcut,
              }));
          }
          return tooltip;
      }
      /**
       * Enable shortcut Block Tool implemented shortcut
       *
       * @param {BlockToolConstructable} tool - Tool class
       * @param {string} toolName - Tool name
       * @param {string} shortcut - shortcut according to the ShortcutData Module format
       */
      enableShortcut(tool, toolName, shortcut) {
          this.Editor.Shortcuts.add({
              name: shortcut,
              handler: (event) => {
                  event.preventDefault();
                  this.insertNewBlock(tool, toolName);
              },
          });
      }
      /**
       * Removes all added shortcuts
       * Fired when the Read-Only mode is activated
       */
      removeAllShortcuts() {
          const tools = this.Editor.Tools.available;
          for (const toolName in tools) {
              if (Object.prototype.hasOwnProperty.call(tools, toolName)) {
                  const shortcut = this.getToolShortcut(toolName, tools[toolName]);
                  if (shortcut) {
                      this.Editor.Shortcuts.remove(shortcut);
                  }
              }
          }
      }
      /**
       * Creates Flipper instance to be able to leaf tools
       */
      enableFlipper() {
          const tools = Array.from(this.nodes.toolbox.childNodes);
          this.flipper = new Flipper({
              items: tools,
              focusedItemClass: this.CSS.toolboxButtonActive,
          });
      }
      /**
       * Inserts new block
       * Can be called when button clicked on Toolbox or by ShortcutData
       *
       * @param {BlockToolConstructable} tool - Tool Class
       * @param {string} toolName - Tool name
       */
      insertNewBlock(tool, toolName) {
          const { BlockManager, Caret } = this.Editor;
          const { currentBlock } = BlockManager;
          const newBlock = BlockManager.insert({
              tool: toolName,
              replace: currentBlock.isEmpty,
          });
          /**
           * Apply callback before inserting html
           */
          newBlock.call(BlockToolAPI.APPEND_CALLBACK);
          this.Editor.Caret.setToBlock(newBlock);
          /** If new block doesn't contain inpus, insert new paragraph above */
          if (newBlock.inputs.length === 0) {
              if (newBlock === BlockManager.lastBlock) {
                  BlockManager.insertAtEnd();
                  Caret.setToBlock(BlockManager.lastBlock);
              }
              else {
                  Caret.setToBlock(BlockManager.nextBlock);
              }
          }
          /**
           * close toolbar when node is changed
           */
          this.Editor.Toolbar.close();
      }
  }
  Toolbox.displayName = 'Toolbox';

  /**
   * Inline toolbar with actions that modifies selected text fragment
   *
   * |¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯|
   * |   B  i [link] [mark]   |
   * |________________________|
   */
  class InlineToolbar extends Module {
      constructor() {
          super(...arguments);
          /**
           * CSS styles
           */
          this.CSS = {
              inlineToolbar: 'ce-inline-toolbar',
              inlineToolbarShowed: 'ce-inline-toolbar--showed',
              inlineToolbarLeftOriented: 'ce-inline-toolbar--left-oriented',
              inlineToolbarRightOriented: 'ce-inline-toolbar--right-oriented',
              inlineToolbarShortcut: 'ce-inline-toolbar__shortcut',
              buttonsWrapper: 'ce-inline-toolbar__buttons',
              actionsWrapper: 'ce-inline-toolbar__actions',
              inlineToolButton: 'ce-inline-tool',
              inputField: 'cdx-input',
              focusedButton: 'ce-inline-tool--focused',
              conversionToggler: 'ce-inline-toolbar__dropdown',
              conversionTogglerHidden: 'ce-inline-toolbar__dropdown--hidden',
              conversionTogglerContent: 'ce-inline-toolbar__dropdown-content',
              togglerAndButtonsWrapper: 'ce-inline-toolbar__toggler-and-button-wrapper',
          };
          /**
           * State of inline toolbar
           *
           * @type {boolean}
           */
          this.opened = false;
          /**
           * Margin above/below the Toolbar
           */
          this.toolbarVerticalMargin = 5;
          /**
           * Buttons List
           *
           * @type {NodeList}
           */
          this.buttonsList = null;
          /**
           * Cache for Inline Toolbar width
           *
           * @type {number}
           */
          this.width = 0;
          /**
           * Instance of class that responses for leafing buttons by arrows/tab
           */
          this.flipper = null;
      }
      /**
       * Toggles read-only mode
       *
       * @param {boolean} readOnlyEnabled - read-only mode
       */
      toggleReadOnly(readOnlyEnabled) {
          if (!readOnlyEnabled) {
              this.make();
          }
          else {
              this.destroy();
              this.Editor.ConversionToolbar.destroy();
          }
      }
      /**
       *  Moving / appearance
       *  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
       */
      /**
       * Shows Inline Toolbar if something is selected
       *
       * @param {boolean} [needToClose] - pass true to close toolbar if it is not allowed.
       *                                  Avoid to use it just for closing IT, better call .close() clearly.
       */
      tryToShow(needToClose = false) {
          if (!this.allowedToShow()) {
              if (needToClose) {
                  this.close();
              }
              return;
          }
          this.move();
          this.open();
          this.Editor.Toolbar.close();
      }
      /**
       * Move Toolbar to the selected text
       */
      move() {
          const selectionRect = SelectionUtils.rect;
          const wrapperOffset = this.Editor.UI.nodes.wrapper.getBoundingClientRect();
          const newCoords = {
              x: selectionRect.x - wrapperOffset.left,
              y: selectionRect.y +
                  selectionRect.height -
                  // + window.scrollY
                  wrapperOffset.top +
                  this.toolbarVerticalMargin,
          };
          /**
           * If we know selections width, place InlineToolbar to center
           */
          if (selectionRect.width) {
              newCoords.x += Math.floor(selectionRect.width / 2);
          }
          /**
           * Inline Toolbar has -50% translateX, so we need to check real coords to prevent overflowing
           */
          const realLeftCoord = newCoords.x - this.width / 2;
          const realRightCoord = newCoords.x + this.width / 2;
          /**
           * By default, Inline Toolbar has top-corner at the center
           * We are adding a modifiers for to move corner to the left or right
           */
          this.nodes.wrapper.classList.toggle(this.CSS.inlineToolbarLeftOriented, realLeftCoord < this.Editor.UI.contentRect.left);
          this.nodes.wrapper.classList.toggle(this.CSS.inlineToolbarRightOriented, realRightCoord > this.Editor.UI.contentRect.right);
          this.nodes.wrapper.style.left = Math.floor(newCoords.x) + 'px';
          this.nodes.wrapper.style.top = Math.floor(newCoords.y) + 'px';
      }
      /**
       * Hides Inline Toolbar
       */
      close() {
          if (!this.opened) {
              return;
          }
          if (this.Editor.ReadOnly.isEnabled) {
              return;
          }
          this.nodes.wrapper.classList.remove(this.CSS.inlineToolbarShowed);
          this.toolsInstances.forEach((toolInstance) => {
              /**
               * @todo replace 'clear' with 'destroy'
               */
              if (isFunction(toolInstance.clear)) {
                  toolInstance.clear();
              }
          });
          this.opened = false;
          this.flipper.deactivate();
          this.Editor.ConversionToolbar.close();
      }
      /**
       * Shows Inline Toolbar
       */
      open() {
          if (this.opened) {
              return;
          }
          /**
           * Filter inline-tools and show only allowed by Block's Tool
           */
          this.addToolsFiltered();
          /**
           * Show Inline Toolbar
           */
          this.nodes.wrapper.classList.add(this.CSS.inlineToolbarShowed);
          this.buttonsList = this.nodes.buttons.querySelectorAll(`.${this.CSS.inlineToolButton}`);
          this.opened = true;
          if (this.Editor.ConversionToolbar.hasTools()) {
              /**
               * Change Conversion Dropdown content for current tool
               */
              this.setConversionTogglerContent();
          }
          else {
              /**
               * hide Conversion Dropdown with there are no tools
               */
              this.nodes.conversionToggler.hidden = true;
          }
          /**
           * Get currently visible buttons to pass it to the Flipper
           */
          let visibleTools = Array.from(this.buttonsList);
          visibleTools.unshift(this.nodes.conversionToggler);
          visibleTools = visibleTools.filter((tool) => !tool.hidden);
          this.flipper.activate(visibleTools);
      }
      /**
       * Check if node is contained by Inline Toolbar
       *
       * @param {Node} node — node to chcek
       */
      containsNode(node) {
          return this.nodes.wrapper.contains(node);
      }
      /**
       * Removes UI and its components
       */
      destroy() {
          /**
           * Sometimes (in read-only mode) there is no Flipper
           */
          if (this.flipper) {
              this.flipper.deactivate();
              this.flipper = null;
          }
          this.removeAllNodes();
      }
      /**
       * Returns inline toolbar settings for a particular tool
       *
       * @param {string} toolName - user specified name of tool
       * @returns - array of ordered tool names or false
       */
      getInlineToolbarSettings(toolName) {
          const toolSettings = this.Editor.Tools.getToolSettings(toolName);
          /**
           * InlineToolbar property of a particular tool
           */
          const settingsForTool = toolSettings[this.Editor.Tools.USER_SETTINGS.ENABLED_INLINE_TOOLS];
          /**
           * Whether to enable IT for a particular tool is the decision of the editor user.
           * He can enable it by the inlineToolbar settings for this tool. To enable, he should pass true or strings[]
           */
          const enabledForTool = settingsForTool === true || Array.isArray(settingsForTool);
          /**
           * Disabled by user
           */
          if (!enabledForTool) {
              return false;
          }
          /**
           * 1st priority.
           *
           * If user pass the list of inline tools for the particular tool, return it.
           */
          if (Array.isArray(settingsForTool)) {
              return settingsForTool;
          }
          /**
           * 2nd priority.
           *
           * If user pass just 'true' for tool, get common inlineToolbar settings
           * - if common settings is an array, use it
           * - if common settings is 'true' or not specified, get default order
           */
          /**
           * Common inlineToolbar settings got from the root of EditorConfig
           */
          const commonInlineToolbarSettings = this.config.inlineToolbar;
          /**
           * If common settings is an array, use it
           */
          if (Array.isArray(commonInlineToolbarSettings)) {
              return commonInlineToolbarSettings;
          }
          /**
           * If common settings is 'true' or not specified (will be set as true at core.ts), get the default order
           */
          if (commonInlineToolbarSettings === true) {
              const defaultToolsOrder = Object.entries(this.Editor.Tools.available)
                  .filter(([name, tool]) => {
                  return tool[this.Editor.Tools.INTERNAL_SETTINGS.IS_INLINE];
              })
                  .map(([name, tool]) => {
                  return name;
              });
              return defaultToolsOrder;
          }
          return false;
      }
      /**
       * Making DOM
       */
      make() {
          this.nodes.wrapper = Dom.make('div', [
              this.CSS.inlineToolbar,
              ...(this.isRtl ? [this.Editor.UI.CSS.editorRtlFix] : []),
          ]);
          /**
           * Creates a different wrapper for toggler and buttons.
           */
          this.nodes.togglerAndButtonsWrapper = Dom.make('div', this.CSS.togglerAndButtonsWrapper);
          this.nodes.buttons = Dom.make('div', this.CSS.buttonsWrapper);
          this.nodes.actions = Dom.make('div', this.CSS.actionsWrapper);
          // To prevent reset of a selection when click on the wrapper
          this.Editor.Listeners.on(this.nodes.wrapper, 'mousedown', (event) => {
              const isClickedOnActionsWrapper = event.target.closest(`.${this.CSS.actionsWrapper}`);
              // If click is on actions wrapper,
              // do not prevent default behaviour because actions might include interactive elements
              if (!isClickedOnActionsWrapper) {
                  event.preventDefault();
              }
          });
          /**
           * Append the intermediary wrapper which contains toggler and buttons and button actions.
           */
          Dom.append(this.nodes.wrapper, [this.nodes.togglerAndButtonsWrapper, this.nodes.actions]);
          /**
           * Append the inline toolbar to the editor.
           */
          Dom.append(this.Editor.UI.nodes.wrapper, this.nodes.wrapper);
          /**
           * Add button that will allow switching block type
           */
          this.addConversionToggler();
          /**
           * Wrapper for the inline tools
           * Will be appended after the Conversion Toolbar toggler
           */
          Dom.append(this.nodes.togglerAndButtonsWrapper, this.nodes.buttons);
          /**
           * Prepare conversion toolbar.
           * If it has any conversion tool then it will be enabled in the Inline Toolbar
           */
          this.prepareConversionToolbar();
          /**
           * Recalculate initial width with all buttons
           */
          this.recalculateWidth();
          /**
           * Allow to leaf buttons by arrows / tab
           * Buttons will be filled on opening
           */
          this.enableFlipper();
      }
      /**
       * Need to show Inline Toolbar or not
       */
      allowedToShow() {
          /**
           * Tags conflicts with window.selection function.
           * Ex. IMG tag returns null (Firefox) or Redactors wrapper (Chrome)
           */
          const tagsConflictsWithSelection = ['IMG', 'INPUT'];
          const currentSelection = SelectionUtils.get();
          const selectedText = SelectionUtils.text;
          // old browsers
          if (!currentSelection || !currentSelection.anchorNode) {
              return false;
          }
          // empty selection
          if (currentSelection.isCollapsed || selectedText.length < 1) {
              return false;
          }
          const target = !Dom.isElement(currentSelection.anchorNode)
              ? currentSelection.anchorNode.parentElement
              : currentSelection.anchorNode;
          if (currentSelection && tagsConflictsWithSelection.includes(target.tagName)) {
              return false;
          }
          // The selection of the element only in contenteditable
          const contenteditable = target.closest('[contenteditable="true"]');
          if (contenteditable === null) {
              return false;
          }
          // is enabled by current Block's Tool
          const currentBlock = this.Editor.BlockManager.getBlock(currentSelection.anchorNode);
          if (!currentBlock) {
              return false;
          }
          /**
           * getInlineToolbarSettings could return an string[] (order of tools) or false (Inline Toolbar disabled).
           */
          const inlineToolbarSettings = this.getInlineToolbarSettings(currentBlock.name);
          return inlineToolbarSettings !== false;
      }
      /**
       * Recalculate inline toolbar width
       */
      recalculateWidth() {
          this.width = this.nodes.wrapper.offsetWidth;
      }
      /**
       * Create a toggler for Conversion Dropdown
       * and prepend it to the buttons list
       */
      addConversionToggler() {
          this.nodes.conversionToggler = Dom.make('div', this.CSS.conversionToggler);
          this.nodes.conversionTogglerContent = Dom.make('div', this.CSS.conversionTogglerContent);
          const icon = Dom.svg('toggler-down', 13, 13);
          this.nodes.conversionToggler.appendChild(this.nodes.conversionTogglerContent);
          this.nodes.conversionToggler.appendChild(icon);
          this.nodes.togglerAndButtonsWrapper.appendChild(this.nodes.conversionToggler);
          this.Editor.Listeners.on(this.nodes.conversionToggler, 'click', () => {
              this.Editor.ConversionToolbar.toggle((conversionToolbarOpened) => {
                  /**
                   * When ConversionToolbar is opening on activated InlineToolbar flipper
                   * Then we need to temporarily deactivate InlineToolbar flipper so that we could flip ConversionToolbar items
                   *
                   * Other case when ConversionToolbar is closing (for example, by escape) but we need to continue flipping
                   * InlineToolbar items, we activate InlineToolbar flipper
                   */
                  const canActivateInlineToolbarFlipper = !conversionToolbarOpened && this.opened;
                  if (canActivateInlineToolbarFlipper) {
                      this.flipper.activate();
                  }
                  else if (this.opened) {
                      this.flipper.deactivate();
                  }
              });
          });
          this.Editor.Tooltip.onHover(this.nodes.conversionToggler, I18nConstructor.ui(I18nInternalNS.ui.inlineToolbar.converter, 'Convert to'), {
              placement: 'top',
              hidingDelay: 100,
          });
      }
      /**
       * Changes Conversion Dropdown content for current block's Tool
       */
      setConversionTogglerContent() {
          const { BlockManager, Tools } = this.Editor;
          const toolName = BlockManager.currentBlock.name;
          /**
           * If tool does not provide 'export' rule, hide conversion dropdown
           */
          const conversionConfig = Tools.available[toolName][Tools.INTERNAL_SETTINGS.CONVERSION_CONFIG] || {};
          const exportRuleDefined = conversionConfig && conversionConfig.export;
          this.nodes.conversionToggler.hidden = !exportRuleDefined;
          this.nodes.conversionToggler.classList.toggle(this.CSS.conversionTogglerHidden, !exportRuleDefined);
          /**
           * Get icon or title for dropdown
           */
          const toolSettings = Tools.getToolSettings(toolName);
          const toolboxSettings = Tools.available[toolName][Tools.INTERNAL_SETTINGS.TOOLBOX] || {};
          const userToolboxSettings = toolSettings.toolbox || {};
          this.nodes.conversionTogglerContent.innerHTML =
              userToolboxSettings.icon ||
                  toolboxSettings.icon ||
                  userToolboxSettings.title ||
                  toolboxSettings.title ||
                  capitalize(toolName);
      }
      /**
       * Makes the Conversion Dropdown
       */
      prepareConversionToolbar() {
          const ct = this.Editor.ConversionToolbar.make();
          Dom.append(this.nodes.wrapper, ct);
      }
      /**
       *  Working with Tools
       *  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
       */
      /**
       * Append only allowed Tools
       */
      addToolsFiltered() {
          const currentSelection = SelectionUtils.get();
          const currentBlock = this.Editor.BlockManager.getBlock(currentSelection.anchorNode);
          /**
           * Clear buttons list
           */
          this.nodes.buttons.innerHTML = '';
          this.nodes.actions.innerHTML = '';
          this.toolsInstances = new Map();
          /**
           * Filter buttons if Block Tool pass config like inlineToolbar=['link']
           * Else filter them according to the default inlineToolbar property.
           *
           * For this moment, inlineToolbarOrder could not be 'false'
           * because this method will be called only if the Inline Toolbar is enabled
           */
          const inlineToolbarOrder = this.getInlineToolbarSettings(currentBlock.name);
          inlineToolbarOrder.forEach((toolName) => {
              const toolSettings = this.Editor.Tools.getToolSettings(toolName);
              const tool = this.Editor.Tools.constructInline(this.Editor.Tools.inline[toolName], toolName, toolSettings);
              this.addTool(toolName, tool);
              tool.checkState(SelectionUtils.get());
          });
          /**
           * Recalculate width because some buttons can be hidden
           */
          this.recalculateWidth();
      }
      /**
       * Add tool button and activate clicks
       *
       * @param {string} toolName - name of Tool to add
       * @param {InlineTool} tool - Tool class instance
       */
      addTool(toolName, tool) {
          const { Listeners, Tools, Tooltip, } = this.Editor;
          const button = tool.render();
          if (!button) {
              log('Render method must return an instance of Node', 'warn', toolName);
              return;
          }
          button.dataset.tool = toolName;
          this.nodes.buttons.appendChild(button);
          this.toolsInstances.set(toolName, tool);
          if (isFunction(tool.renderActions)) {
              const actions = tool.renderActions();
              this.nodes.actions.appendChild(actions);
          }
          Listeners.on(button, 'click', (event) => {
              this.toolClicked(tool);
              event.preventDefault();
          });
          /**
           * Enable shortcuts
           * Ignore tool that doesn't have shortcut or empty string
           */
          const toolSettings = Tools.getToolSettings(toolName);
          let shortcut = null;
          /**
           * Get internal inline tools
           */
          const internalTools = Object
              .entries(Tools.internalTools)
              .filter(([, toolClass]) => {
              if (isFunction(toolClass)) {
                  return toolClass[Tools.INTERNAL_SETTINGS.IS_INLINE];
              }
              return toolClass.class[Tools.INTERNAL_SETTINGS.IS_INLINE];
          })
              .map(([name]) => name);
          /**
           * 1) For internal tools, check public getter 'shortcut'
           * 2) For external tools, check tool's settings
           * 3) If shortcut is not set in settings, check Tool's public property
           */
          if (internalTools.includes(toolName)) {
              shortcut = this.inlineTools[toolName][Tools.INTERNAL_SETTINGS.SHORTCUT];
          }
          else if (toolSettings && toolSettings[Tools.USER_SETTINGS.SHORTCUT]) {
              shortcut = toolSettings[Tools.USER_SETTINGS.SHORTCUT];
          }
          else if (tool.shortcut) {
              shortcut = tool.shortcut;
          }
          if (shortcut) {
              this.enableShortcuts(tool, shortcut);
          }
          /**
           * Enable tooltip module on button
           */
          const tooltipContent = Dom.make('div');
          const toolTitle = I18nConstructor.t(I18nInternalNS.toolNames, Tools.toolsClasses[toolName][Tools.INTERNAL_SETTINGS.TITLE] || capitalize(toolName));
          tooltipContent.appendChild(Dom.text(toolTitle));
          if (shortcut) {
              tooltipContent.appendChild(Dom.make('div', this.CSS.inlineToolbarShortcut, {
                  textContent: beautifyShortcut(shortcut),
              }));
          }
          Tooltip.onHover(button, tooltipContent, {
              placement: 'top',
              hidingDelay: 100,
          });
      }
      /**
       * Enable Tool shortcut with Editor Shortcuts Module
       *
       * @param {InlineTool} tool - Tool instance
       * @param {string} shortcut - shortcut according to the ShortcutData Module format
       */
      enableShortcuts(tool, shortcut) {
          this.Editor.Shortcuts.add({
              name: shortcut,
              handler: (event) => {
                  const { currentBlock } = this.Editor.BlockManager;
                  /**
                   * Editor is not focused
                   */
                  if (!currentBlock) {
                      return;
                  }
                  /**
                   * We allow to fire shortcut with empty selection (isCollapsed=true)
                   * it can be used by tools like «Mention» that works without selection:
                   * Example: by SHIFT+@ show dropdown and insert selected username
                   */
                  // if (SelectionUtils.isCollapsed) return;
                  const toolSettings = this.Editor.Tools.getToolSettings(currentBlock.name);
                  if (!toolSettings || !toolSettings[this.Editor.Tools.USER_SETTINGS.ENABLED_INLINE_TOOLS]) {
                      return;
                  }
                  event.preventDefault();
                  this.toolClicked(tool);
              },
          });
      }
      /**
       * Inline Tool button clicks
       *
       * @param {InlineTool} tool - Tool's instance
       */
      toolClicked(tool) {
          const range = SelectionUtils.range;
          tool.surround(range);
          this.checkToolsState();
      }
      /**
       * Check Tools` state by selection
       */
      checkToolsState() {
          this.toolsInstances.forEach((toolInstance) => {
              toolInstance.checkState(SelectionUtils.get());
          });
      }
      /**
       * Get inline tools tools
       * Tools that has isInline is true
       */
      get inlineTools() {
          const result = {};
          for (const tool in this.Editor.Tools.inline) {
              if (Object.prototype.hasOwnProperty.call(this.Editor.Tools.inline, tool)) {
                  const toolSettings = this.Editor.Tools.getToolSettings(tool);
                  result[tool] = this.Editor.Tools.constructInline(this.Editor.Tools.inline[tool], tool, toolSettings);
              }
          }
          return result;
      }
      /**
       * Allow to leaf buttons by arrows / tab
       * Buttons will be filled on opening
       */
      enableFlipper() {
          this.flipper = new Flipper({
              focusedItemClass: this.CSS.focusedButton,
              allowArrows: false,
          });
      }
  }
  InlineToolbar.displayName = 'InlineToolbar';

  const ToolbarModules = [BlockSettings, ConversionToolbar, InlineToolbar, Toolbar, Toolbox];

  /**
   * Editor.js Listeners module
   *
   * @module Listeners
   *
   * Module-decorator for event listeners assignment
   *
   * @author Codex Team
   * @version 2.0.0
   */
  /**
   * @typedef {Listeners} Listeners
   * @property {ListenerData[]} allListeners - listeners store
   */
  class Listeners extends Module {
      constructor() {
          super(...arguments);
          /**
           * Stores all listeners data to find/remove/process it
           *
           * @type {ListenerData[]}
           */
          this.allListeners = [];
      }
      /**
       * Assigns event listener on element and returns unique identifier
       *
       * @param {EventTarget} element - DOM element that needs to be listened
       * @param {string} eventType - event type
       * @param {Function} handler - method that will be fired on event
       * @param {boolean|AddEventListenerOptions} options - useCapture or {capture, passive, once}
       *
       * @returns {string}
       */
      on(element, eventType, handler, options = false) {
          const id = generateId('l');
          const assignedEventData = {
              id,
              element,
              eventType,
              handler,
              options,
          };
          const alreadyExist = this.findOne(element, eventType, handler);
          if (alreadyExist) {
              return;
          }
          this.allListeners.push(assignedEventData);
          element.addEventListener(eventType, handler, options);
          return id;
      }
      /**
       * Removes event listener from element
       *
       * @param {EventTarget} element - DOM element that we removing listener
       * @param {string} eventType - event type
       * @param {Function} handler - remove handler, if element listens several handlers on the same event type
       * @param {boolean|AddEventListenerOptions} options - useCapture or {capture, passive, once}
       */
      off(element, eventType, handler, options) {
          const existingListeners = this.findAll(element, eventType, handler);
          existingListeners.forEach((listener, i) => {
              const index = this.allListeners.indexOf(existingListeners[i]);
              if (index > 0) {
                  this.allListeners.splice(index, 1);
                  listener.element.removeEventListener(listener.eventType, listener.handler, listener.options);
              }
          });
      }
      /**
       * Removes listener by id
       *
       * @param {string} id - listener identifier
       */
      offById(id) {
          const listener = this.findById(id);
          if (!listener) {
              return;
          }
          listener.element.removeEventListener(listener.eventType, listener.handler, listener.options);
      }
      /**
       * Finds and returns first listener by passed params
       *
       * @param {EventTarget} element - event target
       * @param {string} [eventType] - event type
       * @param {Function} [handler] - event handler
       *
       * @returns {ListenerData|null}
       */
      findOne(element, eventType, handler) {
          const foundListeners = this.findAll(element, eventType, handler);
          return foundListeners.length > 0 ? foundListeners[0] : null;
      }
      /**
       * Return all stored listeners by passed params
       *
       * @param {EventTarget} element - event target
       * @param {string} eventType - event type
       * @param {Function} handler - event handler
       *
       * @returns {ListenerData[]}
       */
      findAll(element, eventType, handler) {
          let found;
          const foundByEventTargets = element ? this.findByEventTarget(element) : [];
          if (element && eventType && handler) {
              found = foundByEventTargets.filter((event) => event.eventType === eventType && event.handler === handler);
          }
          else if (element && eventType) {
              found = foundByEventTargets.filter((event) => event.eventType === eventType);
          }
          else {
              found = foundByEventTargets;
          }
          return found;
      }
      /**
       * Removes all listeners
       */
      removeAll() {
          this.allListeners.map((current) => {
              current.element.removeEventListener(current.eventType, current.handler, current.options);
          });
          this.allListeners = [];
      }
      /**
       * Module cleanup on destruction
       */
      destroy() {
          this.removeAll();
      }
      /**
       * Search method: looks for listener by passed element
       *
       * @param {EventTarget} element - searching element
       *
       * @returns {Array} listeners that found on element
       */
      findByEventTarget(element) {
          return this.allListeners.filter((listener) => {
              if (listener.element === element) {
                  return listener;
              }
          });
      }
      /**
       * Search method: looks for listener by passed event type
       *
       * @param {string} eventType - event type
       *
       * @returns {ListenerData[]} listeners that found on element
       */
      findByType(eventType) {
          return this.allListeners.filter((listener) => {
              if (listener.eventType === eventType) {
                  return listener;
              }
          });
      }
      /**
       * Search method: looks for listener by passed handler
       *
       * @param {Function} handler - event handler
       *
       * @returns {ListenerData[]} listeners that found on element
       */
      findByHandler(handler) {
          return this.allListeners.filter((listener) => {
              if (listener.handler === handler) {
                  return listener;
              }
          });
      }
      /**
       * Returns listener data found by id
       *
       * @param {string} id - listener identifier
       *
       * @returns {ListenerData}
       */
      findById(id) {
          return this.allListeners.find((listener) => listener.id === id);
      }
  }
  Listeners.displayName = 'Listeners';

  /**
   * @module ModificationsObserver
   *
   * Handles any mutations
   * and gives opportunity to handle outside
   */
  /**
   *
   */
  class ModificationsObserver extends Module {
      constructor() {
          super(...arguments);
          /**
           * Allows to temporary disable mutations handling
           */
          this.disabled = false;
          /**
           * Used to prevent several mutation callback execution
           *
           * @type {Function}
           */
          this.mutationDebouncer = debounce(() => {
              this.updateNativeInputs();
              if (isFunction(this.config.onChange)) {
                  this.config.onChange(this.Editor.API.methods);
              }
          }, ModificationsObserver.DebounceTimer);
          /**
           * Array of native inputs in Blocks.
           * Changes in native inputs are not handled by modification observer, so we need to set change event listeners on them
           */
          this.nativeInputs = [];
      }
      /**
       * Clear timeout and set null to mutationDebouncer property
       */
      destroy() {
          this.mutationDebouncer = null;
          if (this.observer) {
              this.observer.disconnect();
          }
          this.observer = null;
          this.nativeInputs.forEach((input) => this.Editor.Listeners.off(input, 'input', this.mutationDebouncer));
          this.mutationDebouncer = null;
      }
      /**
       * Set read-only state
       *
       * @param {boolean} readOnlyEnabled - read only flag value
       */
      toggleReadOnly(readOnlyEnabled) {
          if (readOnlyEnabled) {
              this.disableModule();
          }
          else {
              this.enableModule();
          }
      }
      /**
       * Allows to disable observer,
       * for example when Editor wants to stealthy mutate DOM
       */
      disable() {
          this.disabled = true;
      }
      /**
       * Enables mutation handling
       * Should be called after .disable()
       */
      enable() {
          this.disabled = false;
      }
      /**
       * setObserver
       *
       * sets 'DOMSubtreeModified' listener on Editor's UI.nodes.redactor
       * so that User can handle outside from API
       */
      setObserver() {
          const { UI } = this.Editor;
          const observerOptions = {
              childList: true,
              attributes: true,
              subtree: true,
              characterData: true,
              characterDataOldValue: true,
          };
          this.observer = new MutationObserver((mutationList, observer) => {
              this.mutationHandler(mutationList, observer);
          });
          this.observer.observe(UI.nodes.redactor, observerOptions);
      }
      /**
       * MutationObserver events handler
       *
       * @param {MutationRecord[]} mutationList - list of mutations
       * @param {MutationObserver} observer - observer instance
       */
      mutationHandler(mutationList, observer) {
          /**
           * Skip mutations in stealth mode
           */
          if (this.disabled) {
              return;
          }
          /**
           * We divide two Mutation types:
           * 1) mutations that concerns client changes: settings changes, symbol added, deletion, insertions and so on
           * 2) functional changes. On each client actions we set functional identifiers to interact with user
           */
          let contentMutated = false;
          mutationList.forEach((mutation) => {
              switch (mutation.type) {
                  case 'childList':
                  case 'characterData':
                      contentMutated = true;
                      break;
                  case 'attributes':
                      /**
                       * Changes on Element.ce-block usually is functional
                       */
                      if (!mutation.target.classList.contains(Block.CSS.wrapper)) {
                          contentMutated = true;
                      }
                      break;
              }
          });
          /** call once */
          if (contentMutated) {
              this.mutationDebouncer();
          }
      }
      /**
       * Gets native inputs and set oninput event handler
       */
      updateNativeInputs() {
          if (this.nativeInputs) {
              this.nativeInputs.forEach((input) => {
                  this.Editor.Listeners.off(input, 'input');
              });
          }
          this.nativeInputs = Array.from(this.Editor.UI.nodes.redactor.querySelectorAll('textarea, input, select'));
          this.nativeInputs.forEach((input) => this.Editor.Listeners.on(input, 'input', this.mutationDebouncer));
      }
      /**
       * Sets observer and enables it
       */
      enableModule() {
          /**
           * wait till Browser render Editor's Blocks
           */
          window.setTimeout(() => {
              this.setObserver();
              this.updateNativeInputs();
              this.enable();
          }, 1000);
      }
      /**
       * Disables observer
       */
      disableModule() {
          this.disable();
      }
  }
  /**
   * Debounce Timer
   *
   * @type {number}
   */
  ModificationsObserver.DebounceTimer = 450;
  ModificationsObserver.displayName = 'ModificationsObserver';

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function getDefaultExportFromCjs (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  function createCommonjsModule(fn, basedir, module) {
  	return module = {
  		path: basedir,
  		exports: {},
  		require: function (path, base) {
  			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
  		}
  	}, fn(module, module.exports), module.exports;
  }

  function commonjsRequire () {
  	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
  }

  var bundle = createCommonjsModule(function (module, exports) {
  !function(t,e){module.exports=e();}(window,function(){return function(t){var e={};function n(o){if(e[o])return e[o].exports;var r=e[o]={i:o,l:!1,exports:{}};return t[o].call(r.exports,r,r.exports,n),r.l=!0,r.exports}return n.m=t,n.c=e,n.d=function(t,e,o){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:o});},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0});},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var o=Object.create(null);if(n.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var r in t)n.d(o,r,function(e){return t[e]}.bind(null,r));return o},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="/",n(n.s=0)}([function(t,e,n){n(1),
  /*!
   * Codex JavaScript Notification module
   * https://github.com/codex-team/js-notifier
   */
  t.exports=function(){var t=n(6),e="cdx-notify--bounce-in",o=null;return {show:function(n){if(n.message){!function(){if(o)return !0;o=t.getWrapper(),document.body.appendChild(o);}();var r=null,i=n.time||8e3;switch(n.type){case"confirm":r=t.confirm(n);break;case"prompt":r=t.prompt(n);break;default:r=t.alert(n),window.setTimeout(function(){r.remove();},i);}o.appendChild(r),r.classList.add(e);}}}}();},function(t,e,n){var o=n(2);"string"==typeof o&&(o=[[t.i,o,""]]);var r={hmr:!0,transform:void 0,insertInto:void 0};n(4)(o,r);o.locals&&(t.exports=o.locals);},function(t,e,n){(t.exports=n(3)(!1)).push([t.i,'.cdx-notify--error{background:#fffbfb!important}.cdx-notify--error::before{background:#fb5d5d!important}.cdx-notify__input{max-width:130px;padding:5px 10px;background:#f7f7f7;border:0;border-radius:3px;font-size:13px;color:#656b7c;outline:0}.cdx-notify__input:-ms-input-placeholder{color:#656b7c}.cdx-notify__input::placeholder{color:#656b7c}.cdx-notify__input:focus:-ms-input-placeholder{color:rgba(101,107,124,.3)}.cdx-notify__input:focus::placeholder{color:rgba(101,107,124,.3)}.cdx-notify__button{border:none;border-radius:3px;font-size:13px;padding:5px 10px;cursor:pointer}.cdx-notify__button:last-child{margin-left:10px}.cdx-notify__button--cancel{background:#f2f5f7;box-shadow:0 2px 1px 0 rgba(16,19,29,0);color:#656b7c}.cdx-notify__button--cancel:hover{background:#eee}.cdx-notify__button--confirm{background:#34c992;box-shadow:0 1px 1px 0 rgba(18,49,35,.05);color:#fff}.cdx-notify__button--confirm:hover{background:#33b082}.cdx-notify__btns-wrapper{display:-ms-flexbox;display:flex;-ms-flex-flow:row nowrap;flex-flow:row nowrap;margin-top:5px}.cdx-notify__cross{position:absolute;top:5px;right:5px;width:10px;height:10px;padding:5px;opacity:.54;cursor:pointer}.cdx-notify__cross::after,.cdx-notify__cross::before{content:\'\';position:absolute;left:9px;top:5px;height:12px;width:2px;background:#575d67}.cdx-notify__cross::before{transform:rotate(-45deg)}.cdx-notify__cross::after{transform:rotate(45deg)}.cdx-notify__cross:hover{opacity:1}.cdx-notifies{position:fixed;z-index:2;bottom:20px;left:20px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen,Ubuntu,Cantarell,"Fira Sans","Droid Sans","Helvetica Neue",sans-serif}.cdx-notify{position:relative;width:220px;margin-top:15px;padding:13px 16px;background:#fff;box-shadow:0 11px 17px 0 rgba(23,32,61,.13);border-radius:5px;font-size:14px;line-height:1.4em;word-wrap:break-word}.cdx-notify::before{content:\'\';position:absolute;display:block;top:0;left:0;width:3px;height:calc(100% - 6px);margin:3px;border-radius:5px;background:0 0}@keyframes bounceIn{0%{opacity:0;transform:scale(.3)}50%{opacity:1;transform:scale(1.05)}70%{transform:scale(.9)}100%{transform:scale(1)}}.cdx-notify--bounce-in{animation-name:bounceIn;animation-duration:.6s;animation-iteration-count:1}.cdx-notify--success{background:#fafffe!important}.cdx-notify--success::before{background:#41ffb1!important}',""]);},function(t,e){t.exports=function(t){var e=[];return e.toString=function(){return this.map(function(e){var n=function(t,e){var n=t[1]||"",o=t[3];if(!o)return n;if(e&&"function"==typeof btoa){var r=(a=o,"/*# sourceMappingURL=data:application/json;charset=utf-8;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(a))))+" */"),i=o.sources.map(function(t){return "/*# sourceURL="+o.sourceRoot+t+" */"});return [n].concat(i).concat([r]).join("\n")}var a;return [n].join("\n")}(e,t);return e[2]?"@media "+e[2]+"{"+n+"}":n}).join("")},e.i=function(t,n){"string"==typeof t&&(t=[[null,t,""]]);for(var o={},r=0;r<this.length;r++){var i=this[r][0];"number"==typeof i&&(o[i]=!0);}for(r=0;r<t.length;r++){var a=t[r];"number"==typeof a[0]&&o[a[0]]||(n&&!a[2]?a[2]=n:n&&(a[2]="("+a[2]+") and ("+n+")"),e.push(a));}},e};},function(t,e,n){var o,r,i={},a=(o=function(){return window&&document&&document.all&&!window.atob},function(){return void 0===r&&(r=o.apply(this,arguments)),r}),c=function(t){var e={};return function(t){if("function"==typeof t)return t();if(void 0===e[t]){var n=function(t){return document.querySelector(t)}.call(this,t);if(window.HTMLIFrameElement&&n instanceof window.HTMLIFrameElement)try{n=n.contentDocument.head;}catch(t){n=null;}e[t]=n;}return e[t]}}(),s=null,f=0,d=[],u=n(5);function l(t,e){for(var n=0;n<t.length;n++){var o=t[n],r=i[o.id];if(r){r.refs++;for(var a=0;a<r.parts.length;a++)r.parts[a](o.parts[a]);for(;a<o.parts.length;a++)r.parts.push(h(o.parts[a],e));}else {var c=[];for(a=0;a<o.parts.length;a++)c.push(h(o.parts[a],e));i[o.id]={id:o.id,refs:1,parts:c};}}}function p(t,e){for(var n=[],o={},r=0;r<t.length;r++){var i=t[r],a=e.base?i[0]+e.base:i[0],c={css:i[1],media:i[2],sourceMap:i[3]};o[a]?o[a].parts.push(c):n.push(o[a]={id:a,parts:[c]});}return n}function b(t,e){var n=c(t.insertInto);if(!n)throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");var o=d[d.length-1];if("top"===t.insertAt)o?o.nextSibling?n.insertBefore(e,o.nextSibling):n.appendChild(e):n.insertBefore(e,n.firstChild),d.push(e);else if("bottom"===t.insertAt)n.appendChild(e);else {if("object"!=typeof t.insertAt||!t.insertAt.before)throw new Error("[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n");var r=c(t.insertInto+" "+t.insertAt.before);n.insertBefore(e,r);}}function m(t){if(null===t.parentNode)return !1;t.parentNode.removeChild(t);var e=d.indexOf(t);e>=0&&d.splice(e,1);}function x(t){var e=document.createElement("style");return void 0===t.attrs.type&&(t.attrs.type="text/css"),y(e,t.attrs),b(t,e),e}function y(t,e){Object.keys(e).forEach(function(n){t.setAttribute(n,e[n]);});}function h(t,e){var n,o,r,i;if(e.transform&&t.css){if(!(i=e.transform(t.css)))return function(){};t.css=i;}if(e.singleton){var a=f++;n=s||(s=x(e)),o=_.bind(null,n,a,!1),r=_.bind(null,n,a,!0);}else t.sourceMap&&"function"==typeof URL&&"function"==typeof URL.createObjectURL&&"function"==typeof URL.revokeObjectURL&&"function"==typeof Blob&&"function"==typeof btoa?(n=function(t){var e=document.createElement("link");return void 0===t.attrs.type&&(t.attrs.type="text/css"),t.attrs.rel="stylesheet",y(e,t.attrs),b(t,e),e}(e),o=function(t,e,n){var o=n.css,r=n.sourceMap,i=void 0===e.convertToAbsoluteUrls&&r;(e.convertToAbsoluteUrls||i)&&(o=u(o));r&&(o+="\n/*# sourceMappingURL=data:application/json;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(r))))+" */");var a=new Blob([o],{type:"text/css"}),c=t.href;t.href=URL.createObjectURL(a),c&&URL.revokeObjectURL(c);}.bind(null,n,e),r=function(){m(n),n.href&&URL.revokeObjectURL(n.href);}):(n=x(e),o=function(t,e){var n=e.css,o=e.media;o&&t.setAttribute("media",o);if(t.styleSheet)t.styleSheet.cssText=n;else {for(;t.firstChild;)t.removeChild(t.firstChild);t.appendChild(document.createTextNode(n));}}.bind(null,n),r=function(){m(n);});return o(t),function(e){if(e){if(e.css===t.css&&e.media===t.media&&e.sourceMap===t.sourceMap)return;o(t=e);}else r();}}t.exports=function(t,e){if("undefined"!=typeof DEBUG&&DEBUG&&"object"!=typeof document)throw new Error("The style-loader cannot be used in a non-browser environment");(e=e||{}).attrs="object"==typeof e.attrs?e.attrs:{},e.singleton||"boolean"==typeof e.singleton||(e.singleton=a()),e.insertInto||(e.insertInto="head"),e.insertAt||(e.insertAt="bottom");var n=p(t,e);return l(n,e),function(t){for(var o=[],r=0;r<n.length;r++){var a=n[r];(c=i[a.id]).refs--,o.push(c);}t&&l(p(t,e),e);for(r=0;r<o.length;r++){var c;if(0===(c=o[r]).refs){for(var s=0;s<c.parts.length;s++)c.parts[s]();delete i[c.id];}}}};var v,g=(v=[],function(t,e){return v[t]=e,v.filter(Boolean).join("\n")});function _(t,e,n,o){var r=n?"":o.css;if(t.styleSheet)t.styleSheet.cssText=g(e,r);else {var i=document.createTextNode(r),a=t.childNodes;a[e]&&t.removeChild(a[e]),a.length?t.insertBefore(i,a[e]):t.appendChild(i);}}},function(t,e){t.exports=function(t){var e="undefined"!=typeof window&&window.location;if(!e)throw new Error("fixUrls requires window.location");if(!t||"string"!=typeof t)return t;var n=e.protocol+"//"+e.host,o=n+e.pathname.replace(/\/[^\/]*$/,"/");return t.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi,function(t,e){var r,i=e.trim().replace(/^"(.*)"$/,function(t,e){return e}).replace(/^'(.*)'$/,function(t,e){return e});return /^(#|data:|http:\/\/|https:\/\/|file:\/\/\/|\s*$)/i.test(i)?t:(r=0===i.indexOf("//")?i:0===i.indexOf("/")?n+i:o+i.replace(/^\.\//,""),"url("+JSON.stringify(r)+")")})};},function(t,e,n){var o,r,i,a,c,s,f,d,u;t.exports=(o="cdx-notifies",r="cdx-notify",i="cdx-notify__cross",a="cdx-notify__button--confirm",c="cdx-notify__button--cancel",s="cdx-notify__input",f="cdx-notify__button",d="cdx-notify__btns-wrapper",{alert:u=function(t){var e=document.createElement("DIV"),n=document.createElement("DIV"),o=t.message,a=t.style;return e.classList.add(r),a&&e.classList.add(r+"--"+a),e.innerHTML=o,n.classList.add(i),n.addEventListener("click",e.remove.bind(e)),e.appendChild(n),e},confirm:function(t){var e=u(t),n=document.createElement("div"),o=document.createElement("button"),r=document.createElement("button"),s=e.querySelector("."+i),l=t.cancelHandler,p=t.okHandler;return n.classList.add(d),o.innerHTML=t.okText||"Confirm",r.innerHTML=t.cancelText||"Cancel",o.classList.add(f),r.classList.add(f),o.classList.add(a),r.classList.add(c),l&&"function"==typeof l&&(r.addEventListener("click",l),s.addEventListener("click",l)),p&&"function"==typeof p&&o.addEventListener("click",p),o.addEventListener("click",e.remove.bind(e)),r.addEventListener("click",e.remove.bind(e)),n.appendChild(o),n.appendChild(r),e.appendChild(n),e},prompt:function(t){var e=u(t),n=document.createElement("div"),o=document.createElement("button"),r=document.createElement("input"),c=e.querySelector("."+i),l=t.cancelHandler,p=t.okHandler;return n.classList.add(d),o.innerHTML=t.okText||"Ok",o.classList.add(f),o.classList.add(a),r.classList.add(s),t.placeholder&&r.setAttribute("placeholder",t.placeholder),t.default&&(r.value=t.default),t.inputType&&(r.type=t.inputType),l&&"function"==typeof l&&c.addEventListener("click",l),p&&"function"==typeof p&&o.addEventListener("click",function(){p(r.value);}),o.addEventListener("click",e.remove.bind(e)),n.appendChild(r),n.appendChild(o),e.appendChild(n),e},getWrapper:function(){var t=document.createElement("DIV");return t.classList.add(o),t}});}])});
  });

  var notifier = /*@__PURE__*/getDefaultExportFromCjs(bundle);

  /**
   * Notifier module
   */
  class Notifier extends Module {
      /**
       * Show web notification
       *
       * @param {NotifierOptions | ConfirmNotifierOptions | PromptNotifierOptions} options - notification options
       */
      show(options) {
          notifier.show(options);
      }
  }
  Notifier.displayName = 'Notifier';

  /**
   * @class Paste
   * @classdesc Contains methods to handle paste on editor
   *
   * @module Paste
   *
   * @version 2.0.0
   */
  class Paste extends Module {
      constructor() {
          super(...arguments);
          /** Custom EditorJS mime-type to handle in-editor copy/paste actions */
          this.MIME_TYPE = 'application/x-editor-js';
          /**
           * Tags` substitutions parameters
           */
          this.toolsTags = {};
          /**
           * Store tags to substitute by tool name
           */
          this.tagsByTool = {};
          /** Patterns` substitutions parameters */
          this.toolsPatterns = [];
          /** Files` substitutions parameters */
          this.toolsFiles = {};
          /**
           * List of tools which do not need a paste handling
           */
          this.exceptionList = [];
          /**
           * Process paste config for each tool
           */
          this.processTool = ([name, tool]) => {
              try {
                  const toolInstance = new this.Editor.Tools.blockTools[name]({
                      api: this.Editor.API.getMethodsForTool(name),
                      config: {},
                      data: {},
                      readOnly: false,
                  });
                  if (tool.pasteConfig === false) {
                      this.exceptionList.push(name);
                      return;
                  }
                  if (typeof toolInstance.onPaste !== 'function') {
                      return;
                  }
                  const toolPasteConfig = tool.pasteConfig || {};
                  this.getTagsConfig(name, toolPasteConfig);
                  this.getFilesConfig(name, toolPasteConfig);
                  this.getPatternsConfig(name, toolPasteConfig);
              }
              catch (e) {
                  log(`Paste handling for «${name}» Tool hasn't been set up because of the error`, 'warn', e);
              }
          };
          /**
           * Check if Editor should process pasted data and pass data transfer object to handler
           *
           * @param {ClipboardEvent} event - clipboard event
           */
          this.handlePasteEvent = (event) => __awaiter(this, void 0, void 0, function* () {
              const { BlockManager, Toolbar } = this.Editor;
              /** If target is native input or is not Block, use browser behaviour */
              if (!BlockManager.currentBlock || (this.isNativeBehaviour(event.target) && !event.clipboardData.types.includes('Files'))) {
                  return;
              }
              /**
               * If Tools is in list of errors, skip processing of paste event
               */
              if (BlockManager.currentBlock && this.exceptionList.includes(BlockManager.currentBlock.name)) {
                  return;
              }
              event.preventDefault();
              this.processDataTransfer(event.clipboardData);
              BlockManager.clearFocused();
              Toolbar.close();
          });
      }
      /**
       * Set onPaste callback and collect tools` paste configurations
       */
      prepare() {
          return __awaiter(this, void 0, void 0, function* () {
              this.processTools();
          });
      }
      /**
       * Set read-only state
       *
       * @param {boolean} readOnlyEnabled - read only flag value
       */
      toggleReadOnly(readOnlyEnabled) {
          if (!readOnlyEnabled) {
              this.setCallback();
          }
          else {
              this.unsetCallback();
          }
      }
      /**
       * Handle pasted or dropped data transfer object
       *
       * @param {DataTransfer} dataTransfer - pasted or dropped data transfer object
       * @param {boolean} isDragNDrop - true if data transfer comes from drag'n'drop events
       */
      processDataTransfer(dataTransfer, isDragNDrop = false) {
          return __awaiter(this, void 0, void 0, function* () {
              const { Sanitizer } = this.Editor;
              const types = dataTransfer.types;
              /**
               * In Microsoft Edge types is DOMStringList. So 'contains' is used to check if 'Files' type included
               */
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const includesFiles = types.includes ? types.includes('Files') : types.contains('Files');
              if (includesFiles) {
                  yield this.processFiles(dataTransfer.files);
                  return;
              }
              const editorJSData = dataTransfer.getData(this.MIME_TYPE);
              const plainData = dataTransfer.getData('text/plain');
              let htmlData = dataTransfer.getData('text/html');
              /**
               * If EditorJS json is passed, insert it
               */
              if (editorJSData) {
                  try {
                      this.insertEditorJSData(JSON.parse(editorJSData));
                      return;
                  }
                  catch (e) { } // Do nothing and continue execution as usual if error appears
              }
              /**
               *  If text was drag'n'dropped, wrap content with P tag to insert it as the new Block
               */
              if (isDragNDrop && plainData.trim() && htmlData.trim()) {
                  htmlData = '<p>' + (htmlData.trim() ? htmlData : plainData) + '</p>';
              }
              /** Add all tags that can be substituted to sanitizer configuration */
              const toolsTags = Object.keys(this.toolsTags).reduce((result, tag) => {
                  result[tag.toLowerCase()] = true;
                  return result;
              }, {});
              const customConfig = Object.assign({}, toolsTags, Sanitizer.getAllInlineToolsConfig(), { br: {} });
              const cleanData = Sanitizer.clean(htmlData, customConfig);
              /** If there is no HTML or HTML string is equal to plain one, process it as plain text */
              if (!cleanData.trim() || cleanData.trim() === plainData || !Dom.isHTMLString(cleanData)) {
                  yield this.processText(plainData);
              }
              else {
                  yield this.processText(cleanData, true);
              }
          });
      }
      /**
       * Process pasted text and divide them into Blocks
       *
       * @param {string} data - text to process. Can be HTML or plain.
       * @param {boolean} isHTML - if passed string is HTML, this parameter should be true
       */
      processText(data, isHTML = false) {
          return __awaiter(this, void 0, void 0, function* () {
              const { Caret, BlockManager, Tools } = this.Editor;
              const dataToInsert = isHTML ? this.processHTML(data) : this.processPlain(data);
              if (!dataToInsert.length) {
                  return;
              }
              if (dataToInsert.length === 1) {
                  if (!dataToInsert[0].isBlock) {
                      this.processInlinePaste(dataToInsert.pop());
                  }
                  else {
                      this.processSingleBlock(dataToInsert.pop());
                  }
                  return;
              }
              const isCurrentBlockDefault = BlockManager.currentBlock && Tools.isDefault(BlockManager.currentBlock.tool);
              const needToReplaceCurrentBlock = isCurrentBlockDefault && BlockManager.currentBlock.isEmpty;
              dataToInsert.map((content, i) => __awaiter(this, void 0, void 0, function* () { return this.insertBlock(content, i === 0 && needToReplaceCurrentBlock); }));
              if (BlockManager.currentBlock) {
                  Caret.setToBlock(BlockManager.currentBlock, Caret.positions.END);
              }
          });
      }
      /**
       * Set onPaste callback handler
       */
      setCallback() {
          const { Listeners } = this.Editor;
          Listeners.on(this.Editor.UI.nodes.holder, 'paste', this.handlePasteEvent);
      }
      /**
       * Unset onPaste callback handler
       */
      unsetCallback() {
          const { Listeners } = this.Editor;
          Listeners.off(this.Editor.UI.nodes.holder, 'paste', this.handlePasteEvent);
      }
      /**
       * Get and process tool`s paste configs
       */
      processTools() {
          const tools = this.Editor.Tools.blockTools;
          Object.entries(tools).forEach(this.processTool);
      }
      /**
       * Get tags to substitute by Tool
       *
       * @param {string} name - Tool name
       * @param {PasteConfig} toolPasteConfig - Tool onPaste configuration
       */
      getTagsConfig(name, toolPasteConfig) {
          const tags = toolPasteConfig.tags || [];
          tags.forEach((tag) => {
              if (Object.prototype.hasOwnProperty.call(this.toolsTags, tag)) {
                  log(`Paste handler for ${name}» Tool on ${tag}» tag is skipped ` +
                      `because it is already used by ${this.toolsTags[tag].tool}» Tool.`, 'warn');
                  return;
              }
              this.toolsTags[tag.toUpperCase()] = {
                  tool: name,
              };
          });
          this.tagsByTool[name] = tags.map((t) => t.toUpperCase());
      }
      /**
       * Get files` types and extensions to substitute by Tool
       *
       * @param {string} name - Tool name
       * @param {PasteConfig} toolPasteConfig - Tool onPaste configuration
       */
      getFilesConfig(name, toolPasteConfig) {
          const { files = {} } = toolPasteConfig;
          let { extensions, mimeTypes } = files;
          if (!extensions && !mimeTypes) {
              return;
          }
          if (extensions && !Array.isArray(extensions)) {
              log(`«extensions» property of the onDrop config for ${name}» Tool should be an array`);
              extensions = [];
          }
          if (mimeTypes && !Array.isArray(mimeTypes)) {
              log(`«mimeTypes» property of the onDrop config for ${name}» Tool should be an array`);
              mimeTypes = [];
          }
          if (mimeTypes) {
              mimeTypes = mimeTypes.filter((type) => {
                  if (!isValidMimeType(type)) {
                      log(`MIME type value ${type}» for the ${name}» Tool is not a valid MIME type`, 'warn');
                      return false;
                  }
                  return true;
              });
          }
          this.toolsFiles[name] = {
              extensions: extensions || [],
              mimeTypes: mimeTypes || [],
          };
      }
      /**
       * Get RegExp patterns to substitute by Tool
       *
       * @param {string} name - Tool name
       * @param {PasteConfig} toolPasteConfig - Tool onPaste configuration
       */
      getPatternsConfig(name, toolPasteConfig) {
          if (!toolPasteConfig.patterns || isEmpty(toolPasteConfig.patterns)) {
              return;
          }
          Object.entries(toolPasteConfig.patterns).forEach(([key, pattern]) => {
              /** Still need to validate pattern as it provided by user */
              if (!(pattern instanceof RegExp)) {
                  log(`Pattern ${pattern} for ${name}» Tool is skipped because it should be a Regexp instance.`, 'warn');
              }
              this.toolsPatterns.push({
                  key,
                  pattern,
                  tool: name,
              });
          });
      }
      /**
       * Check if browser behavior suits better
       *
       * @param {EventTarget} element - element where content has been pasted
       *
       * @returns {boolean}
       */
      isNativeBehaviour(element) {
          return Dom.isNativeInput(element);
      }
      /**
       * Get files from data transfer object and insert related Tools
       *
       * @param {FileList} items - pasted or dropped items
       */
      processFiles(items) {
          return __awaiter(this, void 0, void 0, function* () {
              const { BlockManager, Tools } = this.Editor;
              let dataToInsert;
              dataToInsert = yield Promise.all(Array
                  .from(items)
                  .map((item) => this.processFile(item)));
              dataToInsert = dataToInsert.filter((data) => !!data);
              const isCurrentBlockDefault = Tools.isDefault(BlockManager.currentBlock.tool);
              const needToReplaceCurrentBlock = isCurrentBlockDefault && BlockManager.currentBlock.isEmpty;
              dataToInsert.forEach((data, i) => {
                  BlockManager.paste(data.type, data.event, i === 0 && needToReplaceCurrentBlock);
              });
          });
      }
      /**
       * Get information about file and find Tool to handle it
       *
       * @param {File} file - file to process
       */
      processFile(file) {
          return __awaiter(this, void 0, void 0, function* () {
              const extension = getFileExtension(file);
              const foundConfig = Object
                  .entries(this.toolsFiles)
                  .find(([toolName, { mimeTypes, extensions }]) => {
                  const [fileType, fileSubtype] = file.type.split('/');
                  const foundExt = extensions.find((ext) => ext.toLowerCase() === extension.toLowerCase());
                  const foundMimeType = mimeTypes.find((mime) => {
                      const [type, subtype] = mime.split('/');
                      return type === fileType && (subtype === fileSubtype || subtype === '*');
                  });
                  return !!foundExt || !!foundMimeType;
              });
              if (!foundConfig) {
                  return;
              }
              const [tool] = foundConfig;
              const pasteEvent = this.composePasteEvent('file', {
                  file,
              });
              return {
                  event: pasteEvent,
                  type: tool,
              };
          });
      }
      /**
       * Split HTML string to blocks and return it as array of Block data
       *
       * @param {string} innerHTML - html string to process
       *
       * @returns {PasteData[]}
       */
      processHTML(innerHTML) {
          const { Tools, Sanitizer } = this.Editor;
          const initialTool = this.config.defaultBlock;
          const wrapper = Dom.make('DIV');
          wrapper.innerHTML = innerHTML;
          const nodes = this.getNodes(wrapper);
          return nodes
              .map((node) => {
              let content, tool = initialTool, isBlock = false;
              switch (node.nodeType) {
                  /** If node is a document fragment, use temp wrapper to get innerHTML */
                  case Node.DOCUMENT_FRAGMENT_NODE:
                      content = Dom.make('div');
                      content.appendChild(node);
                      break;
                  /** If node is an element, then there might be a substitution */
                  case Node.ELEMENT_NODE:
                      content = node;
                      isBlock = true;
                      if (this.toolsTags[content.tagName]) {
                          tool = this.toolsTags[content.tagName].tool;
                      }
                      break;
              }
              const { tags } = Tools.blockTools[tool].pasteConfig;
              const toolTags = tags.reduce((result, tag) => {
                  result[tag.toLowerCase()] = {};
                  return result;
              }, {});
              const customConfig = Object.assign({}, toolTags, Sanitizer.getInlineToolsConfig(tool));
              content.innerHTML = Sanitizer.clean(content.innerHTML, customConfig);
              const event = this.composePasteEvent('tag', {
                  data: content,
              });
              return {
                  content,
                  isBlock,
                  tool,
                  event,
              };
          })
              .filter((data) => !Dom.isNodeEmpty(data.content) || Dom.isSingleTag(data.content));
      }
      /**
       * Split plain text by new line symbols and return it as array of Block data
       *
       * @param {string} plain - string to process
       *
       * @returns {PasteData[]}
       */
      processPlain(plain) {
          const { defaultBlock } = this.config;
          if (!plain) {
              return [];
          }
          const tool = defaultBlock;
          return plain
              .split(/\r?\n/)
              .filter((text) => text.trim())
              .map((text) => {
              const content = Dom.make('div');
              content.textContent = text;
              const event = this.composePasteEvent('tag', {
                  data: content,
              });
              return {
                  content,
                  tool,
                  isBlock: false,
                  event,
              };
          });
      }
      /**
       * Process paste of single Block tool content
       *
       * @param {PasteData} dataToInsert - data of Block to inseret
       */
      processSingleBlock(dataToInsert) {
          return __awaiter(this, void 0, void 0, function* () {
              const { Caret, BlockManager, Tools } = this.Editor;
              const { currentBlock } = BlockManager;
              /**
               * If pasted tool isn`t equal current Block or if pasted content contains block elements, insert it as new Block
               */
              if (!currentBlock ||
                  dataToInsert.tool !== currentBlock.name ||
                  !Dom.containsOnlyInlineElements(dataToInsert.content.innerHTML)) {
                  this.insertBlock(dataToInsert, currentBlock && Tools.isDefault(currentBlock.tool) && currentBlock.isEmpty);
                  return;
              }
              Caret.insertContentAtCaretPosition(dataToInsert.content.innerHTML);
          });
      }
      /**
       * Process paste to single Block:
       * 1. Find patterns` matches
       * 2. Insert new block if it is not the same type as current one
       * 3. Just insert text if there is no substitutions
       *
       * @param {PasteData} dataToInsert - data of Block to insert
       */
      processInlinePaste(dataToInsert) {
          return __awaiter(this, void 0, void 0, function* () {
              const { BlockManager, Caret, Sanitizer, Tools } = this.Editor;
              const { content } = dataToInsert;
              const currentBlockIsDefault = BlockManager.currentBlock && Tools.isDefault(BlockManager.currentBlock.tool);
              if (currentBlockIsDefault && content.textContent.length < Paste.PATTERN_PROCESSING_MAX_LENGTH) {
                  const blockData = yield this.processPattern(content.textContent);
                  if (blockData) {
                      const needToReplaceCurrentBlock = BlockManager.currentBlock &&
                          Tools.isDefault(BlockManager.currentBlock.tool) &&
                          BlockManager.currentBlock.isEmpty;
                      const insertedBlock = BlockManager.paste(blockData.tool, blockData.event, needToReplaceCurrentBlock);
                      Caret.setToBlock(insertedBlock, Caret.positions.END);
                      return;
                  }
              }
              /** If there is no pattern substitute - insert string as it is */
              if (BlockManager.currentBlock && BlockManager.currentBlock.currentInput) {
                  const currentToolSanitizeConfig = Sanitizer.getInlineToolsConfig(BlockManager.currentBlock.name);
                  document.execCommand('insertHTML', false, Sanitizer.clean(content.innerHTML, currentToolSanitizeConfig));
              }
              else {
                  this.insertBlock(dataToInsert);
              }
          });
      }
      /**
       * Get patterns` matches
       *
       * @param {string} text - text to process
       *
       * @returns {Promise<{event: PasteEvent, tool: string}>}
       */
      processPattern(text) {
          return __awaiter(this, void 0, void 0, function* () {
              const pattern = this.toolsPatterns.find((substitute) => {
                  const execResult = substitute.pattern.exec(text);
                  if (!execResult) {
                      return false;
                  }
                  return text === execResult.shift();
              });
              if (!pattern) {
                  return;
              }
              const event = this.composePasteEvent('pattern', {
                  key: pattern.key,
                  data: text,
              });
              return {
                  event,
                  tool: pattern.tool,
              };
          });
      }
      /**
       * Insert pasted Block content to Editor
       *
       * @param {PasteData} data - data to insert
       * @param {boolean} canReplaceCurrentBlock - if true and is current Block is empty, will replace current Block
       *
       * @returns {void}
       */
      insertBlock(data, canReplaceCurrentBlock = false) {
          const { BlockManager, Caret } = this.Editor;
          const { currentBlock } = BlockManager;
          let block;
          if (canReplaceCurrentBlock && currentBlock && currentBlock.isEmpty) {
              block = BlockManager.paste(data.tool, data.event, true);
              Caret.setToBlock(block, Caret.positions.END);
              return;
          }
          block = BlockManager.paste(data.tool, data.event);
          Caret.setToBlock(block, Caret.positions.END);
      }
      /**
       * Insert data passed as application/x-editor-js JSON
       *
       * @param {Array} blocks — Blocks' data to insert
       *
       * @returns {void}
       */
      insertEditorJSData(blocks) {
          const { BlockManager, Tools } = this.Editor;
          blocks.forEach(({ tool, data }, i) => {
              let needToReplaceCurrentBlock = false;
              if (i === 0) {
                  const isCurrentBlockDefault = BlockManager.currentBlock && Tools.isDefault(BlockManager.currentBlock.tool);
                  needToReplaceCurrentBlock = isCurrentBlockDefault && BlockManager.currentBlock.isEmpty;
              }
              BlockManager.insert({
                  tool,
                  data,
                  replace: needToReplaceCurrentBlock,
              });
          });
      }
      /**
       * Fetch nodes from Element node
       *
       * @param {Node} node - current node
       * @param {Node[]} nodes - processed nodes
       * @param {Node} destNode - destination node
       *
       * @returns {Node[]}
       */
      processElementNode(node, nodes, destNode) {
          const tags = Object.keys(this.toolsTags);
          const element = node;
          const { tool = '' } = this.toolsTags[element.tagName] || {};
          const toolTags = this.tagsByTool[tool] || [];
          const isSubstitutable = tags.includes(element.tagName);
          const isBlockElement = Dom.blockElements.includes(element.tagName.toLowerCase());
          const containsAnotherToolTags = Array
              .from(element.children)
              .some(({ tagName }) => tags.includes(tagName) && !toolTags.includes(tagName));
          const containsBlockElements = Array.from(element.children).some(({ tagName }) => Dom.blockElements.includes(tagName.toLowerCase()));
          /** Append inline elements to previous fragment */
          if (!isBlockElement && !isSubstitutable && !containsAnotherToolTags) {
              destNode.appendChild(element);
              return [...nodes, destNode];
          }
          if ((isSubstitutable && !containsAnotherToolTags) ||
              (isBlockElement && !containsBlockElements && !containsAnotherToolTags)) {
              return [...nodes, destNode, element];
          }
      }
      /**
       * Recursively divide HTML string to two types of nodes:
       * 1. Block element
       * 2. Document Fragments contained text and markup tags like a, b, i etc.
       *
       * @param {Node} wrapper - wrapper of paster HTML content
       *
       * @returns {Node[]}
       */
      getNodes(wrapper) {
          const children = Array.from(wrapper.childNodes);
          let elementNodeProcessingResult;
          const reducer = (nodes, node) => {
              if (Dom.isEmpty(node) && !Dom.isSingleTag(node)) {
                  return nodes;
              }
              const lastNode = nodes[nodes.length - 1];
              let destNode = new DocumentFragment();
              if (lastNode && Dom.isFragment(lastNode)) {
                  destNode = nodes.pop();
              }
              switch (node.nodeType) {
                  /**
                   * If node is HTML element:
                   * 1. Check if it is inline element
                   * 2. Check if it contains another block or substitutable elements
                   */
                  case Node.ELEMENT_NODE:
                      elementNodeProcessingResult = this.processElementNode(node, nodes, destNode);
                      if (elementNodeProcessingResult) {
                          return elementNodeProcessingResult;
                      }
                      break;
                  /**
                   * If node is text node, wrap it with DocumentFragment
                   */
                  case Node.TEXT_NODE:
                      destNode.appendChild(node);
                      return [...nodes, destNode];
                  default:
                      return [...nodes, destNode];
              }
              return [...nodes, ...Array.from(node.childNodes).reduce(reducer, [])];
          };
          return children.reduce(reducer, []);
      }
      /**
       * Compose paste event with passed type and detail
       *
       * @param {string} type - event type
       * @param {PasteEventDetail} detail - event detail
       */
      composePasteEvent(type, detail) {
          return new CustomEvent(type, {
              detail,
          });
      }
  }
  Paste.displayName = 'Paste';
  /** If string`s length is greater than this number we don't check paste patterns */
  Paste.PATTERN_PROCESSING_MAX_LENGTH = 450;

  /**
   * @module ReadOnly
   *
   * Has one important method:
   *    - {Function} toggleReadonly - Set read-only mode or toggle current state
   *
   * @version 1.0.0
   *
   * @typedef {ReadOnly} ReadOnly
   * @property {boolean} readOnlyEnabled - read-only state
   */
  class ReadOnly extends Module {
      constructor() {
          super(...arguments);
          /**
           * Array of tools name which don't support read-only mode
           */
          this.toolsDontSupportReadOnly = [];
          /**
           * Value to track read-only state
           *
           * @type {boolean}
           */
          this.readOnlyEnabled = false;
      }
      /**
       * Returns state of read only mode
       */
      get isEnabled() {
          return this.readOnlyEnabled;
      }
      /**
       * Set initial state
       */
      prepare() {
          return __awaiter(this, void 0, void 0, function* () {
              const { Tools } = this.Editor;
              const { blockTools } = Tools;
              const toolsDontSupportReadOnly = [];
              Object.entries(blockTools).forEach(([name, tool]) => {
                  if (!Tools.isReadOnlySupported(tool)) {
                      toolsDontSupportReadOnly.push(name);
                  }
              });
              this.toolsDontSupportReadOnly = toolsDontSupportReadOnly;
              if (this.config.readOnly && toolsDontSupportReadOnly.length > 0) {
                  this.throwCriticalError();
              }
              this.toggle(this.config.readOnly);
          });
      }
      /**
       * Set read-only mode or toggle current state
       * Call all Modules `toggleReadOnly` method and re-render Editor
       *
       * @param {boolean} state - (optional) read-only state or toggle
       */
      toggle(state = !this.readOnlyEnabled) {
          return __awaiter(this, void 0, void 0, function* () {
              if (state && this.toolsDontSupportReadOnly.length > 0) {
                  this.throwCriticalError();
              }
              const oldState = this.readOnlyEnabled;
              this.readOnlyEnabled = state;
              for (const name in this.Editor) {
                  /**
                   * Verify module has method `toggleReadOnly` method
                   */
                  if (!this.Editor[name].toggleReadOnly) {
                      continue;
                  }
                  /**
                   * set or toggle read-only state
                   */
                  this.Editor[name].toggleReadOnly(state);
              }
              /**
               * If new state equals old one, do not re-render blocks
               */
              if (oldState === state) {
                  return this.readOnlyEnabled;
              }
              /**
               * Save current Editor Blocks and render again
               */
              const savedBlocks = yield this.Editor.Saver.save();
              yield this.Editor.BlockManager.clear();
              yield this.Editor.Renderer.render(savedBlocks.blocks);
              return this.readOnlyEnabled;
          });
      }
      /**
       * Throws an error about tools which don't support read-only mode
       */
      throwCriticalError() {
          throw new CriticalError(`To enable read-only mode all connected tools should support it. Tools ${this.toolsDontSupportReadOnly.join(', ')} don't support read-only mode.`);
      }
  }
  ReadOnly.displayName = 'ReadOnly';

  /**
   * @class RectangleSelection
   * @classdesc Manages Block selection with mouse
   *
   * @module RectangleSelection
   * @version 1.0.0
   */
  class RectangleSelection extends Module {
      constructor() {
          super(...arguments);
          this.isRectSelectionActivated = false;
          /**
           *  Speed of Scrolling
           */
          this.SCROLL_SPEED = 3;
          /**
           *  Height of scroll zone on boundary of screen
           */
          this.HEIGHT_OF_SCROLL_ZONE = 40;
          /**
           *  Scroll zone type indicators
           */
          this.BOTTOM_SCROLL_ZONE = 1;
          this.TOP_SCROLL_ZONE = 2;
          /**
           * Id of main button for event.button
           */
          this.MAIN_MOUSE_BUTTON = 0;
          /**
           *  Mouse is clamped
           */
          this.mousedown = false;
          /**
           *  Is scrolling now
           */
          this.isScrolling = false;
          /**
           *  Mouse is in scroll zone
           */
          this.inScrollZone = null;
          /**
           *  Coords of rect
           */
          this.startX = 0;
          this.startY = 0;
          this.mouseX = 0;
          this.mouseY = 0;
          /**
           * Selected blocks
           */
          this.stackOfSelected = [];
          /**
           * Listener identifiers
           */
          this.listenerIds = [];
      }
      static get CSS() {
          return {
              overlay: 'codex-editor-overlay',
              overlayContainer: 'codex-editor-overlay__container',
              rect: 'codex-editor-overlay__rectangle',
              topScrollZone: 'codex-editor-overlay__scroll-zone--top',
              bottomScrollZone: 'codex-editor-overlay__scroll-zone--bottom',
          };
      }
      /**
       * Module Preparation
       * Creating rect and hang handlers
       */
      prepare() {
          this.enableModuleBindings();
      }
      /**
       * Init rect params
       *
       * @param {number} pageX - X coord of mouse
       * @param {number} pageY - Y coord of mouse
       */
      startSelection(pageX, pageY) {
          const elemWhereSelectionStart = document.elementFromPoint(pageX - window.pageXOffset, pageY - window.pageYOffset);
          /**
           * Don't clear selected block by clicks on the Block settings
           * because we need to keep highlighting working block
           */
          const startsInsideToolbar = elemWhereSelectionStart.closest(`.${this.Editor.Toolbar.CSS.toolbar}`);
          if (!startsInsideToolbar) {
              this.Editor.BlockSelection.allBlocksSelected = false;
              this.clearSelection();
              this.stackOfSelected = [];
          }
          const selectorsToAvoid = [
              `.${Block.CSS.content}`,
              `.${this.Editor.Toolbar.CSS.toolbar}`,
              `.${this.Editor.InlineToolbar.CSS.inlineToolbar}`,
          ];
          const startsInsideEditor = elemWhereSelectionStart.closest('.' + this.Editor.UI.CSS.editorWrapper);
          const startsInSelectorToAvoid = selectorsToAvoid.some((selector) => !!elemWhereSelectionStart.closest(selector));
          /**
           * If selection starts outside of the editor or inside the blocks or on Editor UI elements, do not handle it
           */
          if (!startsInsideEditor || startsInSelectorToAvoid) {
              return;
          }
          this.mousedown = true;
          this.startX = pageX;
          this.startY = pageY;
      }
      /**
       * Clear all params to end selection
       */
      endSelection() {
          this.mousedown = false;
          this.startX = 0;
          this.startY = 0;
          this.overlayRectangle.style.display = 'none';
      }
      /**
       * is RectSelection Activated
       */
      isRectActivated() {
          return this.isRectSelectionActivated;
      }
      /**
       * Mark that selection is end
       */
      clearSelection() {
          this.isRectSelectionActivated = false;
      }
      /**
       * Sets Module necessary event handlers
       */
      enableModuleBindings() {
          const { Listeners } = this.Editor;
          const { container } = this.genHTML();
          Listeners.on(container, 'mousedown', (mouseEvent) => {
              this.processMouseDown(mouseEvent);
          }, false);
          Listeners.on(document.body, 'mousemove', (mouseEvent) => {
              this.processMouseMove(mouseEvent);
          }, false);
          Listeners.on(document.body, 'mouseleave', () => {
              this.processMouseLeave();
          });
          Listeners.on(window, 'scroll', (mouseEvent) => {
              this.processScroll(mouseEvent);
          }, false);
          Listeners.on(document.body, 'mouseup', () => {
              this.processMouseUp();
          }, false);
      }
      /**
       * Handle mouse down events
       *
       * @param {MouseEvent} mouseEvent - mouse event payload
       */
      processMouseDown(mouseEvent) {
          if (mouseEvent.button !== this.MAIN_MOUSE_BUTTON) {
              return;
          }
          this.startSelection(mouseEvent.pageX, mouseEvent.pageY);
      }
      /**
       * Handle mouse move events
       *
       * @param {MouseEvent} mouseEvent - mouse event payload
       */
      processMouseMove(mouseEvent) {
          this.changingRectangle(mouseEvent);
          this.scrollByZones(mouseEvent.clientY);
      }
      /**
       * Handle mouse leave
       */
      processMouseLeave() {
          this.clearSelection();
          this.endSelection();
      }
      /**
       * @param {MouseEvent} mouseEvent - mouse event payload
       */
      processScroll(mouseEvent) {
          this.changingRectangle(mouseEvent);
      }
      /**
       * Handle mouse up
       */
      processMouseUp() {
          this.endSelection();
      }
      /**
       * Scroll If mouse in scroll zone
       *
       * @param {number} clientY - Y coord of mouse
       */
      scrollByZones(clientY) {
          this.inScrollZone = null;
          if (clientY <= this.HEIGHT_OF_SCROLL_ZONE) {
              this.inScrollZone = this.TOP_SCROLL_ZONE;
          }
          if (document.documentElement.clientHeight - clientY <= this.HEIGHT_OF_SCROLL_ZONE) {
              this.inScrollZone = this.BOTTOM_SCROLL_ZONE;
          }
          if (!this.inScrollZone) {
              this.isScrolling = false;
              return;
          }
          if (!this.isScrolling) {
              this.scrollVertical(this.inScrollZone === this.TOP_SCROLL_ZONE ? -this.SCROLL_SPEED : this.SCROLL_SPEED);
              this.isScrolling = true;
          }
      }
      /**
       * Generates required HTML elements
       *
       * @returns {object<string, Element>}
       */
      genHTML() {
          const { UI } = this.Editor;
          const container = UI.nodes.holder.querySelector('.' + UI.CSS.editorWrapper);
          const overlay = Dom.make('div', RectangleSelection.CSS.overlay, {});
          const overlayContainer = Dom.make('div', RectangleSelection.CSS.overlayContainer, {});
          const overlayRectangle = Dom.make('div', RectangleSelection.CSS.rect, {});
          overlayContainer.appendChild(overlayRectangle);
          overlay.appendChild(overlayContainer);
          container.appendChild(overlay);
          this.overlayRectangle = overlayRectangle;
          return {
              container,
              overlay,
          };
      }
      /**
       * Activates scrolling if blockSelection is active and mouse is in scroll zone
       *
       * @param {number} speed - speed of scrolling
       */
      scrollVertical(speed) {
          if (!(this.inScrollZone && this.mousedown)) {
              return;
          }
          const lastOffset = window.pageYOffset;
          window.scrollBy(0, speed);
          this.mouseY += window.pageYOffset - lastOffset;
          setTimeout(() => {
              this.scrollVertical(speed);
          }, 0);
      }
      /**
       * Handles the change in the rectangle and its effect
       *
       * @param {MouseEvent} event - mouse event
       */
      changingRectangle(event) {
          if (!this.mousedown) {
              return;
          }
          if (event.pageY !== undefined) {
              this.mouseX = event.pageX;
              this.mouseY = event.pageY;
          }
          const { rightPos, leftPos, index } = this.genInfoForMouseSelection();
          // There is not new block in selection
          const rectIsOnRighSideOfredactor = this.startX > rightPos && this.mouseX > rightPos;
          const rectISOnLeftSideOfRedactor = this.startX < leftPos && this.mouseX < leftPos;
          this.rectCrossesBlocks = !(rectIsOnRighSideOfredactor || rectISOnLeftSideOfRedactor);
          if (!this.isRectSelectionActivated) {
              this.rectCrossesBlocks = false;
              this.isRectSelectionActivated = true;
              this.shrinkRectangleToPoint();
              this.overlayRectangle.style.display = 'block';
          }
          this.updateRectangleSize();
          if (index === undefined) {
              return;
          }
          this.trySelectNextBlock(index);
          // For case, when rect is out from blocks
          this.inverseSelection();
          SelectionUtils.get().removeAllRanges();
          event.preventDefault();
      }
      /**
       * Shrink rect to singular point
       */
      shrinkRectangleToPoint() {
          this.overlayRectangle.style.left = `${this.startX - window.pageXOffset}px`;
          this.overlayRectangle.style.top = `${this.startY - window.pageYOffset}px`;
          this.overlayRectangle.style.bottom = `calc(100% - ${this.startY - window.pageYOffset}px`;
          this.overlayRectangle.style.right = `calc(100% - ${this.startX - window.pageXOffset}px`;
      }
      /**
       * Select or unselect all of blocks in array if rect is out or in selectable area
       */
      inverseSelection() {
          const firstBlockInStack = this.Editor.BlockManager.getBlockByIndex(this.stackOfSelected[0]);
          const isSelectedMode = firstBlockInStack.selected;
          if (this.rectCrossesBlocks && !isSelectedMode) {
              for (const it of this.stackOfSelected) {
                  this.Editor.BlockSelection.selectBlockByIndex(it);
              }
          }
          if (!this.rectCrossesBlocks && isSelectedMode) {
              for (const it of this.stackOfSelected) {
                  this.Editor.BlockSelection.unSelectBlockByIndex(it);
              }
          }
      }
      /**
       * Updates size of rectangle
       */
      updateRectangleSize() {
          // Depending on the position of the mouse relative to the starting point,
          // change this.e distance from the desired edge of the screen*/
          if (this.mouseY >= this.startY) {
              this.overlayRectangle.style.top = `${this.startY - window.pageYOffset}px`;
              this.overlayRectangle.style.bottom = `calc(100% - ${this.mouseY - window.pageYOffset}px`;
          }
          else {
              this.overlayRectangle.style.bottom = `calc(100% - ${this.startY - window.pageYOffset}px`;
              this.overlayRectangle.style.top = `${this.mouseY - window.pageYOffset}px`;
          }
          if (this.mouseX >= this.startX) {
              this.overlayRectangle.style.left = `${this.startX - window.pageXOffset}px`;
              this.overlayRectangle.style.right = `calc(100% - ${this.mouseX - window.pageXOffset}px`;
          }
          else {
              this.overlayRectangle.style.right = `calc(100% - ${this.startX - window.pageXOffset}px`;
              this.overlayRectangle.style.left = `${this.mouseX - window.pageXOffset}px`;
          }
      }
      /**
       * Collects information needed to determine the behavior of the rectangle
       *
       * @returns {object} index - index next Block, leftPos - start of left border of Block, rightPos - right border
       */
      genInfoForMouseSelection() {
          const widthOfRedactor = document.body.offsetWidth;
          const centerOfRedactor = widthOfRedactor / 2;
          const Y = this.mouseY - window.pageYOffset;
          const elementUnderMouse = document.elementFromPoint(centerOfRedactor, Y);
          const blockInCurrentPos = this.Editor.BlockManager.getBlockByChildNode(elementUnderMouse);
          let index;
          if (blockInCurrentPos !== undefined) {
              index = this.Editor.BlockManager.blocks.findIndex((block) => block.holder === blockInCurrentPos.holder);
          }
          const contentElement = this.Editor.BlockManager.lastBlock.holder.querySelector('.' + Block.CSS.content);
          const centerOfBlock = Number.parseInt(window.getComputedStyle(contentElement).width, 10) / 2;
          const leftPos = centerOfRedactor - centerOfBlock;
          const rightPos = centerOfRedactor + centerOfBlock;
          return {
              index,
              leftPos,
              rightPos,
          };
      }
      /**
       * Select block with index index
       *
       * @param index - index of block in redactor
       */
      addBlockInSelection(index) {
          if (this.rectCrossesBlocks) {
              this.Editor.BlockSelection.selectBlockByIndex(index);
          }
          this.stackOfSelected.push(index);
      }
      /**
       * Adds a block to the selection and determines which blocks should be selected
       *
       * @param {object} index - index of new block in the reactor
       */
      trySelectNextBlock(index) {
          const sameBlock = this.stackOfSelected[this.stackOfSelected.length - 1] === index;
          const sizeStack = this.stackOfSelected.length;
          const down = 1, up = -1, undef = 0;
          if (sameBlock) {
              return;
          }
          const blockNumbersIncrease = this.stackOfSelected[sizeStack - 1] - this.stackOfSelected[sizeStack - 2] > 0;
          let direction = undef;
          if (sizeStack > 1) {
              direction = blockNumbersIncrease ? down : up;
          }
          const selectionInDownDirection = index > this.stackOfSelected[sizeStack - 1] && direction === down;
          const selectionInUpDirection = index < this.stackOfSelected[sizeStack - 1] && direction === up;
          const generalSelection = selectionInDownDirection || selectionInUpDirection || direction === undef;
          const reduction = !generalSelection;
          // When the selection is too fast, some blocks do not have time to be noticed. Fix it.
          if (!reduction && (index > this.stackOfSelected[sizeStack - 1] ||
              this.stackOfSelected[sizeStack - 1] === undefined)) {
              let ind = this.stackOfSelected[sizeStack - 1] + 1 || index;
              for (ind; ind <= index; ind++) {
                  this.addBlockInSelection(ind);
              }
              return;
          }
          // for both directions
          if (!reduction && (index < this.stackOfSelected[sizeStack - 1])) {
              for (let ind = this.stackOfSelected[sizeStack - 1] - 1; ind >= index; ind--) {
                  this.addBlockInSelection(ind);
              }
              return;
          }
          if (!reduction) {
              return;
          }
          let i = sizeStack - 1;
          let cmp;
          // cmp for different directions
          if (index > this.stackOfSelected[sizeStack - 1]) {
              cmp = () => index > this.stackOfSelected[i];
          }
          else {
              cmp = () => index < this.stackOfSelected[i];
          }
          // Remove blocks missed due to speed.
          // cmp checks if we have removed all the necessary blocks
          while (cmp()) {
              if (this.rectCrossesBlocks) {
                  this.Editor.BlockSelection.unSelectBlockByIndex(this.stackOfSelected[i]);
              }
              this.stackOfSelected.pop();
              i--;
          }
      }
  }
  RectangleSelection.displayName = 'RectangleSelection';

  /**
   * Editor.js Renderer Module
   *
   * @module Renderer
   * @author CodeX Team
   *
   * @version 2.0.0
   */
  class Renderer extends Module {
      /**
       * @typedef {object} RendererBlocks
       * @property {string} type - tool name
       * @property {object} data - tool data
       */
      /**
       * @example
       *
       * blocks: [
       *   {
       *     type : 'paragraph',
       *     data : {
       *       text : 'Hello from Codex!'
       *     }
       *   },
       *   {
       *     type : 'paragraph',
       *     data : {
       *       text : 'Leave feedback if you like it!'
       *     }
       *   },
       * ]
       *
       */
      /**
       * Make plugin blocks from array of plugin`s data
       *
       * @param {OutputBlockData[]} blocks - blocks to render
       */
      render(blocks) {
          return __awaiter(this, void 0, void 0, function* () {
              const chainData = blocks.map((block) => ({ function: () => this.insertBlock(block) }));
              const sequence$1 = yield sequence(chainData);
              this.Editor.UI.checkEmptiness();
              return sequence$1;
          });
      }
      /**
       * Get plugin instance
       * Add plugin instance to BlockManager
       * Insert block to working zone
       *
       * @param {object} item - Block data to insert
       *
       * @returns {Promise<void>}
       */
      insertBlock(item) {
          return __awaiter(this, void 0, void 0, function* () {
              const { Tools, BlockManager } = this.Editor;
              const tool = item.type;
              const data = item.data;
              if (tool in Tools.available) {
                  try {
                      BlockManager.insert({
                          tool,
                          data,
                      });
                  }
                  catch (error) {
                      log(`Block «${tool}» skipped because of plugins error`, 'warn', data);
                      throw Error(error);
                  }
              }
              else {
                  /** If Tool is unavailable, create stub Block for it */
                  const stubData = {
                      savedData: {
                          type: tool,
                          data,
                      },
                      title: tool,
                  };
                  if (tool in Tools.unavailable) {
                      const toolToolboxSettings = Tools.unavailable[tool].toolbox;
                      const userToolboxSettings = Tools.getToolSettings(tool).toolbox;
                      stubData.title = toolToolboxSettings.title || (userToolboxSettings && userToolboxSettings.title) || stubData.title;
                  }
                  const stub = BlockManager.insert({
                      tool: Tools.stubTool,
                      data: stubData,
                  });
                  stub.stretched = true;
                  log(`Tool «${tool}» is not found. Check 'tools' property at your initial Editor.js config.`, 'warn');
              }
          });
      }
  }
  Renderer.displayName = 'Renderer';

  var htmlJanitor = createCommonjsModule(function (module, exports) {
  (function (root, factory) {
    {
      module.exports = factory();
    }
  }(commonjsGlobal, function () {

    /**
     * @param {Object} config.tags Dictionary of allowed tags.
     * @param {boolean} config.keepNestedBlockElements Default false.
     */
    function HTMLJanitor(config) {

      var tagDefinitions = config['tags'];
      var tags = Object.keys(tagDefinitions);

      var validConfigValues = tags
        .map(function(k) { return typeof tagDefinitions[k]; })
        .every(function(type) { return type === 'object' || type === 'boolean' || type === 'function'; });

      if(!validConfigValues) {
        throw new Error("The configuration was invalid");
      }

      this.config = config;
    }

    // TODO: not exhaustive?
    var blockElementNames = ['P', 'LI', 'TD', 'TH', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE'];
    function isBlockElement(node) {
      return blockElementNames.indexOf(node.nodeName) !== -1;
    }

    var inlineElementNames = ['A', 'B', 'STRONG', 'I', 'EM', 'SUB', 'SUP', 'U', 'STRIKE'];
    function isInlineElement(node) {
      return inlineElementNames.indexOf(node.nodeName) !== -1;
    }

    HTMLJanitor.prototype.clean = function (html) {
      const sandbox = document.implementation.createHTMLDocument();
      const root = sandbox.createElement("div");
      root.innerHTML = html;

      this._sanitize(sandbox, root);

      return root.innerHTML;
    };

    HTMLJanitor.prototype._sanitize = function (document, parentNode) {
      var treeWalker = createTreeWalker(document, parentNode);
      var node = treeWalker.firstChild();

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

        var isInline = isInlineElement(node);
        var containsBlockElement;
        if (isInline) {
          containsBlockElement = Array.prototype.some.call(node.childNodes, isBlockElement);
        }

        // Block elements should not be nested (e.g. <li><p>...); if
        // they are, we want to unwrap the inner block element.
        var isNotTopContainer = !! parentNode.parentNode;
        var isNestedBlockElement =
              isBlockElement(parentNode) &&
              isBlockElement(node) &&
              isNotTopContainer;

        var nodeName = node.nodeName.toLowerCase();

        var allowedAttrs = getAllowedAttrs(this.config, nodeName, node);

        var isInvalid = isInline && containsBlockElement;

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
        for (var a = 0; a < node.attributes.length; a += 1) {
          var attr = node.attributes[a];

          if (shouldRejectAttr(attr, allowedAttrs, node)) {
            node.removeAttribute(attr.name);
            // Shift the array to continue looping.
            a = a - 1;
          }
        }

        // Sanitize children
        this._sanitize(document, node);

      } while ((node = treeWalker.nextSibling()));
    };

    function createTreeWalker(document, node) {
      return document.createTreeWalker(node,
                                       NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT,
                                       null, false);
    }

    function getAllowedAttrs(config, nodeName, node){
      if (typeof config.tags[nodeName] === 'function') {
        return config.tags[nodeName](node);
      } else {
        return config.tags[nodeName];
      }
    }

    function shouldRejectNode(node, allowedAttrs){
      if (typeof allowedAttrs === 'undefined') {
        return true;
      } else if (typeof allowedAttrs === 'boolean') {
        return !allowedAttrs;
      }

      return false;
    }

    function shouldRejectAttr(attr, allowedAttrs, node){
      var attrName = attr.name.toLowerCase();

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

    return HTMLJanitor;

  }));
  });

  /**
   * CodeX Sanitizer
   *
   * @module Sanitizer
   * Clears HTML from taint tags
   *
   * @version 2.0.0
   *
   * @example
   *  Module can be used within two ways:
   *     1) When you have an instance
   *         - this.Editor.Sanitizer.clean(yourTaintString);
   *     2) As static method
   *         - EditorJS.Sanitizer.clean(yourTaintString, yourCustomConfiguration);
   *
   * {@link SanitizerConfig}
   */
  /**
   *
   */
  class Sanitizer extends Module {
      constructor() {
          super(...arguments);
          /**
           * Memoize tools config
           */
          this.configCache = {};
          /**
           * Cached inline tools config
           */
          this.inlineToolsConfigCache = null;
      }
      /**
       * Sanitize Blocks
       *
       * Enumerate blocks and clean data
       *
       * @param {Array<{tool, data: BlockToolData}>} blocksData - blocks' data to sanitize
       */
      sanitizeBlocks(blocksData) {
          return blocksData.map((block) => {
              const toolConfig = this.composeToolConfig(block.tool);
              if (isEmpty(toolConfig)) {
                  return block;
              }
              block.data = this.deepSanitize(block.data, toolConfig);
              return block;
          });
      }
      /**
       * Method recursively reduces Block's data and cleans with passed rules
       *
       * @param {BlockToolData|object|*} dataToSanitize - taint string or object/array that contains taint string
       * @param {SanitizerConfig} rules - object with sanitizer rules
       */
      deepSanitize(dataToSanitize, rules) {
          /**
           * BlockData It may contain 3 types:
           *  - Array
           *  - Object
           *  - Primitive
           */
          if (Array.isArray(dataToSanitize)) {
              /**
               * Array: call sanitize for each item
               */
              return this.cleanArray(dataToSanitize, rules);
          }
          else if (typeof dataToSanitize === 'object') {
              /**
               * Objects: just clean object deeper.
               */
              return this.cleanObject(dataToSanitize, rules);
          }
          else {
              /**
               * Primitives (number|string|boolean): clean this item
               *
               * Clean only strings
               */
              if (typeof dataToSanitize === 'string') {
                  return this.cleanOneItem(dataToSanitize, rules);
              }
              return dataToSanitize;
          }
      }
      /**
       * Cleans string from unwanted tags
       * Method allows to use default config
       *
       * @param {string} taintString - taint string
       * @param {SanitizerConfig} customConfig - allowed tags
       *
       * @returns {string} clean HTML
       */
      clean(taintString, customConfig = {}) {
          const sanitizerConfig = {
              tags: customConfig,
          };
          /**
           * API client can use custom config to manage sanitize process
           */
          const sanitizerInstance = this.createHTMLJanitorInstance(sanitizerConfig);
          return sanitizerInstance.clean(taintString);
      }
      /**
       * Merge with inline tool config
       *
       * @param {string} toolName - tool name
       *
       * @returns {SanitizerConfig}
       */
      composeToolConfig(toolName) {
          /**
           * If cache is empty, then compose tool config and put it to the cache object
           */
          if (this.configCache[toolName]) {
              return this.configCache[toolName];
          }
          const sanitizeGetter = this.Editor.Tools.INTERNAL_SETTINGS.SANITIZE_CONFIG;
          const toolClass = this.Editor.Tools.available[toolName];
          const baseConfig = this.getInlineToolsConfig(toolName);
          /**
           * If Tools doesn't provide sanitizer config or it is empty
           */
          if (!toolClass.sanitize || (toolClass[sanitizeGetter] && isEmpty(toolClass[sanitizeGetter]))) {
              return baseConfig;
          }
          const toolRules = toolClass.sanitize;
          const toolConfig = {};
          for (const fieldName in toolRules) {
              if (Object.prototype.hasOwnProperty.call(toolRules, fieldName)) {
                  const rule = toolRules[fieldName];
                  if (typeof rule === 'object') {
                      toolConfig[fieldName] = Object.assign({}, baseConfig, rule);
                  }
                  else {
                      toolConfig[fieldName] = rule;
                  }
              }
          }
          this.configCache[toolName] = toolConfig;
          return toolConfig;
      }
      /**
       * Returns Sanitizer config
       * When Tool's "inlineToolbar" value is True, get all sanitizer rules from all tools,
       * otherwise get only enabled
       *
       * @param {string} name - Inline Tool name
       */
      getInlineToolsConfig(name) {
          const { Tools } = this.Editor;
          const toolsConfig = Tools.getToolSettings(name);
          const enableInlineTools = toolsConfig.inlineToolbar || [];
          let config = {};
          if (typeof enableInlineTools === 'boolean' && enableInlineTools) {
              /**
               * getting all tools sanitizer rule
               */
              config = this.getAllInlineToolsConfig();
          }
          else {
              /**
               * getting only enabled
               */
              enableInlineTools.map((inlineToolName) => {
                  config = Object.assign(config, Tools.inline[inlineToolName][Tools.INTERNAL_SETTINGS.SANITIZE_CONFIG]);
              });
          }
          /**
           * Allow linebreaks
           */
          config['br'] = true;
          config['wbr'] = true;
          return config;
      }
      /**
       * Return general config for all inline tools
       */
      getAllInlineToolsConfig() {
          const { Tools } = this.Editor;
          if (this.inlineToolsConfigCache) {
              return this.inlineToolsConfigCache;
          }
          const config = {};
          Object.entries(Tools.inline)
              .forEach(([, inlineTool]) => {
              Object.assign(config, inlineTool[Tools.INTERNAL_SETTINGS.SANITIZE_CONFIG]);
          });
          this.inlineToolsConfigCache = config;
          return this.inlineToolsConfigCache;
      }
      /**
       * Clean array
       *
       * @param {Array} array - [1, 2, {}, []]
       * @param {SanitizerConfig} ruleForItem - sanitizer config for array
       */
      cleanArray(array, ruleForItem) {
          return array.map((arrayItem) => this.deepSanitize(arrayItem, ruleForItem));
      }
      /**
       * Clean object
       *
       * @param {object} object  - {level: 0, text: 'adada', items: [1,2,3]}}
       * @param {object} rules - { b: true } or true|false
       * @returns {object}
       */
      cleanObject(object, rules) {
          const cleanData = {};
          for (const fieldName in object) {
              if (!Object.prototype.hasOwnProperty.call(object, fieldName)) {
                  continue;
              }
              const currentIterationItem = object[fieldName];
              /**
               *  Get object from config by field name
               *   - if it is a HTML Janitor rule, call with this rule
               *   - otherwise, call with parent's config
               */
              const ruleForItem = this.isRule(rules[fieldName]) ? rules[fieldName] : rules;
              cleanData[fieldName] = this.deepSanitize(currentIterationItem, ruleForItem);
          }
          return cleanData;
      }
      /**
       * Clean primitive value
       *
       * @param {string} taintString - string to clean
       * @param {SanitizerConfig|boolean} rule - sanitizer rule
       *
       * @returns {string}
       */
      cleanOneItem(taintString, rule) {
          if (typeof rule === 'object') {
              return this.clean(taintString, rule);
          }
          else if (rule === false) {
              return this.clean(taintString, {});
          }
          else {
              return taintString;
          }
      }
      /**
       * Check if passed item is a HTML Janitor rule:
       *  { a : true }, {}, false, true, function(){} — correct rules
       *  undefined, null, 0, 1, 2 — not a rules
       *
       * @param {SanitizerConfig} config - config to check
       */
      isRule(config) {
          return typeof config === 'object' || typeof config === 'boolean' || isFunction(config);
      }
      /**
       * If developer uses editor's API, then he can customize sanitize restrictions.
       * Or, sanitizing config can be defined globally in editors initialization. That config will be used everywhere
       * At least, if there is no config overrides, that API uses Default configuration
       *
       * @see {@link https://www.npmjs.com/package/html-janitor}
       * @license Apache-2.0
       * @see {@link https://github.com/guardian/html-janitor/blob/master/LICENSE}
       *
       * @param {SanitizerConfig} config - sanitizer extension
       */
      createHTMLJanitorInstance(config) {
          if (config) {
              return new htmlJanitor(config);
          }
          return null;
      }
  }
  Sanitizer.displayName = 'Sanitizer';

  /**
   * @classdesc This method reduces all Blocks asyncronically and calls Block's save method to extract data
   *
   * @typedef {Saver} Saver
   * @property {Element} html - Editor HTML content
   * @property {string} json - Editor JSON output
   */
  class Saver extends Module {
      /**
       * Composes new chain of Promises to fire them alternatelly
       *
       * @returns {OutputData}
       */
      save() {
          return __awaiter(this, void 0, void 0, function* () {
              const { BlockManager, Sanitizer, ModificationsObserver } = this.Editor;
              const blocks = BlockManager.blocks, chainData = [];
              /**
               * Disable modifications observe while saving
               */
              ModificationsObserver.disable();
              try {
                  blocks.forEach((block) => {
                      chainData.push(this.getSavedData(block));
                  });
                  const extractedData = yield Promise.all(chainData);
                  const sanitizedData = yield Sanitizer.sanitizeBlocks(extractedData);
                  return this.makeOutput(sanitizedData);
              }
              finally {
                  ModificationsObserver.enable();
              }
          });
      }
      /**
       * Saves and validates
       *
       * @param {Block} block - Editor's Tool
       * @returns {ValidatedData} - Tool's validated data
       */
      getSavedData(block) {
          return __awaiter(this, void 0, void 0, function* () {
              const blockData = yield block.save();
              const isValid = blockData && (yield block.validate(blockData.data));
              return Object.assign(Object.assign({}, blockData), { isValid });
          });
      }
      /**
       * Creates output object with saved data, time and version of editor
       *
       * @param {ValidatedData} allExtractedData - data extracted from Blocks
       * @returns {OutputData}
       */
      makeOutput(allExtractedData) {
          let totalTime = 0;
          const blocks = [];
          log('[Editor.js saving]:', 'groupCollapsed');
          allExtractedData.forEach(({ tool, data, time, isValid }) => {
              totalTime += time;
              /**
               * Capitalize Tool name
               */
              log(`${tool.charAt(0).toUpperCase() + tool.slice(1)}`, 'group');
              if (isValid) {
                  /** Group process info */
                  log(data);
                  log(undefined, 'groupEnd');
              }
              else {
                  log(`Block «${tool}» skipped because saved data is invalid`);
                  log(undefined, 'groupEnd');
                  return;
              }
              /** If it was stub Block, get original data */
              if (tool === this.Editor.Tools.stubTool) {
                  blocks.push(data);
                  return;
              }
              blocks.push({
                  type: tool,
                  data,
              });
          });
          log('Total', 'log', totalTime);
          log(undefined, 'groupEnd');
          return {
              time: +new Date(),
              blocks,
              version: '2.19.1',
          };
      }
  }
  Saver.displayName = 'Saver';

  var shortcuts = createCommonjsModule(function (module, exports) {
  /*!
   * Library for handling keyboard shortcuts
   * @copyright CodeX (https://codex.so)
   * @license MIT
   * @author CodeX (https://codex.so)
   * @version 1.1.1
   */
  !function(e,t){module.exports=t();}(window,function(){return function(n){var r={};function o(e){if(r[e])return r[e].exports;var t=r[e]={i:e,l:!1,exports:{}};return n[e].call(t.exports,t,t.exports,o),t.l=!0,t.exports}return o.m=n,o.c=r,o.d=function(e,t,n){o.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n});},o.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0});},o.t=function(t,e){if(1&e&&(t=o(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var n=Object.create(null);if(o.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var r in t)o.d(n,r,function(e){return t[e]}.bind(null,r));return n},o.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return o.d(t,"a",t),t},o.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},o.p="",o(o.s=0)}([function(e,t,n){function r(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function o(e,t,n){return t&&r(e.prototype,t),n&&r(e,n),e}n.r(t);var u=function(){function i(e){var t=this;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,i),this.commands={},this.keys={},this.name=e.name,this.parseShortcutName(e.name),this.element=e.on,this.callback=e.callback,this.executeShortcut=function(e){t.execute(e);},this.element.addEventListener("keydown",this.executeShortcut,!1);}return o(i,null,[{key:"supportedCommands",get:function(){return {SHIFT:["SHIFT"],CMD:["CMD","CONTROL","COMMAND","WINDOWS","CTRL"],ALT:["ALT","OPTION"]}}},{key:"keyCodes",get:function(){return {0:48,1:49,2:50,3:51,4:52,5:53,6:54,7:55,8:56,9:57,A:65,B:66,C:67,D:68,E:69,F:70,G:71,H:72,I:73,J:74,K:75,L:76,M:77,N:78,O:79,P:80,Q:81,R:82,S:83,T:84,U:85,V:86,W:87,X:88,Y:89,Z:90,BACKSPACE:8,ENTER:13,ESCAPE:27,LEFT:37,UP:38,RIGHT:39,DOWN:40,INSERT:45,DELETE:46}}}]),o(i,[{key:"parseShortcutName",value:function(e){e=e.split("+");for(var t=0;t<e.length;t++){e[t]=e[t].toUpperCase();var n=!1;for(var r in i.supportedCommands)if(i.supportedCommands[r].includes(e[t])){n=this.commands[r]=!0;break}n||(this.keys[e[t]]=!0);}for(var o in i.supportedCommands)this.commands[o]||(this.commands[o]=!1);}},{key:"execute",value:function(e){var t,n={CMD:e.ctrlKey||e.metaKey,SHIFT:e.shiftKey,ALT:e.altKey},r=!0;for(t in this.commands)this.commands[t]!==n[t]&&(r=!1);var o,u=!0;for(o in this.keys)u=u&&e.keyCode===i.keyCodes[o];r&&u&&this.callback(e);}},{key:"remove",value:function(){this.element.removeEventListener("keydown",this.executeShortcut);}}]),i}();t.default=u;}]).default});
  });

  var Shortcut = /*@__PURE__*/getDefaultExportFromCjs(shortcuts);

  /**
   * @class Shortcut
   * @classdesc Allows to register new shortcut
   *
   * Internal Shortcuts Module
   */
  class Shortcuts extends Module {
      constructor() {
          super(...arguments);
          /**
           * All registered shortcuts
           *
           * @type {Shortcut[]}
           */
          this.registeredShortcuts = [];
      }
      /**
       * Register shortcut
       *
       * @param {ShortcutData} shortcut - shortcut options
       */
      add(shortcut) {
          const newShortcut = new Shortcut({
              name: shortcut.name,
              on: document,
              callback: shortcut.handler,
          });
          this.registeredShortcuts.push(newShortcut);
      }
      /**
       * Remove shortcut
       *
       * @param {string} shortcut - shortcut name
       */
      remove(shortcut) {
          const index = this.registeredShortcuts.findIndex((shc) => shc.name === shortcut);
          if (index === -1 || !this.registeredShortcuts[index]) {
              return;
          }
          this.registeredShortcuts[index].remove();
          this.registeredShortcuts.splice(index, 1);
      }
  }
  Shortcuts.displayName = 'Shortcuts';

  var tooltip = createCommonjsModule(function (module, exports) {
  /*!
   * CodeX.Tooltips
   * 
   * @version 1.0.1
   * 
   * @licence MIT
   * @author CodeX <https://codex.so>
   * 
   * 
   */
  !function(t,e){module.exports=e();}(window,(function(){return function(t){var e={};function o(i){if(e[i])return e[i].exports;var n=e[i]={i:i,l:!1,exports:{}};return t[i].call(n.exports,n,n.exports,o),n.l=!0,n.exports}return o.m=t,o.c=e,o.d=function(t,e,i){o.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:i});},o.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0});},o.t=function(t,e){if(1&e&&(t=o(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var i=Object.create(null);if(o.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var n in t)o.d(i,n,function(e){return t[e]}.bind(null,n));return i},o.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return o.d(e,"a",e),e},o.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},o.p="",o(o.s=0)}([function(t,e,o){t.exports=o(1);},function(t,e,o){o.r(e),o.d(e,"default",(function(){return i}));class i{constructor(){this.nodes={wrapper:null,content:null},this.showed=!1,this.offsetTop=10,this.offsetLeft=10,this.offsetRight=10,this.hidingDelay=0,this.loadStyles(),this.prepare(),window.addEventListener("scroll",()=>{this.showed&&this.hide(!0);},{passive:!0});}get CSS(){return {tooltip:"ct",tooltipContent:"ct__content",tooltipShown:"ct--shown",placement:{left:"ct--left",bottom:"ct--bottom",right:"ct--right",top:"ct--top"}}}show(t,e,o){this.nodes.wrapper||this.prepare(),this.hidingTimeout&&clearTimeout(this.hidingTimeout);const i=Object.assign({placement:"bottom",marginTop:0,marginLeft:0,marginRight:0,marginBottom:0,delay:70,hidingDelay:0},o);if(i.hidingDelay&&(this.hidingDelay=i.hidingDelay),this.nodes.content.innerHTML="","string"==typeof e)this.nodes.content.appendChild(document.createTextNode(e));else {if(!(e instanceof Node))throw Error("[CodeX Tooltip] Wrong type of «content» passed. It should be an instance of Node or String. But "+typeof e+" given.");this.nodes.content.appendChild(e);}switch(this.nodes.wrapper.classList.remove(...Object.values(this.CSS.placement)),i.placement){case"top":this.placeTop(t,i);break;case"left":this.placeLeft(t,i);break;case"right":this.placeRight(t,i);break;case"bottom":default:this.placeBottom(t,i);}i&&i.delay?this.showingTimeout=setTimeout(()=>{this.nodes.wrapper.classList.add(this.CSS.tooltipShown),this.showed=!0;},i.delay):(this.nodes.wrapper.classList.add(this.CSS.tooltipShown),this.showed=!0);}hide(t=!1){if(this.hidingDelay&&!t)return this.hidingTimeout&&clearTimeout(this.hidingTimeout),void(this.hidingTimeout=setTimeout(()=>{this.hide(!0);},this.hidingDelay));this.nodes.wrapper.classList.remove(this.CSS.tooltipShown),this.showed=!1,this.showingTimeout&&clearTimeout(this.showingTimeout);}onHover(t,e,o){t.addEventListener("mouseenter",()=>{this.show(t,e,o);}),t.addEventListener("mouseleave",()=>{this.hide();});}prepare(){this.nodes.wrapper=this.make("div",this.CSS.tooltip),this.nodes.content=this.make("div",this.CSS.tooltipContent),this.append(this.nodes.wrapper,this.nodes.content),this.append(document.body,this.nodes.wrapper);}loadStyles(){const t="codex-tooltips-style";if(document.getElementById(t))return;const e=o(2),i=this.make("style",null,{textContent:e.toString(),id:t});this.prepend(document.head,i);}placeBottom(t,e){const o=t.getBoundingClientRect(),i=o.left+t.clientWidth/2-this.nodes.wrapper.offsetWidth/2,n=o.bottom+window.pageYOffset+this.offsetTop+e.marginTop;this.applyPlacement("bottom",i,n);}placeTop(t,e){const o=t.getBoundingClientRect(),i=o.left+t.clientWidth/2-this.nodes.wrapper.offsetWidth/2,n=o.top+window.pageYOffset-this.nodes.wrapper.clientHeight-this.offsetTop;this.applyPlacement("top",i,n);}placeLeft(t,e){const o=t.getBoundingClientRect(),i=o.left-this.nodes.wrapper.offsetWidth-this.offsetLeft-e.marginLeft,n=o.top+window.pageYOffset+t.clientHeight/2-this.nodes.wrapper.offsetHeight/2;this.applyPlacement("left",i,n);}placeRight(t,e){const o=t.getBoundingClientRect(),i=o.right+this.offsetRight+e.marginRight,n=o.top+window.pageYOffset+t.clientHeight/2-this.nodes.wrapper.offsetHeight/2;this.applyPlacement("right",i,n);}applyPlacement(t,e,o){this.nodes.wrapper.classList.add(this.CSS.placement[t]),this.nodes.wrapper.style.left=e+"px",this.nodes.wrapper.style.top=o+"px";}make(t,e=null,o={}){const i=document.createElement(t);Array.isArray(e)?i.classList.add(...e):e&&i.classList.add(e);for(const t in o)o.hasOwnProperty(t)&&(i[t]=o[t]);return i}append(t,e){Array.isArray(e)?e.forEach(e=>t.appendChild(e)):t.appendChild(e);}prepend(t,e){Array.isArray(e)?(e=e.reverse()).forEach(e=>t.prepend(e)):t.prepend(e);}}},function(t,e){t.exports='.ct{z-index:999;opacity:0;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;pointer-events:none;-webkit-transition:opacity 50ms ease-in,-webkit-transform 70ms cubic-bezier(.215,.61,.355,1);transition:opacity 50ms ease-in,-webkit-transform 70ms cubic-bezier(.215,.61,.355,1);transition:opacity 50ms ease-in,transform 70ms cubic-bezier(.215,.61,.355,1);transition:opacity 50ms ease-in,transform 70ms cubic-bezier(.215,.61,.355,1),-webkit-transform 70ms cubic-bezier(.215,.61,.355,1);will-change:opacity,top,left;-webkit-box-shadow:0 8px 12px 0 rgba(29,32,43,.17),0 4px 5px -3px rgba(5,6,12,.49);box-shadow:0 8px 12px 0 rgba(29,32,43,.17),0 4px 5px -3px rgba(5,6,12,.49);border-radius:9px}.ct,.ct:before{position:absolute;top:0;left:0}.ct:before{content:"";bottom:0;right:0;background-color:#1d202b;z-index:-1;border-radius:4px}@supports(-webkit-mask-box-image:url("")){.ct:before{border-radius:0;-webkit-mask-box-image:url(\'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M10.71 0h2.58c3.02 0 4.64.42 6.1 1.2a8.18 8.18 0 013.4 3.4C23.6 6.07 24 7.7 24 10.71v2.58c0 3.02-.42 4.64-1.2 6.1a8.18 8.18 0 01-3.4 3.4c-1.47.8-3.1 1.21-6.11 1.21H10.7c-3.02 0-4.64-.42-6.1-1.2a8.18 8.18 0 01-3.4-3.4C.4 17.93 0 16.3 0 13.29V10.7c0-3.02.42-4.64 1.2-6.1a8.18 8.18 0 013.4-3.4C6.07.4 7.7 0 10.71 0z"/></svg>\') 48% 41% 37.9% 53.3%}}@media (--mobile){.ct{display:none}}.ct__content{padding:6px 10px;color:#cdd1e0;font-size:12px;text-align:center;letter-spacing:.02em;line-height:1em}.ct:after{content:"";width:8px;height:8px;position:absolute;background-color:#1d202b;z-index:-1}.ct--bottom{-webkit-transform:translateY(5px);transform:translateY(5px)}.ct--bottom:after{top:-3px;left:50%;-webkit-transform:translateX(-50%) rotate(-45deg);transform:translateX(-50%) rotate(-45deg)}.ct--top{-webkit-transform:translateY(-5px);transform:translateY(-5px)}.ct--top:after{top:auto;bottom:-3px;left:50%;-webkit-transform:translateX(-50%) rotate(-45deg);transform:translateX(-50%) rotate(-45deg)}.ct--left{-webkit-transform:translateX(-5px);transform:translateX(-5px)}.ct--left:after{top:50%;left:auto;right:0;-webkit-transform:translate(41.6%,-50%) rotate(-45deg);transform:translate(41.6%,-50%) rotate(-45deg)}.ct--right{-webkit-transform:translateX(5px);transform:translateX(5px)}.ct--right:after{top:50%;left:0;-webkit-transform:translate(-41.6%,-50%) rotate(-45deg);transform:translate(-41.6%,-50%) rotate(-45deg)}.ct--shown{opacity:1;-webkit-transform:none;transform:none}';}]).default}));
  });

  var CodeXTooltips = /*@__PURE__*/getDefaultExportFromCjs(tooltip);

  /* eslint-disable jsdoc/no-undefined-types */
  /**
   * Tooltip
   *
   * Decorates any tooltip module like adapter
   */
  class Tooltip extends Module {
      /**
       * @class
       * @param {EditorConfig} - Editor's config
       */
      constructor({ config }) {
          super({ config });
          /**
           * Tooltips lib: CodeX Tooltips
           *
           * @see https://github.com/codex-team/codex.tooltips
           */
          this.lib = new CodeXTooltips();
      }
      /**
       * Shows tooltip on element with passed HTML content
       *
       * @param {HTMLElement} element - any HTML element in DOM
       * @param {TooltipContent} content - tooltip's content
       * @param {TooltipOptions} options - showing settings
       */
      show(element, content, options) {
          this.lib.show(element, content, options);
      }
      /**
       * Hides tooltip
       */
      hide() {
          this.lib.hide();
      }
      /**
       * Binds 'mouseenter' and 'mouseleave' events that shows/hides the Tooltip
       *
       * @param {HTMLElement} element - any HTML element in DOM
       * @param {TooltipContent} content - tooltip's content
       * @param {TooltipOptions} options - showing settings
       */
      onHover(element, content, options) {
          this.lib.onHover(element, content, options);
      }
  }
  Tooltip.displayName = 'Tooltip';

  var sprite = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\">\n<symbol id=\"arrow-down\" viewBox=\"0 0 14 14\">\r\n  <path transform=\"matrix(1 0 0 -1 0 14)\" d=\"M8.024 4.1v8.6a1.125 1.125 0 0 1-2.25 0V4.1L2.18 7.695A1.125 1.125 0 1 1 .59 6.104L6.103.588c.44-.439 1.151-.439 1.59 0l5.516 5.516a1.125 1.125 0 0 1-1.59 1.59L8.023 4.1z\"/>\r\n\n</symbol>\n<symbol id=\"arrow-up\" viewBox=\"0 0 14 14\">\r\n    <path d=\"M8.024 4.1v8.6a1.125 1.125 0 0 1-2.25 0V4.1L2.18 7.695A1.125 1.125 0 1 1 .59 6.104L6.103.588c.44-.439 1.151-.439 1.59 0l5.516 5.516a1.125 1.125 0 0 1-1.59 1.59L8.023 4.1z\"/>\r\n\n</symbol>\n<symbol id=\"bold\" viewBox=\"0 0 12 14\"><path d=\"M5.997 14H1.72c-.618 0-1.058-.138-1.323-.415C.132 13.308 0 12.867 0 12.262V1.738C0 1.121.135.676.406.406.676.136 1.114 0 1.719 0h4.536c.669 0 1.248.041 1.738.124.49.083.93.242 1.318.478a3.458 3.458 0 0 1 1.461 1.752c.134.366.2.753.2 1.16 0 1.401-.7 2.426-2.1 3.075 1.84.586 2.76 1.726 2.76 3.42 0 .782-.2 1.487-.602 2.114a3.61 3.61 0 0 1-1.623 1.39 5.772 5.772 0 0 1-1.471.377c-.554.073-1.2.11-1.939.11zm-.21-6.217h-2.95v4.087h3.046c1.916 0 2.874-.69 2.874-2.072 0-.707-.248-1.22-.745-1.537-.496-.319-1.238-.478-2.225-.478zM2.837 2.13v3.619h2.597c.707 0 1.252-.067 1.638-.2.385-.134.68-.389.883-.765.16-.267.239-.566.239-.897 0-.707-.252-1.176-.755-1.409-.503-.232-1.27-.348-2.301-.348H2.836z\"/>\n</symbol>\n<symbol id=\"cross\" viewBox=\"0 0 237 237\">\r\n  <path transform=\"rotate(45 280.675 51.325)\" d=\"M191 191V73c0-5.523 4.477-10 10-10h25c5.523 0 10 4.477 10 10v118h118c5.523 0 10 4.477 10 10v25c0 5.523-4.477 10-10 10H236v118c0 5.523-4.477 10-10 10h-25c-5.523 0-10-4.477-10-10V236H73c-5.523 0-10-4.477-10-10v-25c0-5.523 4.477-10 10-10h118z\"/>\r\n\n</symbol>\n<symbol id=\"dots\" viewBox=\"0 0 8 8\">\r\n  <circle cx=\"6.5\" cy=\"1.5\" r=\"1.5\"/>\r\n  <circle cx=\"6.5\" cy=\"6.5\" r=\"1.5\"/>\r\n  <circle cx=\"1.5\" cy=\"1.5\" r=\"1.5\"/>\r\n  <circle cx=\"1.5\" cy=\"6.5\" r=\"1.5\"/>\r\n\n</symbol>\n<symbol id=\"italic\" viewBox=\"0 0 4 11\">\r\n    <path d=\"M3.289 4.17L2.164 9.713c-.078.384-.238.674-.48.87-.243.198-.52.296-.831.296-.312 0-.545-.1-.699-.302-.153-.202-.192-.49-.116-.864L1.15 4.225c.077-.38.232-.665.466-.857a1.25 1.25 0 01.818-.288c.312 0 .55.096.713.288.163.192.21.46.141.801zm-.667-2.09c-.295 0-.53-.09-.706-.273-.176-.181-.233-.439-.173-.77.055-.302.207-.55.457-.745C2.45.097 2.716 0 3 0c.273 0 .5.088.68.265.179.176.238.434.177.771-.06.327-.21.583-.45.767-.24.185-.502.277-.785.277z\"/>\r\n\n</symbol>\n<symbol id=\"link\" viewBox=\"0 0 14 10\">\r\n  <path d=\"M6 0v2H5a3 3 0 000 6h1v2H5A5 5 0 115 0h1zm2 0h1a5 5 0 110 10H8V8h1a3 3 0 000-6H8V0zM5 4h4a1 1 0 110 2H5a1 1 0 110-2z\"/>\r\n\n</symbol>\n<symbol id=\"plus\" viewBox=\"0 0 14 14\">\r\n    <path d=\"M8.05 5.8h4.625a1.125 1.125 0 0 1 0 2.25H8.05v4.625a1.125 1.125 0 0 1-2.25 0V8.05H1.125a1.125 1.125 0 0 1 0-2.25H5.8V1.125a1.125 1.125 0 0 1 2.25 0V5.8z\"/>\r\n\n</symbol>\n<symbol id=\"sad-face\" viewBox=\"0 0 52 52\">\r\n    <path fill=\"#D76B6B\" fill-rule=\"nonzero\" d=\"M26 52C11.64 52 0 40.36 0 26S11.64 0 26 0s26 11.64 26 26-11.64 26-26 26zm0-3.25c12.564 0 22.75-10.186 22.75-22.75S38.564 3.25 26 3.25 3.25 13.436 3.25 26 13.436 48.75 26 48.75zM15.708 33.042a2.167 2.167 0 1 1 0-4.334 2.167 2.167 0 0 1 0 4.334zm23.834 0a2.167 2.167 0 1 1 0-4.334 2.167 2.167 0 0 1 0 4.334zm-15.875 5.452a1.083 1.083 0 1 1-1.834-1.155c1.331-2.114 3.49-3.179 6.334-3.179 2.844 0 5.002 1.065 6.333 3.18a1.083 1.083 0 1 1-1.833 1.154c-.913-1.45-2.366-2.167-4.5-2.167s-3.587.717-4.5 2.167z\"/>\r\n\n</symbol>\n<symbol id=\"toggler-down\">\r\n  <path d=\"M6.5 9.294a.792.792 0 01-.562-.232L2.233 5.356a.794.794 0 011.123-1.123L6.5 7.377l3.144-3.144a.794.794 0 011.123 1.123L7.062 9.062a.792.792 0 01-.562.232z\"/>\r\n\n</symbol>\n<symbol id=\"unlink\" viewBox=\"0 0 15 11\">\r\n  <path d=\"M13.073 2.099l-1.448 1.448A3 3 0 009 2H8V0h1c1.68 0 3.166.828 4.073 2.099zM6.929 4l-.879.879L7.172 6H5a1 1 0 110-2h1.929zM6 0v2H5a3 3 0 100 6h1v2H5A5 5 0 115 0h1zm6.414 7l2.122 2.121-1.415 1.415L11 8.414l-2.121 2.122L7.464 9.12 9.586 7 7.464 4.879 8.88 3.464 11 5.586l2.121-2.122 1.415 1.415L12.414 7z\"/>\r\n\n</symbol></svg>";

  /**
   * @class
   *
   * @classdesc Makes Editor.js UI:
   *                <codex-editor>
   *                    <ce-redactor />
   *                    <ce-toolbar />
   *                    <ce-inline-toolbar />
   *                </codex-editor>
   *
   * @typedef {UI} UI
   * @property {EditorConfig} config   - editor configuration {@link EditorJS#configuration}
   * @property {object} Editor         - available editor modules {@link EditorJS#moduleInstances}
   * @property {object} nodes          -
   * @property {Element} nodes.holder  - element where we need to append redactor
   * @property {Element} nodes.wrapper  - <codex-editor>
   * @property {Element} nodes.redactor - <ce-redactor>
   */
  class UI extends Module {
      constructor() {
          super(...arguments);
          /**
           * Flag that became true on mobile viewport
           *
           * @type {boolean}
           */
          this.isMobile = false;
          /**
           * Cache for center column rectangle info
           * Invalidates on window resize
           *
           * @type {DOMRect}
           */
          this.contentRectCache = undefined;
          /**
           * Handle window resize only when it finished
           *
           * @type {() => void}
           */
          this.resizeDebouncer = debounce(() => {
              this.windowResize();
          }, 200);
      }
      /**
       * Editor.js UI CSS class names
       *
       * @returns {{editorWrapper: string, editorZone: string}}
       */
      get CSS() {
          return {
              editorWrapper: 'codex-editor',
              editorWrapperNarrow: 'codex-editor--narrow',
              editorZone: 'codex-editor__redactor',
              editorZoneHidden: 'codex-editor__redactor--hidden',
              editorLoader: 'codex-editor__loader',
              editorEmpty: 'codex-editor--empty',
              editorRtlFix: 'codex-editor--rtl',
          };
      }
      /**
       * Return Width of center column of Editor
       *
       * @returns {DOMRect}
       */
      get contentRect() {
          if (this.contentRectCache) {
              return this.contentRectCache;
          }
          const someBlock = this.nodes.wrapper.querySelector(`.${Block.CSS.content}`);
          /**
           * When Editor is not ready, there is no Blocks, so return the default value
           */
          if (!someBlock) {
              return {
                  width: 650,
                  left: 0,
                  right: 0,
              };
          }
          this.contentRectCache = someBlock.getBoundingClientRect();
          return this.contentRectCache;
      }
      /**
       * Adds loader to editor while content is not ready
       */
      addLoader() {
          this.nodes.loader = Dom.make('div', this.CSS.editorLoader);
          this.nodes.wrapper.prepend(this.nodes.loader);
          this.nodes.redactor.classList.add(this.CSS.editorZoneHidden);
      }
      /**
       * Removes loader when content has loaded
       */
      removeLoader() {
          this.nodes.loader.remove();
          this.nodes.redactor.classList.remove(this.CSS.editorZoneHidden);
      }
      /**
       * Making main interface
       */
      prepare() {
          return __awaiter(this, void 0, void 0, function* () {
              /**
               * Detect mobile version
               */
              this.checkIsMobile();
              /**
               * Make main UI elements
               */
              this.make();
              /**
               * Loader for rendering process
               */
              this.addLoader();
              /**
               * Append SVG sprite
               */
              this.appendSVGSprite();
              /**
               * Load and append CSS
               */
              // this.loadStyles();
          });
      }
      /**
       * Toggle read-only state
       *
       * If readOnly is true:
       *  - removes all listeners from main UI module elements
       *
       * if readOnly is false:
       *  - enables all listeners to UI module elements
       *
       * @param {boolean} readOnlyEnabled - "read only" state
       */
      toggleReadOnly(readOnlyEnabled) {
          /**
           * Prepare components based on read-only state
           */
          if (!readOnlyEnabled) {
              /**
               * Unbind all events
               */
              this.enableModuleBindings();
          }
          else {
              /**
               * Bind events for the UI elements
               */
              this.disableModuleBindings();
          }
      }
      /**
       * Check if Editor is empty and set CSS class to wrapper
       */
      checkEmptiness() {
          const { BlockManager } = this.Editor;
          this.nodes.wrapper.classList.toggle(this.CSS.editorEmpty, BlockManager.isEditorEmpty);
      }
      /**
       * Check if one of Toolbar is opened
       * Used to prevent global keydowns (for example, Enter) conflicts with Enter-on-toolbar
       *
       * @returns {boolean}
       */
      get someToolbarOpened() {
          const { Toolbox, BlockSettings, InlineToolbar, ConversionToolbar } = this.Editor;
          return BlockSettings.opened || InlineToolbar.opened || ConversionToolbar.opened || Toolbox.opened;
      }
      /**
       * Check for some Flipper-buttons is under focus
       */
      get someFlipperButtonFocused() {
          return Object.entries(this.Editor).filter(([moduleName, moduleClass]) => {
              return moduleClass.flipper instanceof Flipper;
          })
              .some(([moduleName, moduleClass]) => {
              return moduleClass.flipper.currentItem;
          });
      }
      /**
       * Clean editor`s UI
       */
      destroy() {
          this.nodes.holder.innerHTML = '';
      }
      /**
       * Close all Editor's toolbars
       */
      closeAllToolbars() {
          const { Toolbox, BlockSettings, InlineToolbar, ConversionToolbar } = this.Editor;
          BlockSettings.close();
          InlineToolbar.close();
          ConversionToolbar.close();
          Toolbox.close();
      }
      /**
       * Check for mobile mode and cache a result
       */
      checkIsMobile() {
          this.isMobile = window.innerWidth < 650;
      }
      /**
       * Makes Editor.js interface
       */
      make() {
          /**
           * Element where we need to append Editor.js
           *
           * @type {Element}
           */
          this.nodes.holder = Dom.getHolder(this.config.holder);
          /**
           * Create and save main UI elements
           */
          this.nodes.wrapper = Dom.make('div', [
              this.CSS.editorWrapper,
              ...(this.isRtl ? [this.CSS.editorRtlFix] : []),
          ]);
          this.nodes.redactor = Dom.make('div', this.CSS.editorZone);
          /**
           * If Editor has injected into the narrow container, enable Narrow Mode
           */
          if (this.nodes.holder.offsetWidth < this.contentRect.width) {
              this.nodes.wrapper.classList.add(this.CSS.editorWrapperNarrow);
          }
          /**
           * Set customizable bottom zone height
           */
          this.nodes.redactor.style.paddingBottom = this.config.minHeight + 'px';
          this.nodes.wrapper.appendChild(this.nodes.redactor);
          this.nodes.holder.appendChild(this.nodes.wrapper);
      }
      /**
       * Appends CSS
       */
      loadStyles() {
          /**
           * Load CSS
           */
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          // const styles = require('../../styles/main.css');
          // const styleTagId = 'editor-js-styles';
          /**
           * Do not append styles again if they are already on the page
           */
          // if ($.get(styleTagId)) {
          //   return;
          // }
          /**
           * Make tag
           */
          // const tag = $.make('style', null, {
          //   id: styleTagId,
          //   textContent: styles.toString(),
          // });
          /**
           * Append styles at the top of HEAD tag
           */
          // $.prepend(document.head, tag);
      }
      /**
       * Bind events on the Editor.js interface
       */
      enableModuleBindings() {
          this.readOnlyMutableListeners.on(this.nodes.redactor, 'click', (event) => {
              this.redactorClicked(event);
          }, false);
          this.readOnlyMutableListeners.on(this.nodes.redactor, 'mousedown', (event) => {
              this.documentTouched(event);
          }, true);
          this.readOnlyMutableListeners.on(this.nodes.redactor, 'touchstart', (event) => {
              this.documentTouched(event);
          }, true);
          this.readOnlyMutableListeners.on(document, 'keydown', (event) => {
              this.documentKeydown(event);
          }, true);
          this.readOnlyMutableListeners.on(document, 'click', (event) => {
              this.documentClicked(event);
          }, true);
          /**
           * Handle selection change to manipulate Inline Toolbar appearance
           */
          this.readOnlyMutableListeners.on(document, 'selectionchange', (event) => {
              this.selectionChanged(event);
          }, true);
          this.readOnlyMutableListeners.on(window, 'resize', () => {
              this.resizeDebouncer();
          }, {
              passive: true,
          });
      }
      /**
       * Unbind events on the Editor.js interface
       */
      disableModuleBindings() {
          this.readOnlyMutableListeners.clearAll();
      }
      /**
       * Resize window handler
       */
      windowResize() {
          /**
           * Invalidate content zone size cached, because it may be changed
           */
          this.contentRectCache = null;
          /**
           * Detect mobile version
           */
          this.checkIsMobile();
      }
      /**
       * All keydowns on document
       *
       * @param {KeyboardEvent} event - keyboard event
       */
      documentKeydown(event) {
          switch (event.keyCode) {
              case keyCodes.ENTER:
                  this.enterPressed(event);
                  break;
              case keyCodes.BACKSPACE:
                  this.backspacePressed(event);
                  break;
              case keyCodes.ESC:
                  this.escapePressed(event);
                  break;
              default:
                  this.defaultBehaviour(event);
                  break;
          }
      }
      /**
       * Ignore all other document's keydown events
       *
       * @param {KeyboardEvent} event - keyboard event
       */
      defaultBehaviour(event) {
          const { currentBlock } = this.Editor.BlockManager;
          const keyDownOnEditor = event.target.closest(`.${this.CSS.editorWrapper}`);
          const isMetaKey = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
          /**
           * When some block is selected, but the caret is not set inside the editor, treat such keydowns as keydown on selected block.
           */
          if (currentBlock !== undefined && keyDownOnEditor === null) {
              this.Editor.BlockEvents.keydown(event);
              return;
          }
          /**
           * Ignore keydowns on editor and meta keys
           */
          if (keyDownOnEditor || (currentBlock && isMetaKey)) {
              return;
          }
          /**
           * Remove all highlights and remove caret
           */
          this.Editor.BlockManager.dropPointer();
          /**
           * Close Toolbar
           */
          this.Editor.Toolbar.close();
      }
      /**
       * @param {KeyboardEvent} event - keyboard event
       */
      backspacePressed(event) {
          const { BlockManager, BlockSelection, Caret } = this.Editor;
          /**
           * If any block selected and selection doesn't exists on the page (that means no other editable element is focused),
           * remove selected blocks
           */
          if (BlockSelection.anyBlockSelected && !SelectionUtils.isSelectionExists) {
              const selectionPositionIndex = BlockManager.removeSelectedBlocks();
              Caret.setToBlock(BlockManager.insertDefaultBlockAtIndex(selectionPositionIndex, true), Caret.positions.START);
              /** Clear selection */
              BlockSelection.clearSelection(event);
              /**
               * Stop propagations
               * Manipulation with BlockSelections is handled in global backspacePress because they may occur
               * with CMD+A or RectangleSelection and they can be handled on document event
               */
              event.preventDefault();
              event.stopPropagation();
              event.stopImmediatePropagation();
          }
      }
      /**
       * Escape pressed
       * If some of Toolbar components are opened, then close it otherwise close Toolbar
       *
       * @param {Event} event - escape keydown event
       */
      escapePressed(event) {
          /**
           * Clear blocks selection by ESC
           */
          this.Editor.BlockSelection.clearSelection(event);
          if (this.Editor.Toolbox.opened) {
              this.Editor.Toolbox.close();
          }
          else if (this.Editor.BlockSettings.opened) {
              this.Editor.BlockSettings.close();
          }
          else if (this.Editor.ConversionToolbar.opened) {
              this.Editor.ConversionToolbar.close();
          }
          else if (this.Editor.InlineToolbar.opened) {
              this.Editor.InlineToolbar.close();
          }
          else {
              this.Editor.Toolbar.close();
          }
      }
      /**
       * Enter pressed on document
       *
       * @param {KeyboardEvent} event - keyboard event
       */
      enterPressed(event) {
          const { BlockManager, BlockSelection, Caret } = this.Editor;
          const hasPointerToBlock = BlockManager.currentBlockIndex >= 0;
          /**
           * If any block selected and selection doesn't exists on the page (that means no other editable element is focused),
           * remove selected blocks
           */
          if (BlockSelection.anyBlockSelected && !SelectionUtils.isSelectionExists) {
              /** Clear selection */
              BlockSelection.clearSelection(event);
              /**
               * Stop propagations
               * Manipulation with BlockSelections is handled in global enterPress because they may occur
               * with CMD+A or RectangleSelection
               */
              event.preventDefault();
              event.stopImmediatePropagation();
              event.stopPropagation();
              return;
          }
          /**
           * If Caret is not set anywhere, event target on Enter is always Element that we handle
           * In our case it is document.body
           *
           * So, BlockManager points some Block and Enter press is on Body
           * We can create a new block
           */
          if (!this.someToolbarOpened && hasPointerToBlock && event.target.tagName === 'BODY') {
              /**
               * Insert the default typed Block
               */
              const newBlock = this.Editor.BlockManager.insert();
              this.Editor.Caret.setToBlock(newBlock);
              /**
               * And highlight
               */
              this.Editor.BlockManager.highlightCurrentNode();
              /**
               * Move toolbar and show plus button because new Block is empty
               */
              this.Editor.Toolbar.move();
              this.Editor.Toolbar.plusButton.show();
          }
          this.Editor.BlockSelection.clearSelection(event);
      }
      /**
       * All clicks on document
       *
       * @param {MouseEvent} event - Click event
       */
      documentClicked(event) {
          /**
           * Sometimes we emulate click on some UI elements, for example by Enter on Block Settings button
           * We don't need to handle such events, because they handled in other place.
           */
          if (!event.isTrusted) {
              return;
          }
          /**
           * Close Inline Toolbar when nothing selected
           * Do not fire check on clicks at the Inline Toolbar buttons
           */
          const target = event.target;
          const clickedInsideOfEditor = this.nodes.holder.contains(target) || SelectionUtils.isAtEditor;
          if (!clickedInsideOfEditor) {
              /**
               * Clear highlightings and pointer on BlockManager
               *
               * Current page might contain several instances
               * Click between instances MUST clear focus, pointers and close toolbars
               */
              this.Editor.BlockManager.dropPointer();
              this.Editor.InlineToolbar.close();
              this.Editor.Toolbar.close();
              this.Editor.ConversionToolbar.close();
          }
          /**
           * Clear Selection if user clicked somewhere
           */
          if (!this.Editor.CrossBlockSelection.isCrossBlockSelectionStarted) {
              this.Editor.BlockSelection.clearSelection(event);
          }
      }
      /**
       * First touch on editor
       * Fired before click
       *
       * Used to change current block — we need to do it before 'selectionChange' event.
       * Also:
       * - Move and show the Toolbar
       * - Set a Caret
       *
       * @param {MouseEvent | TouchEvent} event - touch or mouse event
       */
      documentTouched(event) {
          let clickedNode = event.target;
          /**
           * If click was fired is on Editor`s wrapper, try to get clicked node by elementFromPoint method
           */
          if (clickedNode === this.nodes.redactor) {
              const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
              const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
              clickedNode = document.elementFromPoint(clientX, clientY);
          }
          /**
           * Select clicked Block as Current
           */
          try {
              /**
               * Renew Current Block
               */
              this.Editor.BlockManager.setCurrentBlockByChildNode(clickedNode);
              /**
               * Highlight Current Node
               */
              this.Editor.BlockManager.highlightCurrentNode();
          }
          catch (e) {
              /**
               * If clicked outside first-level Blocks and it is not RectSelection, set Caret to the last empty Block
               */
              if (!this.Editor.RectangleSelection.isRectActivated()) {
                  this.Editor.Caret.setToTheLastBlock();
              }
          }
          /**
           * Move and open toolbar
           */
          this.Editor.Toolbar.open();
          /**
           * Hide the Plus Button
           */
          this.Editor.Toolbar.plusButton.hide();
      }
      /**
       * All clicks on the redactor zone
       *
       * @param {MouseEvent} event - click event
       *
       * @description
       * - By clicks on the Editor's bottom zone:
       *      - if last Block is empty, set a Caret to this
       *      - otherwise, add a new empty Block and set a Caret to that
       */
      redactorClicked(event) {
          if (!SelectionUtils.isCollapsed) {
              return;
          }
          const stopPropagation = () => {
              event.stopImmediatePropagation();
              event.stopPropagation();
          };
          /**
           * case when user clicks on anchor element
           * if it is clicked via ctrl key, then we open new window with url
           */
          const element = event.target;
          const ctrlKey = event.metaKey || event.ctrlKey;
          if (Dom.isAnchor(element) && ctrlKey) {
              stopPropagation();
              const href = element.getAttribute('href');
              const validUrl = getValidUrl(href);
              openTab(validUrl);
              return;
          }
          if (!this.Editor.BlockManager.currentBlock) {
              stopPropagation();
              this.Editor.BlockManager.insert();
          }
          /**
           * Show the Plus Button if:
           * - Block is an default-block (Text)
           * - Block is empty
           */
          const isDefaultBlock = this.Editor.Tools.isDefault(this.Editor.BlockManager.currentBlock.tool);
          if (isDefaultBlock) {
              stopPropagation();
              /**
               * Check isEmpty only for paragraphs to prevent unnecessary tree-walking on Tools with many nodes (for ex. Table)
               */
              const isEmptyBlock = this.Editor.BlockManager.currentBlock.isEmpty;
              if (isEmptyBlock) {
                  this.Editor.Toolbar.plusButton.show();
              }
          }
      }
      /**
       * Handle selection changes on mobile devices
       * Uses for showing the Inline Toolbar
       *
       * @param {Event} event - selection event
       */
      selectionChanged(event) {
          const { CrossBlockSelection, BlockSelection } = this.Editor;
          const focusedElement = SelectionUtils.anchorElement;
          if (CrossBlockSelection.isCrossBlockSelectionStarted) {
              // Removes all ranges when any Block is selected
              if (BlockSelection.anyBlockSelected) {
                  SelectionUtils.get().removeAllRanges();
              }
          }
          /**
           * Event can be fired on clicks at the Editor elements, for example, at the Inline Toolbar
           * We need to skip such firings
           */
          if (!focusedElement || !focusedElement.closest(`.${Block.CSS.content}`)) {
              /**
               * If new selection is not on Inline Toolbar, we need to close it
               */
              if (!this.Editor.InlineToolbar.containsNode(focusedElement)) {
                  this.Editor.InlineToolbar.close();
              }
              return;
          }
          /**
           * @todo add debounce
           */
          this.Editor.InlineToolbar.tryToShow(true);
      }
      /**
       * Append prebuilt sprite with SVG icons
       */
      appendSVGSprite() {
          const spriteHolder = Dom.make('div');
          spriteHolder.hidden = true;
          spriteHolder.style.display = 'none';
          spriteHolder.innerHTML = sprite;
          Dom.append(this.nodes.wrapper, spriteHolder);
      }
  }
  UI.displayName = 'UI';

  /**
   * @module eventDispatcher
   *
   * Has two important methods:
   *    - {Function} on - appends subscriber to the event. If event doesn't exist - creates new one
   *    - {Function} emit - fires all subscribers with data
   *    - {Function off - unsubsribes callback
   *
   * @version 1.0.0
   *
   * @typedef {Events} Events
   * @property {object} subscribers - all subscribers grouped by event name
   */
  class Events extends Module {
      constructor() {
          super(...arguments);
          /**
           * Object with events` names as key and array of callback functions as value
           *
           * @type {{}}
           */
          this.subscribers = {};
      }
      /**
       * Subscribe any event on callback
       *
       * @param {string} eventName - event name
       * @param {Function} callback - subscriber
       */
      on(eventName, callback) {
          if (!(eventName in this.subscribers)) {
              this.subscribers[eventName] = [];
          }
          // group by events
          this.subscribers[eventName].push(callback);
      }
      /**
       * Subscribe any event on callback. Callback will be called once and be removed from subscribers array after call.
       *
       * @param {string} eventName - event name
       * @param {Function} callback - subscriber
       */
      once(eventName, callback) {
          if (!(eventName in this.subscribers)) {
              this.subscribers[eventName] = [];
          }
          const wrappedCallback = (data) => {
              const result = callback(data);
              const indexOfHandler = this.subscribers[eventName].indexOf(wrappedCallback);
              if (indexOfHandler !== -1) {
                  this.subscribers[eventName].splice(indexOfHandler, 1);
              }
              return result;
          };
          // group by events
          this.subscribers[eventName].push(wrappedCallback);
      }
      /**
       * Emit callbacks with passed data
       *
       * @param {string} eventName - event name
       * @param {object} data - subscribers get this data when they were fired
       */
      emit(eventName, data) {
          if (!this.subscribers[eventName]) {
              return;
          }
          this.subscribers[eventName].reduce((previousData, currentHandler) => {
              const newData = currentHandler(previousData);
              return newData || previousData;
          }, data);
      }
      /**
       * Unsubscribe callback from event
       *
       * @param {string} eventName - event name
       * @param {Function} callback - event handler
       */
      off(eventName, callback) {
          for (let i = 0; i < this.subscribers[eventName].length; i++) {
              if (this.subscribers[eventName][i] === callback) {
                  delete this.subscribers[eventName][i];
                  break;
              }
          }
      }
      /**
       * Destroyer
       * clears subsribers list
       */
      destroy() {
          this.subscribers = null;
      }
  }
  Events.displayName = 'Events';

  /**
   *
   */
  class DragNDrop extends Module {
      constructor() {
          super(...arguments);
          /**
           * If drag has been started at editor, we save it
           *
           * @type {boolean}
           * @private
           */
          this.isStartedAtEditor = false;
      }
      /**
       * Toggle read-only state
       *
       * if state is true:
       *  - disable all drag-n-drop event handlers
       *
       * if state is false:
       *  - restore drag-n-drop event handlers
       *
       * @param {boolean} readOnlyEnabled - "read only" state
       */
      toggleReadOnly(readOnlyEnabled) {
          if (readOnlyEnabled) {
              this.disableModuleBindings();
          }
          else {
              this.enableModuleBindings();
          }
      }
      /**
       * Add drag events listeners to editor zone
       */
      enableModuleBindings() {
          const { UI } = this.Editor;
          this.readOnlyMutableListeners.on(UI.nodes.holder, 'drop', (dropEvent) => __awaiter(this, void 0, void 0, function* () {
              yield this.processDrop(dropEvent);
          }), true);
          this.readOnlyMutableListeners.on(UI.nodes.holder, 'dragstart', () => {
              this.processDragStart();
          });
          /**
           * Prevent default browser behavior to allow drop on non-contenteditable elements
           */
          this.readOnlyMutableListeners.on(UI.nodes.holder, 'dragover', (dragEvent) => {
              this.processDragOver(dragEvent);
          }, true);
      }
      /**
       * Unbind drag-n-drop event handlers
       */
      disableModuleBindings() {
          this.readOnlyMutableListeners.clearAll();
      }
      /**
       * Handle drop event
       *
       * @param {DragEvent} dropEvent - drop event
       */
      processDrop(dropEvent) {
          return __awaiter(this, void 0, void 0, function* () {
              const { BlockManager, Caret, Paste, } = this.Editor;
              dropEvent.preventDefault();
              BlockManager.blocks.forEach((block) => {
                  block.dropTarget = false;
              });
              if (SelectionUtils.isAtEditor && !SelectionUtils.isCollapsed && this.isStartedAtEditor) {
                  document.execCommand('delete');
              }
              this.isStartedAtEditor = false;
              /**
               * Try to set current block by drop target.
               * If drop target (error will be thrown) is not part of the Block, set last Block as current.
               */
              try {
                  const targetBlock = BlockManager.setCurrentBlockByChildNode(dropEvent.target);
                  this.Editor.Caret.setToBlock(targetBlock, Caret.positions.END);
              }
              catch (e) {
                  const targetBlock = BlockManager.setCurrentBlockByChildNode(BlockManager.lastBlock.holder);
                  this.Editor.Caret.setToBlock(targetBlock, Caret.positions.END);
              }
              yield Paste.processDataTransfer(dropEvent.dataTransfer, true);
          });
      }
      /**
       * Handle drag start event
       */
      processDragStart() {
          if (SelectionUtils.isAtEditor && !SelectionUtils.isCollapsed) {
              this.isStartedAtEditor = true;
          }
          this.Editor.InlineToolbar.close();
      }
      /**
       * @param {DragEvent} dragEvent - drag event
       */
      processDragOver(dragEvent) {
          dragEvent.preventDefault();
      }
  }
  DragNDrop.displayName = 'DragNDrop';

  /**
   *
   */
  class CrossBlockSelection extends Module {
      constructor() {
          super(...arguments);
          /**
           * Mouse up event handler.
           * Removes the listeners
           */
          this.onMouseUp = () => {
              const { Listeners } = this.Editor;
              Listeners.off(document, 'mouseover', this.onMouseOver);
              Listeners.off(document, 'mouseup', this.onMouseUp);
          };
          /**
           * Mouse over event handler
           * Gets target and related blocks and change selected state for blocks in between
           *
           * @param {MouseEvent} event - mouse over event
           */
          this.onMouseOver = (event) => {
              const { BlockManager, BlockSelection } = this.Editor;
              const relatedBlock = BlockManager.getBlockByChildNode(event.relatedTarget) || this.lastSelectedBlock;
              const targetBlock = BlockManager.getBlockByChildNode(event.target);
              if (!relatedBlock || !targetBlock) {
                  return;
              }
              if (targetBlock === relatedBlock) {
                  return;
              }
              if (relatedBlock === this.firstSelectedBlock) {
                  SelectionUtils.get().removeAllRanges();
                  relatedBlock.selected = true;
                  targetBlock.selected = true;
                  BlockSelection.clearCache();
                  return;
              }
              if (targetBlock === this.firstSelectedBlock) {
                  relatedBlock.selected = false;
                  targetBlock.selected = false;
                  BlockSelection.clearCache();
                  return;
              }
              this.Editor.InlineToolbar.close();
              this.toggleBlocksSelectedState(relatedBlock, targetBlock);
              this.lastSelectedBlock = targetBlock;
          };
      }
      /**
       * Module preparation
       *
       * @returns {Promise}
       */
      prepare() {
          return __awaiter(this, void 0, void 0, function* () {
              const { Listeners } = this.Editor;
              Listeners.on(document, 'mousedown', (event) => {
                  this.enableCrossBlockSelection(event);
              });
          });
      }
      /**
       * Sets up listeners
       *
       * @param {MouseEvent} event - mouse down event
       */
      watchSelection(event) {
          if (event.button !== mouseButtons.LEFT) {
              return;
          }
          const { BlockManager, Listeners } = this.Editor;
          this.firstSelectedBlock = BlockManager.getBlock(event.target);
          this.lastSelectedBlock = this.firstSelectedBlock;
          Listeners.on(document, 'mouseover', this.onMouseOver);
          Listeners.on(document, 'mouseup', this.onMouseUp);
      }
      /**
       * return boolean is cross block selection started
       */
      get isCrossBlockSelectionStarted() {
          return !!this.firstSelectedBlock &&
              !!this.lastSelectedBlock;
      }
      /**
       * Change selection state of the next Block
       * Used for CBS via Shift + arrow keys
       *
       * @param {boolean} next - if true, toggle next block. Previous otherwise
       */
      toggleBlockSelectedState(next = true) {
          const { BlockManager, BlockSelection } = this.Editor;
          if (!this.lastSelectedBlock) {
              this.lastSelectedBlock = this.firstSelectedBlock = BlockManager.currentBlock;
          }
          if (this.firstSelectedBlock === this.lastSelectedBlock) {
              this.firstSelectedBlock.selected = true;
              BlockSelection.clearCache();
              SelectionUtils.get().removeAllRanges();
          }
          const nextBlockIndex = BlockManager.blocks.indexOf(this.lastSelectedBlock) + (next ? 1 : -1);
          const nextBlock = BlockManager.blocks[nextBlockIndex];
          if (!nextBlock) {
              return;
          }
          if (this.lastSelectedBlock.selected !== nextBlock.selected) {
              nextBlock.selected = true;
              BlockSelection.clearCache();
          }
          else {
              this.lastSelectedBlock.selected = false;
              BlockSelection.clearCache();
          }
          this.lastSelectedBlock = nextBlock;
          /** close InlineToolbar when Blocks selected */
          this.Editor.InlineToolbar.close();
      }
      /**
       * Clear saved state
       *
       * @param {Event} reason - event caused clear of selection
       */
      clear(reason) {
          const { BlockManager, BlockSelection, Caret } = this.Editor;
          const fIndex = BlockManager.blocks.indexOf(this.firstSelectedBlock);
          const lIndex = BlockManager.blocks.indexOf(this.lastSelectedBlock);
          if (BlockSelection.anyBlockSelected && fIndex > -1 && lIndex > -1) {
              if (reason && reason instanceof KeyboardEvent) {
                  /**
                   * Set caret depending on pressed key if pressed key is an arrow.
                   */
                  switch (reason.keyCode) {
                      case keyCodes.DOWN:
                      case keyCodes.RIGHT:
                          Caret.setToBlock(BlockManager.blocks[Math.max(fIndex, lIndex)], Caret.positions.END);
                          break;
                      case keyCodes.UP:
                      case keyCodes.LEFT:
                          Caret.setToBlock(BlockManager.blocks[Math.min(fIndex, lIndex)], Caret.positions.START);
                          break;
                      default:
                          Caret.setToBlock(BlockManager.blocks[Math.max(fIndex, lIndex)], Caret.positions.END);
                  }
              }
              else {
                  /**
                   * By default set caret at the end of the last selected block
                   */
                  Caret.setToBlock(BlockManager.blocks[Math.max(fIndex, lIndex)], Caret.positions.END);
              }
          }
          this.firstSelectedBlock = this.lastSelectedBlock = null;
      }
      /**
       * Enables Cross Block Selection
       *
       * @param {MouseEvent} event - mouse down event
       */
      enableCrossBlockSelection(event) {
          const { UI } = this.Editor;
          /**
           * Each mouse down on must disable selectAll state
           */
          if (!SelectionUtils.isCollapsed) {
              this.Editor.BlockSelection.clearSelection(event);
          }
          /**
           * If mouse down is performed inside the editor, we should watch CBS
           */
          if (UI.nodes.redactor.contains(event.target)) {
              this.watchSelection(event);
          }
          else {
              /**
               * Otherwise, clear selection
               */
              this.Editor.BlockSelection.clearSelection(event);
          }
      }
      /**
       * Change blocks selection state between passed two blocks.
       *
       * @param {Block} firstBlock - first block in range
       * @param {Block} lastBlock - last block in range
       */
      toggleBlocksSelectedState(firstBlock, lastBlock) {
          const { BlockManager, BlockSelection } = this.Editor;
          const fIndex = BlockManager.blocks.indexOf(firstBlock);
          const lIndex = BlockManager.blocks.indexOf(lastBlock);
          /**
           * If first and last block have the different selection state
           * it means we should't toggle selection of the first selected block.
           * In the other case we shouldn't toggle the last selected block.
           */
          const shouldntSelectFirstBlock = firstBlock.selected !== lastBlock.selected;
          for (let i = Math.min(fIndex, lIndex); i <= Math.max(fIndex, lIndex); i++) {
              const block = BlockManager.blocks[i];
              if (block !== this.firstSelectedBlock &&
                  block !== (shouldntSelectFirstBlock ? firstBlock : lastBlock)) {
                  BlockManager.blocks[i].selected = !BlockManager.blocks[i].selected;
                  BlockSelection.clearCache();
              }
          }
      }
  }
  CrossBlockSelection.displayName = 'CrossBlockSelection';

  /**
   * @class Caret
   * @classdesc Contains methods for working Caret
   *
   * Uses Range methods to manipulate with caret
   *
   * @module Caret
   *
   * @version 2.0.0
   */
  /**
   * @typedef {Caret} Caret
   */
  class Caret extends Module {
      /**
       * Allowed caret positions in input
       *
       * @static
       * @returns {{START: string, END: string, DEFAULT: string}}
       */
      get positions() {
          return {
              START: 'start',
              END: 'end',
              DEFAULT: 'default',
          };
      }
      /**
       * Elements styles that can be useful for Caret Module
       */
      static get CSS() {
          return {
              shadowCaret: 'cdx-shadow-caret',
          };
      }
      /**
       * Get's deepest first node and checks if offset is zero
       *
       * @returns {boolean}
       */
      get isAtStart() {
          const selection = SelectionUtils.get();
          const firstNode = Dom.getDeepestNode(this.Editor.BlockManager.currentBlock.currentInput);
          let focusNode = selection.focusNode;
          /** In case lastNode is native input */
          if (Dom.isNativeInput(firstNode)) {
              return firstNode.selectionEnd === 0;
          }
          /** Case when selection have been cleared programmatically, for example after CBS */
          if (!selection.anchorNode) {
              return false;
          }
          /**
           * Workaround case when caret in the text like " |Hello!"
           * selection.anchorOffset is 1, but real caret visible position is 0
           *
           * @type {number}
           */
          let firstLetterPosition = focusNode.textContent.search(/\S/);
          if (firstLetterPosition === -1) { // empty text
              firstLetterPosition = 0;
          }
          /**
           * If caret was set by external code, it might be set to text node wrapper.
           * <div>|hello</div> <---- Selection references to <div> instead of text node
           *
           * In this case, anchor node has ELEMENT_NODE node type.
           * Anchor offset shows amount of children between start of the element and caret position.
           *
           * So we use child with focusOffset index as new anchorNode.
           */
          let focusOffset = selection.focusOffset;
          if (focusNode.nodeType !== Node.TEXT_NODE && focusNode.childNodes.length) {
              if (focusNode.childNodes[focusOffset]) {
                  focusNode = focusNode.childNodes[focusOffset];
                  focusOffset = 0;
              }
              else {
                  focusNode = focusNode.childNodes[focusOffset - 1];
                  focusOffset = focusNode.textContent.length;
              }
          }
          /**
           * In case of
           * <div contenteditable>
           *     <p><b></b></p>   <-- first (and deepest) node is <b></b>
           *     |adaddad         <-- focus node
           * </div>
           */
          if (Dom.isLineBreakTag(firstNode) || Dom.isEmpty(firstNode)) {
              const leftSiblings = this.getHigherLevelSiblings(focusNode, 'left');
              const nothingAtLeft = leftSiblings.every((node) => {
                  /**
                   * Workaround case when block starts with several <br>'s (created by SHIFT+ENTER)
                   *
                   * @see https://github.com/codex-team/editor.js/issues/726
                   * We need to allow to delete such linebreaks, so in this case caret IS NOT AT START
                   */
                  const regularLineBreak = Dom.isLineBreakTag(node);
                  /**
                   * Workaround SHIFT+ENTER in Safari, that creates <div><br></div> instead of <br>
                   */
                  const lineBreakInSafari = node.children.length === 1 && Dom.isLineBreakTag(node.children[0]);
                  const isLineBreak = regularLineBreak || lineBreakInSafari;
                  return Dom.isEmpty(node) && !isLineBreak;
              });
              if (nothingAtLeft && focusOffset === firstLetterPosition) {
                  return true;
              }
          }
          /**
           * We use <= comparison for case:
           * "| Hello"  <--- selection.anchorOffset is 0, but firstLetterPosition is 1
           */
          return firstNode === null || (focusNode === firstNode && focusOffset <= firstLetterPosition);
      }
      /**
       * Get's deepest last node and checks if offset is last node text length
       *
       * @returns {boolean}
       */
      get isAtEnd() {
          const selection = SelectionUtils.get();
          let focusNode = selection.focusNode;
          const lastNode = Dom.getDeepestNode(this.Editor.BlockManager.currentBlock.currentInput, true);
          /** In case lastNode is native input */
          if (Dom.isNativeInput(lastNode)) {
              return lastNode.selectionEnd === lastNode.value.length;
          }
          /** Case when selection have been cleared programmatically, for example after CBS */
          if (!selection.focusNode) {
              return false;
          }
          /**
           * If caret was set by external code, it might be set to text node wrapper.
           * <div>hello|</div> <---- Selection references to <div> instead of text node
           *
           * In this case, anchor node has ELEMENT_NODE node type.
           * Anchor offset shows amount of children between start of the element and caret position.
           *
           * So we use child with anchofocusOffset - 1 as new focusNode.
           */
          let focusOffset = selection.focusOffset;
          if (focusNode.nodeType !== Node.TEXT_NODE && focusNode.childNodes.length) {
              if (focusNode.childNodes[focusOffset - 1]) {
                  focusNode = focusNode.childNodes[focusOffset - 1];
                  focusOffset = focusNode.textContent.length;
              }
              else {
                  focusNode = focusNode.childNodes[0];
                  focusOffset = 0;
              }
          }
          /**
           * In case of
           * <div contenteditable>
           *     adaddad|         <-- anchor node
           *     <p><b></b></p>   <-- first (and deepest) node is <b></b>
           * </div>
           */
          if (Dom.isLineBreakTag(lastNode) || Dom.isEmpty(lastNode)) {
              const rightSiblings = this.getHigherLevelSiblings(focusNode, 'right');
              const nothingAtRight = rightSiblings.every((node, i) => {
                  /**
                   * If last right sibling is BR isEmpty returns false, but there actually nothing at right
                   */
                  const isLastBR = i === rightSiblings.length - 1 && Dom.isLineBreakTag(node);
                  return isLastBR || (Dom.isEmpty(node) && !Dom.isLineBreakTag(node));
              });
              if (nothingAtRight && focusOffset === focusNode.textContent.length) {
                  return true;
              }
          }
          /**
           * Workaround case:
           * hello |     <--- anchorOffset will be 5, but textContent.length will be 6.
           * Why not regular .trim():
           *  in case of ' hello |' trim() will also remove space at the beginning, so length will be lower than anchorOffset
           */
          const rightTrimmedText = lastNode.textContent.replace(/\s+$/, '');
          /**
           * We use >= comparison for case:
           * "Hello |"  <--- selection.anchorOffset is 7, but rightTrimmedText is 6
           */
          return focusNode === lastNode && focusOffset >= rightTrimmedText.length;
      }
      /**
       * Method gets Block instance and puts caret to the text node with offset
       * There two ways that method applies caret position:
       *   - first found text node: sets at the beginning, but you can pass an offset
       *   - last found text node: sets at the end of the node. Also, you can customize the behaviour
       *
       * @param {Block} block - Block class
       * @param {string} position - position where to set caret.
       *                            If default - leave default behaviour and apply offset if it's passed
       * @param {number} offset - caret offset regarding to the text node
       */
      setToBlock(block, position = this.positions.DEFAULT, offset = 0) {
          const { BlockManager } = this.Editor;
          let element;
          switch (position) {
              case this.positions.START:
                  element = block.firstInput;
                  break;
              case this.positions.END:
                  element = block.lastInput;
                  break;
              default:
                  element = block.currentInput;
          }
          if (!element) {
              return;
          }
          const nodeToSet = Dom.getDeepestNode(element, position === this.positions.END);
          const contentLength = Dom.getContentLength(nodeToSet);
          switch (true) {
              case position === this.positions.START:
                  offset = 0;
                  break;
              case position === this.positions.END:
              case offset > contentLength:
                  offset = contentLength;
                  break;
          }
          /**
           * @todo try to fix via Promises or use querySelectorAll to not to use timeout
           */
          delay(() => {
              this.set(nodeToSet, offset);
          }, 20)();
          BlockManager.setCurrentBlockByChildNode(block.holder);
          BlockManager.currentBlock.currentInput = element;
      }
      /**
       * Set caret to the current input of current Block.
       *
       * @param {HTMLElement} input - input where caret should be set
       * @param {string} position - position of the caret.
       *                            If default - leave default behaviour and apply offset if it's passed
       * @param {number} offset - caret offset regarding to the text node
       */
      setToInput(input, position = this.positions.DEFAULT, offset = 0) {
          const { currentBlock } = this.Editor.BlockManager;
          const nodeToSet = Dom.getDeepestNode(input);
          switch (position) {
              case this.positions.START:
                  this.set(nodeToSet, 0);
                  break;
              case this.positions.END:
                  this.set(nodeToSet, Dom.getContentLength(nodeToSet));
                  break;
              default:
                  if (offset) {
                      this.set(nodeToSet, offset);
                  }
          }
          currentBlock.currentInput = input;
      }
      /**
       * Creates Document Range and sets caret to the element with offset
       *
       * @param {HTMLElement} element - target node.
       * @param {number} offset - offset
       */
      set(element, offset = 0) {
          const { top, bottom } = SelectionUtils.setCursor(element, offset);
          /** If new cursor position is not visible, scroll to it */
          const { innerHeight } = window;
          if (top < 0) {
              window.scrollBy(0, top);
          }
          if (bottom > innerHeight) {
              window.scrollBy(0, bottom - innerHeight);
          }
      }
      /**
       * Set Caret to the last Block
       * If last block is not empty, append another empty block
       */
      setToTheLastBlock() {
          const lastBlock = this.Editor.BlockManager.lastBlock;
          if (!lastBlock) {
              return;
          }
          /**
           * If last block is empty and it is an defaultBlock, set to that.
           * Otherwise, append new empty block and set to that
           */
          if (this.Editor.Tools.isDefault(lastBlock.tool) && lastBlock.isEmpty) {
              this.setToBlock(lastBlock);
          }
          else {
              const newBlock = this.Editor.BlockManager.insertAtEnd();
              this.setToBlock(newBlock);
          }
      }
      /**
       * Extract content fragment of current Block from Caret position to the end of the Block
       */
      extractFragmentFromCaretPosition() {
          const selection = SelectionUtils.get();
          if (selection.rangeCount) {
              const selectRange = selection.getRangeAt(0);
              const currentBlockInput = this.Editor.BlockManager.currentBlock.currentInput;
              selectRange.deleteContents();
              if (currentBlockInput) {
                  if (Dom.isNativeInput(currentBlockInput)) {
                      /**
                       * If input is native text input we need to use it's value
                       * Text before the caret stays in the input,
                       * while text after the caret is returned as a fragment to be inserted after the block.
                       */
                      const input = currentBlockInput;
                      const newFragment = document.createDocumentFragment();
                      const inputRemainingText = input.value.substring(0, input.selectionStart);
                      const fragmentText = input.value.substring(input.selectionStart);
                      newFragment.textContent = fragmentText;
                      input.value = inputRemainingText;
                      return newFragment;
                  }
                  else {
                      const range = selectRange.cloneRange();
                      range.selectNodeContents(currentBlockInput);
                      range.setStart(selectRange.endContainer, selectRange.endOffset);
                      return range.extractContents();
                  }
              }
          }
      }
      /**
       * Set's caret to the next Block or Tool`s input
       * Before moving caret, we should check if caret position is at the end of Plugins node
       * Using {@link Dom#getDeepestNode} to get a last node and match with current selection
       *
       * @param {boolean} force - force navigation even if caret is not at the end
       *
       * @returns {boolean}
       */
      navigateNext(force = false) {
          const { BlockManager, Tools } = this.Editor;
          const { currentBlock, nextContentfulBlock } = BlockManager;
          const { nextInput } = currentBlock;
          let nextBlock = nextContentfulBlock;
          if (!nextBlock && !nextInput) {
              /**
               * If there is no nextBlock and currentBlock is default, do not navigate
               */
              if (Tools.isDefault(currentBlock.tool)) {
                  return false;
              }
              /**
               * If there is no nextBlock, but currentBlock is not default,
               * insert new default block at the end and navigate to it
               */
              nextBlock = BlockManager.insertAtEnd();
          }
          if (force || this.isAtEnd) {
              /** If next Tool`s input exists, focus on it. Otherwise set caret to the next Block */
              if (!nextInput) {
                  this.setToBlock(nextBlock, this.positions.START);
              }
              else {
                  this.setToInput(nextInput, this.positions.START);
              }
              return true;
          }
          return false;
      }
      /**
       * Set's caret to the previous Tool`s input or Block
       * Before moving caret, we should check if caret position is start of the Plugins node
       * Using {@link Dom#getDeepestNode} to get a last node and match with current selection
       *
       * @param {boolean} force - force navigation even if caret is not at the start
       *
       * @returns {boolean}
       */
      navigatePrevious(force = false) {
          const { currentBlock, previousContentfulBlock } = this.Editor.BlockManager;
          if (!currentBlock) {
              return false;
          }
          const { previousInput } = currentBlock;
          if (!previousContentfulBlock && !previousInput) {
              return false;
          }
          if (force || this.isAtStart) {
              /** If previous Tool`s input exists, focus on it. Otherwise set caret to the previous Block */
              if (!previousInput) {
                  this.setToBlock(previousContentfulBlock, this.positions.END);
              }
              else {
                  this.setToInput(previousInput, this.positions.END);
              }
              return true;
          }
          return false;
      }
      /**
       * Inserts shadow element after passed element where caret can be placed
       *
       * @param {Element} element - element after which shadow caret should be inserted
       */
      createShadow(element) {
          const shadowCaret = document.createElement('span');
          shadowCaret.classList.add(Caret.CSS.shadowCaret);
          element.insertAdjacentElement('beforeend', shadowCaret);
      }
      /**
       * Restores caret position
       *
       * @param {HTMLElement} element - element where caret should be restored
       */
      restoreCaret(element) {
          const shadowCaret = element.querySelector(`.${Caret.CSS.shadowCaret}`);
          if (!shadowCaret) {
              return;
          }
          /**
           * After we set the caret to the required place
           * we need to clear shadow caret
           *
           * - make new range
           * - select shadowed span
           * - use extractContent to remove it from DOM
           */
          const sel = new SelectionUtils();
          sel.expandToTag(shadowCaret);
          setTimeout(() => {
              const newRange = document.createRange();
              newRange.selectNode(shadowCaret);
              newRange.extractContents();
          }, 50);
      }
      /**
       * Inserts passed content at caret position
       *
       * @param {string} content - content to insert
       */
      insertContentAtCaretPosition(content) {
          const fragment = document.createDocumentFragment();
          const wrapper = document.createElement('div');
          const selection = SelectionUtils.get();
          const range = SelectionUtils.range;
          wrapper.innerHTML = content;
          Array.from(wrapper.childNodes).forEach((child) => fragment.appendChild(child));
          /**
           * If there is no child node, append empty one
           */
          if (fragment.childNodes.length === 0) {
              fragment.appendChild(new Text(''));
          }
          const lastChild = fragment.lastChild;
          range.deleteContents();
          range.insertNode(fragment);
          /** Cross-browser caret insertion */
          const newRange = document.createRange();
          newRange.setStart(lastChild, lastChild.textContent.length);
          selection.removeAllRanges();
          selection.addRange(newRange);
      }
      /**
       * Get all first-level (first child of [contenteditabel]) siblings from passed node
       * Then you can check it for emptiness
       *
       * @example
       * <div contenteditable>
       * <p></p>                            |
       * <p></p>                            | left first-level siblings
       * <p></p>                            |
       * <blockquote><a><b>adaddad</b><a><blockquote>       <-- passed node for example <b>
       * <p></p>                            |
       * <p></p>                            | right first-level siblings
       * <p></p>                            |
       * </div>
       *
       * @param {HTMLElement} from - element from which siblings should be searched
       * @param {'left' | 'right'} direction - direction of search
       *
       * @returns {HTMLElement[]}
       */
      getHigherLevelSiblings(from, direction) {
          let current = from;
          const siblings = [];
          /**
           * Find passed node's firs-level parent (in example - blockquote)
           */
          while (current.parentNode && current.parentNode.contentEditable !== 'true') {
              current = current.parentNode;
          }
          const sibling = direction === 'left' ? 'previousSibling' : 'nextSibling';
          /**
           * Find all left/right siblings
           */
          while (current[sibling]) {
              current = current[sibling];
              siblings.push(current);
          }
          return siblings;
      }
  }
  Caret.displayName = 'Caret';

  /**
   *
   */
  class BlockSelection extends Module {
      constructor() {
          super(...arguments);
          /**
           * Sometimes .anyBlockSelected can be called frequently,
           * for example at ui@selectionChange (to clear native browser selection in CBS)
           * We use cache to prevent multiple iterations through all the blocks
           *
           * @private
           */
          this.anyBlockSelectedCache = null;
          /**
           * Flag used to define block selection
           * First CMD+A defines it as true and then second CMD+A selects all Blocks
           *
           * @type {boolean}
           */
          this.needToSelectAll = false;
          /**
           * Flag used to define native input selection
           * In this case we allow double CMD+A to select Block
           *
           * @type {boolean}
           */
          this.nativeInputSelected = false;
          /**
           * Flag identifies any input selection
           * That means we can select whole Block
           *
           * @type {boolean}
           */
          this.readyToBlockSelection = false;
      }
      /**
       * Sanitizer Config
       *
       * @returns {SanitizerConfig}
       */
      get sanitizerConfig() {
          return {
              p: {},
              h1: {},
              h2: {},
              h3: {},
              h4: {},
              h5: {},
              h6: {},
              ol: {},
              ul: {},
              li: {},
              br: true,
              img: {
                  src: true,
                  width: true,
                  height: true,
              },
              a: {
                  href: true,
              },
              b: {},
              i: {},
              u: {},
          };
      }
      /**
       * Flag that identifies all Blocks selection
       *
       * @returns {boolean}
       */
      get allBlocksSelected() {
          const { BlockManager } = this.Editor;
          return BlockManager.blocks.every((block) => block.selected === true);
      }
      /**
       * Set selected all blocks
       *
       * @param {boolean} state - state to set
       */
      set allBlocksSelected(state) {
          const { BlockManager } = this.Editor;
          BlockManager.blocks.forEach((block) => {
              block.selected = state;
          });
          this.clearCache();
      }
      /**
       * Flag that identifies any Block selection
       *
       * @returns {boolean}
       */
      get anyBlockSelected() {
          const { BlockManager } = this.Editor;
          if (this.anyBlockSelectedCache === null) {
              this.anyBlockSelectedCache = BlockManager.blocks.some((block) => block.selected === true);
          }
          return this.anyBlockSelectedCache;
      }
      /**
       * Return selected Blocks array
       *
       * @returns {Block[]}
       */
      get selectedBlocks() {
          return this.Editor.BlockManager.blocks.filter((block) => block.selected);
      }
      /**
       * Module Preparation
       * Registers Shortcuts CMD+A and CMD+C
       * to select all and copy them
       */
      prepare() {
          const { Shortcuts } = this.Editor;
          this.selection = new SelectionUtils();
          /**
           * CMD/CTRL+A selection shortcut
           */
          Shortcuts.add({
              name: 'CMD+A',
              handler: (event) => {
                  const { BlockManager, ReadOnly } = this.Editor;
                  /**
                   * We use Editor's Block selection on CMD+A ShortCut instead of Browsers
                   */
                  if (ReadOnly.isEnabled) {
                      event.preventDefault();
                      this.selectAllBlocks();
                      return;
                  }
                  /**
                   * When one page consist of two or more EditorJS instances
                   * Shortcut module tries to handle all events.
                   * Thats why Editor's selection works inside the target Editor, but
                   * for others error occurs because nothing to select.
                   *
                   * Prevent such actions if focus is not inside the Editor
                   */
                  if (!BlockManager.currentBlock) {
                      return;
                  }
                  this.handleCommandA(event);
              },
          });
      }
      /**
       * Toggle read-only state
       *
       *  - Remove all ranges
       *  - Unselect all Blocks
       *
       * @param {boolean} readOnlyEnabled - "read only" state
       */
      toggleReadOnly(readOnlyEnabled) {
          SelectionUtils.get()
              .removeAllRanges();
          this.allBlocksSelected = false;
      }
      /**
       * Remove selection of Block
       *
       * @param {number?} index - Block index according to the BlockManager's indexes
       */
      unSelectBlockByIndex(index) {
          const { BlockManager } = this.Editor;
          let block;
          if (isNaN(index)) {
              block = BlockManager.currentBlock;
          }
          else {
              block = BlockManager.getBlockByIndex(index);
          }
          block.selected = false;
          this.clearCache();
      }
      /**
       * Clear selection from Blocks
       *
       * @param {Event} reason - event caused clear of selection
       * @param {boolean} restoreSelection - if true, restore saved selection
       */
      clearSelection(reason, restoreSelection = false) {
          const { BlockManager, Caret, RectangleSelection } = this.Editor;
          this.needToSelectAll = false;
          this.nativeInputSelected = false;
          this.readyToBlockSelection = false;
          const isKeyboard = reason && (reason instanceof KeyboardEvent);
          const isPrintableKey$1 = isKeyboard && isPrintableKey(reason.keyCode);
          /**
           * If reason caused clear of the selection was printable key and any block is selected,
           * remove selected blocks and insert pressed key
           */
          if (this.anyBlockSelected && isKeyboard && isPrintableKey$1 && !SelectionUtils.isSelectionExists) {
              const indexToInsert = BlockManager.removeSelectedBlocks();
              BlockManager.insertDefaultBlockAtIndex(indexToInsert, true);
              Caret.setToBlock(BlockManager.currentBlock);
              delay(() => {
                  const eventKey = reason.key;
                  /**
                   * If event.key length >1 that means key is special (e.g. Enter or Dead or Unidentifier).
                   * So we use empty string
                   *
                   * @see https://developer.mozilla.org/ru/docs/Web/API/KeyboardEvent/key
                   */
                  Caret.insertContentAtCaretPosition(eventKey.length > 1 ? '' : eventKey);
              }, 20)();
          }
          this.Editor.CrossBlockSelection.clear(reason);
          if (!this.anyBlockSelected || RectangleSelection.isRectActivated()) {
              this.Editor.RectangleSelection.clearSelection();
              return;
          }
          /**
           * Restore selection when Block is already selected
           * but someone tries to write something.
           */
          if (restoreSelection) {
              this.selection.restore();
          }
          /** Now all blocks cleared */
          this.allBlocksSelected = false;
      }
      /**
       * Reduce each Block and copy its content
       *
       * @param {ClipboardEvent} e - copy/cut event
       *
       * @returns {Promise<void>}
       */
      copySelectedBlocks(e) {
          return __awaiter(this, void 0, void 0, function* () {
              /**
               * Prevent default copy
               */
              e.preventDefault();
              const fakeClipboard = Dom.make('div');
              this.selectedBlocks.forEach((block) => {
                  /**
                   * Make <p> tag that holds clean HTML
                   */
                  const cleanHTML = this.Editor.Sanitizer.clean(block.holder.innerHTML, this.sanitizerConfig);
                  const fragment = Dom.make('p');
                  fragment.innerHTML = cleanHTML;
                  fakeClipboard.appendChild(fragment);
              });
              const savedData = yield Promise.all(this.selectedBlocks.map((block) => block.save()));
              const textPlain = Array.from(fakeClipboard.childNodes).map((node) => node.textContent)
                  .join('\n\n');
              const textHTML = fakeClipboard.innerHTML;
              e.clipboardData.setData('text/plain', textPlain);
              e.clipboardData.setData('text/html', textHTML);
              e.clipboardData.setData(this.Editor.Paste.MIME_TYPE, JSON.stringify(savedData));
          });
      }
      /**
       * select Block
       *
       * @param {number?} index - Block index according to the BlockManager's indexes
       */
      selectBlockByIndex(index) {
          const { BlockManager } = this.Editor;
          /**
           * Remove previous focused Block's state
           */
          BlockManager.clearFocused();
          let block;
          if (isNaN(index)) {
              block = BlockManager.currentBlock;
          }
          else {
              block = BlockManager.getBlockByIndex(index);
          }
          /** Save selection */
          this.selection.save();
          SelectionUtils.get()
              .removeAllRanges();
          block.selected = true;
          this.clearCache();
          /** close InlineToolbar when we selected any Block */
          this.Editor.InlineToolbar.close();
      }
      /**
       * Clear anyBlockSelected cache
       */
      clearCache() {
          this.anyBlockSelectedCache = null;
      }
      /**
       * Module destruction
       * De-registers Shortcut CMD+A
       */
      destroy() {
          const { Shortcuts } = this.Editor;
          /** Selection shortcut */
          Shortcuts.remove('CMD+A');
      }
      /**
       * First CMD+A selects all input content by native behaviour,
       * next CMD+A keypress selects all blocks
       *
       * @param {KeyboardEvent} event - keyboard event
       */
      handleCommandA(event) {
          this.Editor.RectangleSelection.clearSelection();
          /** allow default selection on native inputs */
          if (Dom.isNativeInput(event.target) && !this.readyToBlockSelection) {
              this.readyToBlockSelection = true;
              return;
          }
          const workingBlock = this.Editor.BlockManager.getBlock(event.target);
          const inputs = workingBlock.inputs;
          /**
           * If Block has more than one editable element allow native selection
           * Second cmd+a will select whole Block
           */
          if (inputs.length > 1 && !this.readyToBlockSelection) {
              this.readyToBlockSelection = true;
              return;
          }
          if (inputs.length === 1 && !this.needToSelectAll) {
              this.needToSelectAll = true;
              return;
          }
          if (this.needToSelectAll) {
              /**
               * Prevent default selection
               */
              event.preventDefault();
              this.selectAllBlocks();
              /**
               * Disable any selection after all Blocks selected
               */
              this.needToSelectAll = false;
              this.readyToBlockSelection = false;
              /**
               * Close ConversionToolbar when all Blocks selected
               */
              this.Editor.ConversionToolbar.close();
          }
          else if (this.readyToBlockSelection) {
              /**
               * prevent default selection when we use custom selection
               */
              event.preventDefault();
              /**
               * select working Block
               */
              this.selectBlockByIndex();
              /**
               * Enable all Blocks selection if current Block is selected
               */
              this.needToSelectAll = true;
          }
      }
      /**
       * Select All Blocks
       * Each Block has selected setter that makes Block copyable
       */
      selectAllBlocks() {
          /**
           * Save selection
           * Will be restored when closeSelection fired
           */
          this.selection.save();
          /**
           * Remove Ranges from Selection
           */
          SelectionUtils.get()
              .removeAllRanges();
          this.allBlocksSelected = true;
          /** close InlineToolbar if we selected all Blocks */
          this.Editor.InlineToolbar.close();
      }
  }
  BlockSelection.displayName = 'BlockSelection';

  /**
   * @class Blocks
   * @classdesc Class to work with Block instances a rray
   *
   * @private
   *
   * @property {HTMLElement} workingArea — editor`s working node
   *
   */
  class Blocks {
      /**
       * @class
       *
       * @param {HTMLElement} workingArea — editor`s working node
       */
      constructor(workingArea) {
          this.blocks = [];
          this.workingArea = workingArea;
      }
      /**
       * Get length of Block instances array
       *
       * @returns {number}
       */
      get length() {
          return this.blocks.length;
      }
      /**
       * Get Block instances array
       *
       * @returns {Block[]}
       */
      get array() {
          return this.blocks;
      }
      /**
       * Get blocks html elements array
       *
       * @returns {HTMLElement[]}
       */
      get nodes() {
          return array(this.workingArea.children);
      }
      /**
       * Proxy trap to implement array-like setter
       *
       * @example
       * blocks[0] = new Block(...)
       *
       * @param {Blocks} instance — Blocks instance
       * @param {PropertyKey} property — block index or any Blocks class property key to set
       * @param {Block} value — value to set
       * @returns {boolean}
       */
      static set(instance, property, value) {
          /**
           * If property name is not a number (method or other property, access it via reflect
           */
          if (isNaN(Number(property))) {
              Reflect.set(instance, property, value);
              return true;
          }
          /**
           * If property is number, call insert method to emulate array behaviour
           *
           * @example
           * blocks[0] = new Block();
           */
          instance.insert(+property, value);
          return true;
      }
      /**
       * Proxy trap to implement array-like getter
       *
       * @param {Blocks} instance — Blocks instance
       * @param {PropertyKey} property — Blocks class property key
       * @returns {Block|*}
       */
      static get(instance, property) {
          /**
           * If property is not a number, get it via Reflect object
           */
          if (isNaN(Number(property))) {
              return Reflect.get(instance, property);
          }
          /**
           * If property is a number (Block index) return Block by passed index
           */
          return instance.get(+property);
      }
      /**
       * Push new Block to the blocks array and append it to working area
       *
       * @param {Block} block - Block to add
       */
      push(block) {
          this.blocks.push(block);
          this.insertToDOM(block);
      }
      /**
       * Swaps blocks with indexes first and second
       *
       * @param {number} first - first block index
       * @param {number} second - second block index
       * @deprecated — use 'move' instead
       */
      swap(first, second) {
          const secondBlock = this.blocks[second];
          /**
           * Change in DOM
           */
          Dom.swap(this.blocks[first].holder, secondBlock.holder);
          /**
           * Change in array
           */
          this.blocks[second] = this.blocks[first];
          this.blocks[first] = secondBlock;
      }
      /**
       * Move a block from one to another index
       *
       * @param {number} toIndex - new index of the block
       * @param {number} fromIndex - block to move
       */
      move(toIndex, fromIndex) {
          /**
           * cut out the block, move the DOM element and insert at the desired index
           * again (the shifting within the blocks array will happen automatically).
           *
           * @see https://stackoverflow.com/a/44932690/1238150
           */
          const block = this.blocks.splice(fromIndex, 1)[0];
          // manipulate DOM
          const prevIndex = toIndex - 1;
          const previousBlockIndex = Math.max(0, prevIndex);
          const previousBlock = this.blocks[previousBlockIndex];
          if (toIndex > 0) {
              this.insertToDOM(block, 'afterend', previousBlock);
          }
          else {
              this.insertToDOM(block, 'beforebegin', previousBlock);
          }
          // move in array
          this.blocks.splice(toIndex, 0, block);
          // invoke hook
          const event = this.composeBlockEvent('move', {
              fromIndex,
              toIndex,
          });
          block.call(BlockToolAPI.MOVED, event);
      }
      /**
       * Insert new Block at passed index
       *
       * @param {number} index — index to insert Block
       * @param {Block} block — Block to insert
       * @param {boolean} replace — it true, replace block on given index
       */
      insert(index, block, replace = false) {
          if (!this.length) {
              this.push(block);
              return;
          }
          if (index > this.length) {
              index = this.length;
          }
          if (replace) {
              this.blocks[index].holder.remove();
              this.blocks[index].call(BlockToolAPI.REMOVED);
          }
          const deleteCount = replace ? 1 : 0;
          this.blocks.splice(index, deleteCount, block);
          if (index > 0) {
              const previousBlock = this.blocks[index - 1];
              this.insertToDOM(block, 'afterend', previousBlock);
          }
          else {
              const nextBlock = this.blocks[index + 1];
              if (nextBlock) {
                  this.insertToDOM(block, 'beforebegin', nextBlock);
              }
              else {
                  this.insertToDOM(block);
              }
          }
      }
      /**
       * Remove block
       *
       * @param {number} index - index of Block to remove
       */
      remove(index) {
          if (isNaN(index)) {
              index = this.length - 1;
          }
          this.blocks[index].holder.remove();
          this.blocks[index].call(BlockToolAPI.REMOVED);
          this.blocks.splice(index, 1);
      }
      /**
       * Remove all blocks
       */
      removeAll() {
          this.workingArea.innerHTML = '';
          this.blocks.forEach((block) => block.call(BlockToolAPI.REMOVED));
          this.blocks.length = 0;
      }
      /**
       * Insert Block after passed target
       *
       * @todo decide if this method is necessary
       *
       * @param {Block} targetBlock — target after which Block should be inserted
       * @param {Block} newBlock — Block to insert
       */
      insertAfter(targetBlock, newBlock) {
          const index = this.blocks.indexOf(targetBlock);
          this.insert(index + 1, newBlock);
      }
      /**
       * Get Block by index
       *
       * @param {number} index — Block index
       * @returns {Block}
       */
      get(index) {
          return this.blocks[index];
      }
      /**
       * Return index of passed Block
       *
       * @param {Block} block - Block to find
       * @returns {number}
       */
      indexOf(block) {
          return this.blocks.indexOf(block);
      }
      /**
       * Insert new Block into DOM
       *
       * @param {Block} block - Block to insert
       * @param {InsertPosition} position — insert position (if set, will use insertAdjacentElement)
       * @param {Block} target — Block related to position
       */
      insertToDOM(block, position, target) {
          if (position) {
              target.holder.insertAdjacentElement(position, block.holder);
          }
          else {
              this.workingArea.appendChild(block.holder);
          }
          block.call(BlockToolAPI.RENDERED);
      }
      /**
       * Composes Block event with passed type and details
       *
       * @param {string} type - event type
       * @param {object} detail - event detail
       */
      composeBlockEvent(type, detail) {
          return new CustomEvent(type, {
              detail,
          });
      }
  }

  /**
   * @typedef {BlockManager} BlockManager
   * @property {number} currentBlockIndex - Index of current working block
   * @property {Proxy} _blocks - Proxy for Blocks instance {@link Blocks}
   */
  class BlockManager extends Module {
      constructor() {
          super(...arguments);
          /**
           * Index of current working block
           *
           * @type {number}
           */
          this._currentBlockIndex = -1;
          /**
           * Proxy for Blocks instance {@link Blocks}
           *
           * @type {Proxy}
           * @private
           */
          this._blocks = null;
      }
      /**
       * Returns current Block index
       *
       * @returns {number}
       */
      get currentBlockIndex() {
          return this._currentBlockIndex;
      }
      /**
       * Set current Block index and fire Block lifecycle callbacks
       *
       * @param {number} newIndex - index of Block to set as current
       */
      set currentBlockIndex(newIndex) {
          if (this._blocks[this._currentBlockIndex]) {
              this._blocks[this._currentBlockIndex].willUnselect();
          }
          if (this._blocks[newIndex]) {
              this._blocks[newIndex].willSelect();
          }
          this._currentBlockIndex = newIndex;
      }
      /**
       * returns first Block
       *
       * @returns {Block}
       */
      get firstBlock() {
          return this._blocks[0];
      }
      /**
       * returns last Block
       *
       * @returns {Block}
       */
      get lastBlock() {
          return this._blocks[this._blocks.length - 1];
      }
      /**
       * Get current Block instance
       *
       * @returns {Block}
       */
      get currentBlock() {
          return this._blocks[this.currentBlockIndex];
      }
      /**
       * Returns next Block instance
       *
       * @returns {Block|null}
       */
      get nextBlock() {
          const isLastBlock = this.currentBlockIndex === (this._blocks.length - 1);
          if (isLastBlock) {
              return null;
          }
          return this._blocks[this.currentBlockIndex + 1];
      }
      /**
       * Return first Block with inputs after current Block
       *
       * @returns {Block | undefined}
       */
      get nextContentfulBlock() {
          const nextBlocks = this.blocks.slice(this.currentBlockIndex + 1);
          return nextBlocks.find((block) => !!block.inputs.length);
      }
      /**
       * Return first Block with inputs before current Block
       *
       * @returns {Block | undefined}
       */
      get previousContentfulBlock() {
          const previousBlocks = this.blocks.slice(0, this.currentBlockIndex).reverse();
          return previousBlocks.find((block) => !!block.inputs.length);
      }
      /**
       * Returns previous Block instance
       *
       * @returns {Block|null}
       */
      get previousBlock() {
          const isFirstBlock = this.currentBlockIndex === 0;
          if (isFirstBlock) {
              return null;
          }
          return this._blocks[this.currentBlockIndex - 1];
      }
      /**
       * Get array of Block instances
       *
       * @returns {Block[]} {@link Blocks#array}
       */
      get blocks() {
          return this._blocks.array;
      }
      /**
       * Check if each Block is empty
       *
       * @returns {boolean}
       */
      get isEditorEmpty() {
          return this.blocks.every((block) => block.isEmpty);
      }
      /**
       * Should be called after Editor.UI preparation
       * Define this._blocks property
       */
      prepare() {
          const blocks = new Blocks(this.Editor.UI.nodes.redactor);
          /**
           * We need to use Proxy to overload set/get [] operator.
           * So we can use array-like syntax to access blocks
           *
           * @example
           * this._blocks[0] = new Block(...);
           *
           * block = this._blocks[0];
           *
           * @todo proxy the enumerate method
           *
           * @type {Proxy}
           * @private
           */
          this._blocks = new Proxy(blocks, {
              set: Blocks.set,
              get: Blocks.get,
          });
          /** Copy event */
          this.Editor.Listeners.on(document, 'copy', (e) => this.Editor.BlockEvents.handleCommandC(e));
      }
      /**
       * Toggle read-only state
       *
       * If readOnly is true:
       *  - Unbind event handlers from created Blocks
       *
       * if readOnly is false:
       *  - Bind event handlers to all existing Blocks
       *
       * @param {boolean} readOnlyEnabled - "read only" state
       */
      toggleReadOnly(readOnlyEnabled) {
          if (!readOnlyEnabled) {
              this.enableModuleBindings();
          }
          else {
              this.disableModuleBindings();
          }
      }
      /**
       * Creates Block instance by tool name
       *
       * @param {object} options - block creation options
       * @param {string} options.tool - tools passed in editor config {@link EditorConfig#tools}
       * @param {BlockToolData} [options.data] - constructor params
       *
       * @returns {Block}
       */
      composeBlock({ tool, data = {} }) {
          const readOnly = this.Editor.ReadOnly.isEnabled;
          const settings = this.Editor.Tools.getToolSettings(tool);
          const Tool = this.Editor.Tools.available[tool];
          const block = new Block({
              name: tool,
              data,
              Tool,
              settings,
              api: this.Editor.API,
              readOnly,
          });
          if (!readOnly) {
              this.bindBlockEvents(block);
          }
          return block;
      }
      /**
       * Insert new block into _blocks
       *
       * @param {object} options - insert options
       * @param {string} options.tool - plugin name, by default method inserts the default block type
       * @param {object} options.data - plugin data
       * @param {number} options.index - index where to insert new Block
       * @param {boolean} options.needToFocus - flag shows if needed to update current Block index
       * @param {boolean} options.replace - flag shows if block by passed index should be replaced with inserted one
       *
       * @returns {Block}
       */
      insert({ tool = this.config.defaultBlock, data = {}, index, needToFocus = true, replace = false, } = {}) {
          let newIndex = index;
          if (newIndex === undefined) {
              newIndex = this.currentBlockIndex + (replace ? 0 : 1);
          }
          const block = this.composeBlock({
              tool,
              data,
          });
          this._blocks.insert(newIndex, block, replace);
          if (needToFocus) {
              this.currentBlockIndex = newIndex;
          }
          else if (newIndex <= this.currentBlockIndex) {
              this.currentBlockIndex++;
          }
          return block;
      }
      /**
       * Replace current working block
       *
       * @param {object} options - replace options
       * @param {string} options.tool — plugin name
       * @param {BlockToolData} options.data — plugin data
       *
       * @returns {Block}
       */
      replace({ tool = this.config.defaultBlock, data = {}, }) {
          return this.insert({
              tool,
              data,
              index: this.currentBlockIndex,
              replace: true,
          });
      }
      /**
       * Insert pasted content. Call onPaste callback after insert.
       *
       * @param {string} toolName - name of Tool to insert
       * @param {PasteEvent} pasteEvent - pasted data
       * @param {boolean} replace - should replace current block
       */
      paste(toolName, pasteEvent, replace = false) {
          const block = this.insert({
              tool: toolName,
              replace,
          });
          try {
              block.call(BlockToolAPI.ON_PASTE, pasteEvent);
          }
          catch (e) {
              log(`${toolName}: onPaste callback call is failed`, 'error', e);
          }
          return block;
      }
      /**
       * Insert new default block at passed index
       *
       * @param {number} index - index where Block should be inserted
       * @param {boolean} needToFocus - if true, updates current Block index
       *
       * TODO: Remove method and use insert() with index instead (?)
       *
       * @returns {Block} inserted Block
       */
      insertDefaultBlockAtIndex(index, needToFocus = false) {
          const block = this.composeBlock({ tool: this.config.defaultBlock });
          this._blocks[index] = block;
          if (needToFocus) {
              this.currentBlockIndex = index;
          }
          else if (index <= this.currentBlockIndex) {
              this.currentBlockIndex++;
          }
          return block;
      }
      /**
       * Always inserts at the end
       *
       * @returns {Block}
       */
      insertAtEnd() {
          /**
           * Define new value for current block index
           */
          this.currentBlockIndex = this.blocks.length - 1;
          /**
           * Insert the default typed block
           */
          return this.insert();
      }
      /**
       * Merge two blocks
       *
       * @param {Block} targetBlock - previous block will be append to this block
       * @param {Block} blockToMerge - block that will be merged with target block
       *
       * @returns {Promise} - the sequence that can be continued
       */
      mergeBlocks(targetBlock, blockToMerge) {
          return __awaiter(this, void 0, void 0, function* () {
              const blockToMergeIndex = this._blocks.indexOf(blockToMerge);
              if (blockToMerge.isEmpty) {
                  return;
              }
              const blockToMergeData = yield blockToMerge.data;
              if (!isEmpty(blockToMergeData)) {
                  yield targetBlock.mergeWith(blockToMergeData);
              }
              this.removeBlock(blockToMergeIndex);
              this.currentBlockIndex = this._blocks.indexOf(targetBlock);
          });
      }
      /**
       * Remove block with passed index or remove last
       *
       * @param {number|null} index - index of Block to remove
       * @throws {Error} if Block to remove is not found
       */
      removeBlock(index = this.currentBlockIndex) {
          /**
           * If index is not passed and there is no block selected, show a warning
           */
          if (!this.validateIndex(index)) {
              throw new Error('Can\'t find a Block to remove');
          }
          this._blocks.remove(index);
          if (this.currentBlockIndex >= index) {
              this.currentBlockIndex--;
          }
          /**
           * If first Block was removed, insert new Initial Block and set focus on it`s first input
           */
          if (!this.blocks.length) {
              this.currentBlockIndex = -1;
              this.insert();
          }
          else if (index === 0) {
              this.currentBlockIndex = 0;
          }
      }
      /**
       * Remove only selected Blocks
       * and returns first Block index where started removing...
       *
       * @returns {number|undefined}
       */
      removeSelectedBlocks() {
          let firstSelectedBlockIndex;
          /**
           * Remove selected Blocks from the end
           */
          for (let index = this.blocks.length - 1; index >= 0; index--) {
              if (!this.blocks[index].selected) {
                  continue;
              }
              this.removeBlock(index);
              firstSelectedBlockIndex = index;
          }
          return firstSelectedBlockIndex;
      }
      /**
       * Attention!
       * After removing insert the new default typed Block and focus on it
       * Removes all blocks
       */
      removeAllBlocks() {
          for (let index = this.blocks.length - 1; index >= 0; index--) {
              this._blocks.remove(index);
          }
          this.currentBlockIndex = -1;
          this.insert();
          this.currentBlock.firstInput.focus();
      }
      /**
       * Split current Block
       * 1. Extract content from Caret position to the Block`s end
       * 2. Insert a new Block below current one with extracted content
       *
       * @returns {Block}
       */
      split() {
          const extractedFragment = this.Editor.Caret.extractFragmentFromCaretPosition();
          const wrapper = Dom.make('div');
          wrapper.appendChild(extractedFragment);
          /**
           * @todo make object in accordance with Tool
           */
          const data = {
              text: Dom.isEmpty(wrapper) ? '' : wrapper.innerHTML,
          };
          /**
           * Renew current Block
           *
           * @type {Block}
           */
          return this.insert({ data });
      }
      /**
       * Returns Block by passed index
       *
       * @param {number} index - index to get
       *
       * @returns {Block}
       */
      getBlockByIndex(index) {
          return this._blocks[index];
      }
      /**
       * Get Block instance by html element
       *
       * @param {Node} element - html element to get Block by
       *
       * @returns {Block}
       */
      getBlock(element) {
          if (!Dom.isElement(element)) {
              element = element.parentNode;
          }
          const nodes = this._blocks.nodes, firstLevelBlock = element.closest(`.${Block.CSS.wrapper}`), index = nodes.indexOf(firstLevelBlock);
          if (index >= 0) {
              return this._blocks[index];
          }
      }
      /**
       * Remove selection from all Blocks then highlight only Current Block
       */
      highlightCurrentNode() {
          /**
           * Remove previous selected Block's state
           */
          this.clearFocused();
          /**
           * Mark current Block as selected
           *
           * @type {boolean}
           */
          this.currentBlock.focused = true;
      }
      /**
       * Remove selection from all Blocks
       */
      clearFocused() {
          this.blocks.forEach((block) => {
              block.focused = false;
          });
      }
      /**
       * 1) Find first-level Block from passed child Node
       * 2) Mark it as current
       *
       *  @param {Node} childNode - look ahead from this node.
       *
       *  @throws Error  - when passed Node is not included at the Block
       */
      setCurrentBlockByChildNode(childNode) {
          /**
           * If node is Text TextNode
           */
          if (!Dom.isElement(childNode)) {
              childNode = childNode.parentNode;
          }
          const parentFirstLevelBlock = childNode.closest(`.${Block.CSS.wrapper}`);
          if (parentFirstLevelBlock) {
              /**
               * Update current Block's index
               *
               * @type {number}
               */
              this.currentBlockIndex = this._blocks.nodes.indexOf(parentFirstLevelBlock);
              /**
               * Update current block active input
               */
              this.currentBlock.updateCurrentInput();
              return this.currentBlock;
          }
          else {
              throw new Error('Can not find a Block from this child Node');
          }
      }
      /**
       * Return block which contents passed node
       *
       * @param {Node} childNode - node to get Block by
       *
       * @returns {Block}
       */
      getBlockByChildNode(childNode) {
          /**
           * If node is Text TextNode
           */
          if (!Dom.isElement(childNode)) {
              childNode = childNode.parentNode;
          }
          const firstLevelBlock = childNode.closest(`.${Block.CSS.wrapper}`);
          return this.blocks.find((block) => block.holder === firstLevelBlock);
      }
      /**
       * Swap Blocks Position
       *
       * @param {number} fromIndex - index of first block
       * @param {number} toIndex - index of second block
       *
       * @deprecated — use 'move' instead
       */
      swap(fromIndex, toIndex) {
          /** Move up current Block */
          this._blocks.swap(fromIndex, toIndex);
          /** Now actual block moved up so that current block index decreased */
          this.currentBlockIndex = toIndex;
      }
      /**
       * Move a block to a new index
       *
       * @param {number} toIndex - index where to move Block
       * @param {number} fromIndex - index of Block to move
       */
      move(toIndex, fromIndex = this.currentBlockIndex) {
          // make sure indexes are valid and within a valid range
          if (isNaN(toIndex) || isNaN(fromIndex)) {
              log(`Warning during 'move' call: incorrect indices provided.`, 'warn');
              return;
          }
          if (!this.validateIndex(toIndex) || !this.validateIndex(fromIndex)) {
              log(`Warning during 'move' call: indices cannot be lower than 0 or greater than the amount of blocks.`, 'warn');
              return;
          }
          /** Move up current Block */
          this._blocks.move(toIndex, fromIndex);
          /** Now actual block moved so that current block index changed */
          this.currentBlockIndex = toIndex;
      }
      /**
       * Sets current Block Index -1 which means unknown
       * and clear highlightings
       */
      dropPointer() {
          this.currentBlockIndex = -1;
          this.clearFocused();
      }
      /**
       * Clears Editor
       *
       * @param {boolean} needToAddDefaultBlock - 1) in internal calls (for example, in api.blocks.render)
       *                                             we don't need to add an empty default block
       *                                        2) in api.blocks.clear we should add empty block
       */
      clear(needToAddDefaultBlock = false) {
          this._blocks.removeAll();
          this.dropPointer();
          if (needToAddDefaultBlock) {
              this.insert();
          }
          /**
           * Add empty modifier
           */
          this.Editor.UI.checkEmptiness();
      }
      /**
       * Cleans up all the block tools' resources
       * This is called when editor is destroyed
       */
      destroy() {
          return __awaiter(this, void 0, void 0, function* () {
              yield Promise.all(this.blocks.map((block) => {
                  if (isFunction(block.tool.destroy)) {
                      return block.tool.destroy();
                  }
              }));
          });
      }
      /**
       * Bind Block events
       *
       * @param {Block} block - Block to which event should be bound
       */
      bindBlockEvents(block) {
          const { BlockEvents } = this.Editor;
          this.readOnlyMutableListeners.on(block.holder, 'keydown', (event) => {
              BlockEvents.keydown(event);
          }, true);
          this.readOnlyMutableListeners.on(block.holder, 'keyup', (event) => {
              BlockEvents.keyup(event);
          });
          this.readOnlyMutableListeners.on(block.holder, 'dragover', (event) => {
              BlockEvents.dragOver(event);
          });
          this.readOnlyMutableListeners.on(block.holder, 'dragleave', (event) => {
              BlockEvents.dragLeave(event);
          });
      }
      /**
       * Disable mutable handlers and bindings
       */
      disableModuleBindings() {
          this.readOnlyMutableListeners.clearAll();
      }
      /**
       * Enables all module handlers and bindings for all Blocks
       */
      enableModuleBindings() {
          /** Cut event */
          this.readOnlyMutableListeners.on(document, 'cut', (e) => this.Editor.BlockEvents.handleCommandX(e));
          this.blocks.forEach((block) => {
              this.bindBlockEvents(block);
          });
      }
      /**
       * Validates that the given index is not lower than 0 or higher than the amount of blocks
       *
       * @param {number} index - index of blocks array to validate
       *
       * @returns {boolean}
       */
      validateIndex(index) {
          return !(index < 0 || index >= this._blocks.length);
      }
  }
  BlockManager.displayName = 'BlockManager';

  /**
   * Contains keyboard and mouse events binded on each Block by Block Manager
   */
  /**
   *
   */
  class BlockEvents extends Module {
      /**
       * All keydowns on Block
       *
       * @param {KeyboardEvent} event - keydown
       */
      keydown(event) {
          /**
           * Run common method for all keydown events
           */
          this.beforeKeydownProcessing(event);
          /**
           * Fire keydown processor by event.keyCode
           */
          switch (event.keyCode) {
              case keyCodes.BACKSPACE:
                  this.backspace(event);
                  break;
              case keyCodes.ENTER:
                  this.enter(event);
                  break;
              case keyCodes.DOWN:
              case keyCodes.RIGHT:
                  this.arrowRightAndDown(event);
                  break;
              case keyCodes.UP:
              case keyCodes.LEFT:
                  this.arrowLeftAndUp(event);
                  break;
              case keyCodes.TAB:
                  this.tabPressed(event);
                  break;
          }
      }
      /**
       * Fires on keydown before event processing
       *
       * @param {KeyboardEvent} event - keydown
       */
      beforeKeydownProcessing(event) {
          /**
           * Do not close Toolbox on Tabs or on Enter with opened Toolbox
           */
          if (!this.needToolbarClosing(event)) {
              return;
          }
          /**
           * When user type something:
           *  - close Toolbar
           *  - close Conversion Toolbar
           *  - clear block highlighting
           */
          if (isPrintableKey(event.keyCode)) {
              this.Editor.Toolbar.close();
              this.Editor.ConversionToolbar.close();
              /**
               * Allow to use shortcuts with selected blocks
               *
               * @type {boolean}
               */
              const isShortcut = event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
              if (!isShortcut) {
                  this.Editor.BlockManager.clearFocused();
                  this.Editor.BlockSelection.clearSelection(event);
              }
          }
      }
      /**
       * Key up on Block:
       * - shows Inline Toolbar if something selected
       * - shows conversion toolbar with 85% of block selection
       *
       * @param {KeyboardEvent} event - keyup event
       */
      keyup(event) {
          /**
           * If shift key was pressed some special shortcut is used (eg. cross block selection via shift + arrows)
           */
          if (event.shiftKey) {
              return;
          }
          /**
           * Check if editor is empty on each keyup and add special css class to wrapper
           */
          this.Editor.UI.checkEmptiness();
      }
      /**
       * Open Toolbox to leaf Tools
       *
       * @param {KeyboardEvent} event - tab keydown event
       */
      tabPressed(event) {
          /**
           * Clear blocks selection by tab
           */
          this.Editor.BlockSelection.clearSelection(event);
          const { BlockManager, Tools, InlineToolbar, ConversionToolbar } = this.Editor;
          const currentBlock = BlockManager.currentBlock;
          if (!currentBlock) {
              return;
          }
          const canOpenToolbox = Tools.isDefault(currentBlock.tool) && currentBlock.isEmpty;
          const conversionToolbarOpened = !currentBlock.isEmpty && ConversionToolbar.opened;
          const inlineToolbarOpened = !currentBlock.isEmpty && !SelectionUtils.isCollapsed && InlineToolbar.opened;
          /**
           * For empty Blocks we show Plus button via Toolbox only for default Blocks
           */
          if (canOpenToolbox) {
              this.activateToolbox();
          }
          else if (!conversionToolbarOpened && !inlineToolbarOpened) {
              this.activateBlockSettings();
          }
      }
      /**
       * Add drop target styles
       *
       * @param {DragEvent} event - drag over event
       */
      dragOver(event) {
          const block = this.Editor.BlockManager.getBlockByChildNode(event.target);
          block.dropTarget = true;
      }
      /**
       * Remove drop target style
       *
       * @param {DragEvent} event - drag leave event
       */
      dragLeave(event) {
          const block = this.Editor.BlockManager.getBlockByChildNode(event.target);
          block.dropTarget = false;
      }
      /**
       * Copying selected blocks
       * Before putting to the clipboard we sanitize all blocks and then copy to the clipboard
       *
       * @param {ClipboardEvent} event - clipboard event
       */
      handleCommandC(event) {
          const { BlockSelection } = this.Editor;
          if (!BlockSelection.anyBlockSelected) {
              return;
          }
          // Copy Selected Blocks
          BlockSelection.copySelectedBlocks(event);
      }
      /**
       * Copy and Delete selected Blocks
       *
       * @param {ClipboardEvent} event - clipboard event
       */
      handleCommandX(event) {
          const { BlockSelection, BlockManager, Caret } = this.Editor;
          if (!BlockSelection.anyBlockSelected) {
              return;
          }
          BlockSelection.copySelectedBlocks(event);
          const selectionPositionIndex = BlockManager.removeSelectedBlocks();
          Caret.setToBlock(BlockManager.insertDefaultBlockAtIndex(selectionPositionIndex, true), Caret.positions.START);
          /** Clear selection */
          BlockSelection.clearSelection(event);
      }
      /**
       * ENTER pressed on block
       *
       * @param {KeyboardEvent} event - keydown
       */
      enter(event) {
          const { BlockManager, Tools, UI } = this.Editor;
          const currentBlock = BlockManager.currentBlock;
          const tool = Tools.available[currentBlock.name];
          /**
           * Don't handle Enter keydowns when Tool sets enableLineBreaks to true.
           * Uses for Tools like <code> where line breaks should be handled by default behaviour.
           */
          if (tool && tool[Tools.INTERNAL_SETTINGS.IS_ENABLED_LINE_BREAKS]) {
              return;
          }
          /**
           * Opened Toolbars uses Flipper with own Enter handling
           * Allow split block when no one button in Flipper is focused
           */
          if (UI.someToolbarOpened && UI.someFlipperButtonFocused) {
              return;
          }
          /**
           * Allow to create linebreaks by Shift+Enter
           */
          if (event.shiftKey) {
              return;
          }
          let newCurrent = this.Editor.BlockManager.currentBlock;
          /**
           * If enter has been pressed at the start of the text, just insert paragraph Block above
           */
          if (this.Editor.Caret.isAtStart && !this.Editor.BlockManager.currentBlock.hasMedia) {
              this.Editor.BlockManager.insertDefaultBlockAtIndex(this.Editor.BlockManager.currentBlockIndex);
          }
          else {
              /**
               * Split the Current Block into two blocks
               * Renew local current node after split
               */
              newCurrent = this.Editor.BlockManager.split();
          }
          this.Editor.Caret.setToBlock(newCurrent);
          /**
           * If new Block is empty
           */
          if (this.Editor.Tools.isDefault(newCurrent.tool) && newCurrent.isEmpty) {
              /**
               * Show Toolbar
               */
              this.Editor.Toolbar.open(false);
              /**
               * Show Plus Button
               */
              this.Editor.Toolbar.plusButton.show();
          }
          event.preventDefault();
      }
      /**
       * Handle backspace keydown on Block
       *
       * @param {KeyboardEvent} event - keydown
       */
      backspace(event) {
          const { BlockManager, BlockSelection, Caret } = this.Editor;
          const currentBlock = BlockManager.currentBlock;
          const tool = this.Editor.Tools.available[currentBlock.name];
          /**
           * Check if Block should be removed by current Backspace keydown
           */
          if (currentBlock.selected || (currentBlock.isEmpty && currentBlock.currentInput === currentBlock.firstInput)) {
              event.preventDefault();
              const index = BlockManager.currentBlockIndex;
              if (BlockManager.previousBlock && BlockManager.previousBlock.inputs.length === 0) {
                  /** If previous block doesn't contain inputs, remove it */
                  BlockManager.removeBlock(index - 1);
              }
              else {
                  /** If block is empty, just remove it */
                  BlockManager.removeBlock();
              }
              Caret.setToBlock(BlockManager.currentBlock, index ? Caret.positions.END : Caret.positions.START);
              /** Close Toolbar */
              this.Editor.Toolbar.close();
              /** Clear selection */
              BlockSelection.clearSelection(event);
              return;
          }
          /**
           * Don't handle Backspaces when Tool sets enableLineBreaks to true.
           * Uses for Tools like <code> where line breaks should be handled by default behaviour.
           *
           * But if caret is at start of the block, we allow to remove it by backspaces
           */
          if (tool && tool[this.Editor.Tools.INTERNAL_SETTINGS.IS_ENABLED_LINE_BREAKS] && !Caret.isAtStart) {
              return;
          }
          const isFirstBlock = BlockManager.currentBlockIndex === 0;
          const canMergeBlocks = Caret.isAtStart &&
              SelectionUtils.isCollapsed &&
              currentBlock.currentInput === currentBlock.firstInput &&
              !isFirstBlock;
          if (canMergeBlocks) {
              /**
               * preventing browser default behaviour
               */
              event.preventDefault();
              /**
               * Merge Blocks
               */
              this.mergeBlocks();
          }
      }
      /**
       * Merge current and previous Blocks if they have the same type
       */
      mergeBlocks() {
          const { BlockManager, Caret, Toolbar } = this.Editor;
          const targetBlock = BlockManager.previousBlock;
          const blockToMerge = BlockManager.currentBlock;
          /**
           * Blocks that can be merged:
           * 1) with the same Name
           * 2) Tool has 'merge' method
           *
           * other case will handle as usual ARROW LEFT behaviour
           */
          if (blockToMerge.name !== targetBlock.name || !targetBlock.mergeable) {
              /** If target Block doesn't contain inputs or empty, remove it */
              if (targetBlock.inputs.length === 0 || targetBlock.isEmpty) {
                  BlockManager.removeBlock(BlockManager.currentBlockIndex - 1);
                  Caret.setToBlock(BlockManager.currentBlock);
                  Toolbar.close();
                  return;
              }
              if (Caret.navigatePrevious()) {
                  Toolbar.close();
              }
              return;
          }
          Caret.createShadow(targetBlock.pluginsContent);
          BlockManager.mergeBlocks(targetBlock, blockToMerge)
              .then(() => {
              /** Restore caret position after merge */
              Caret.restoreCaret(targetBlock.pluginsContent);
              targetBlock.pluginsContent.normalize();
              Toolbar.close();
          });
      }
      /**
       * Handle right and down keyboard keys
       *
       * @param {KeyboardEvent} event - keyboard event
       */
      arrowRightAndDown(event) {
          const isFlipperCombination = Flipper.usedKeys.includes(event.keyCode) &&
              (!event.shiftKey || event.keyCode === keyCodes.TAB);
          /**
           * Arrows might be handled on toolbars by flipper
           * Check for Flipper.usedKeys to allow navigate by DOWN and disallow by RIGHT
           */
          if (this.Editor.UI.someToolbarOpened && isFlipperCombination) {
              return;
          }
          /**
           * Close Toolbar and highlighting when user moves cursor
           */
          this.Editor.BlockManager.clearFocused();
          this.Editor.Toolbar.close();
          const shouldEnableCBS = this.Editor.Caret.isAtEnd || this.Editor.BlockSelection.anyBlockSelected;
          if (event.shiftKey && event.keyCode === keyCodes.DOWN && shouldEnableCBS) {
              this.Editor.CrossBlockSelection.toggleBlockSelectedState();
              return;
          }
          const navigateNext = event.keyCode === keyCodes.DOWN || (event.keyCode === keyCodes.RIGHT && !this.isRtl);
          const isNavigated = navigateNext ? this.Editor.Caret.navigateNext() : this.Editor.Caret.navigatePrevious();
          if (isNavigated) {
              /**
               * Default behaviour moves cursor by 1 character, we need to prevent it
               */
              event.preventDefault();
          }
          else {
              /**
               * After caret is set, update Block input index
               */
              delay(() => {
                  /** Check currentBlock for case when user moves selection out of Editor */
                  if (this.Editor.BlockManager.currentBlock) {
                      this.Editor.BlockManager.currentBlock.updateCurrentInput();
                  }
              }, 20)();
          }
          /**
           * Clear blocks selection by arrows
           */
          this.Editor.BlockSelection.clearSelection(event);
      }
      /**
       * Handle left and up keyboard keys
       *
       * @param {KeyboardEvent} event - keyboard event
       */
      arrowLeftAndUp(event) {
          /**
           * Arrows might be handled on toolbars by flipper
           * Check for Flipper.usedKeys to allow navigate by UP and disallow by LEFT
           */
          if (this.Editor.UI.someToolbarOpened) {
              if (Flipper.usedKeys.includes(event.keyCode) && (!event.shiftKey || event.keyCode === keyCodes.TAB)) {
                  return;
              }
              this.Editor.UI.closeAllToolbars();
          }
          /**
           * Close Toolbar and highlighting when user moves cursor
           */
          this.Editor.BlockManager.clearFocused();
          this.Editor.Toolbar.close();
          const shouldEnableCBS = this.Editor.Caret.isAtStart || this.Editor.BlockSelection.anyBlockSelected;
          if (event.shiftKey && event.keyCode === keyCodes.UP && shouldEnableCBS) {
              this.Editor.CrossBlockSelection.toggleBlockSelectedState(false);
              return;
          }
          const navigatePrevious = event.keyCode === keyCodes.UP || (event.keyCode === keyCodes.LEFT && !this.isRtl);
          const isNavigated = navigatePrevious ? this.Editor.Caret.navigatePrevious() : this.Editor.Caret.navigateNext();
          if (isNavigated) {
              /**
               * Default behaviour moves cursor by 1 character, we need to prevent it
               */
              event.preventDefault();
          }
          else {
              /**
               * After caret is set, update Block input index
               */
              delay(() => {
                  /** Check currentBlock for case when user ends selection out of Editor and then press arrow-key */
                  if (this.Editor.BlockManager.currentBlock) {
                      this.Editor.BlockManager.currentBlock.updateCurrentInput();
                  }
              }, 20)();
          }
          /**
           * Clear blocks selection by arrows
           */
          this.Editor.BlockSelection.clearSelection(event);
      }
      /**
       * Cases when we need to close Toolbar
       *
       * @param {KeyboardEvent} event - keyboard event
       */
      needToolbarClosing(event) {
          const toolboxItemSelected = (event.keyCode === keyCodes.ENTER && this.Editor.Toolbox.opened), blockSettingsItemSelected = (event.keyCode === keyCodes.ENTER && this.Editor.BlockSettings.opened), inlineToolbarItemSelected = (event.keyCode === keyCodes.ENTER && this.Editor.InlineToolbar.opened), conversionToolbarItemSelected = (event.keyCode === keyCodes.ENTER && this.Editor.ConversionToolbar.opened), flippingToolbarItems = event.keyCode === keyCodes.TAB;
          /**
           * Do not close Toolbar in cases:
           * 1. ShiftKey pressed (or combination with shiftKey)
           * 2. When Toolbar is opened and Tab leafs its Tools
           * 3. When Toolbar's component is opened and some its item selected
           */
          return !(event.shiftKey ||
              flippingToolbarItems ||
              toolboxItemSelected ||
              blockSettingsItemSelected ||
              inlineToolbarItemSelected ||
              conversionToolbarItemSelected);
      }
      /**
       * If Toolbox is not open, then just open it and show plus button
       */
      activateToolbox() {
          if (!this.Editor.Toolbar.opened) {
              this.Editor.Toolbar.open(false, false);
              this.Editor.Toolbar.plusButton.show();
          }
          this.Editor.Toolbox.open();
      }
      /**
       * Open Toolbar and show BlockSettings before flipping Tools
       */
      activateBlockSettings() {
          if (!this.Editor.Toolbar.opened) {
              this.Editor.BlockManager.currentBlock.focused = true;
              this.Editor.Toolbar.open(true, false);
              this.Editor.Toolbar.plusButton.hide();
          }
          /**
           * If BlockSettings is not open, then open BlockSettings
           * Next Tab press will leaf Settings Buttons
           */
          if (!this.Editor.BlockSettings.opened) {
              this.Editor.BlockSettings.open();
          }
      }
  }
  BlockEvents.displayName = 'BlockEvents';

  const RootModules = [Listeners, ModificationsObserver, Notifier, Paste, ReadOnly, RectangleSelection, Renderer, Sanitizer, Saver, Tools, Shortcuts, Tooltip, UI, Events, DragNDrop, CrossBlockSelection, Caret, BlockSelection, BlockManager, BlockEvents];

  /**
   * Require Editor modules places in components/modules dir
   */
  const Modules = [
      ...APIModules, ...ToolbarModules, ...RootModules
  ];

  /**
   * @typedef {Core} Core - editor core class
   */
  /**
   * @class Core
   *
   * @classdesc Editor.js core class
   *
   * @property {EditorConfig} config - all settings
   * @property {EditorModules} moduleInstances - constructed editor components
   *
   * @type {Core}
   */
  class Core {
      /**
       * @param {EditorConfig} config - user configuration
       *
       */
      constructor(config) {
          /**
           * Object with core modules instances
           */
          this.moduleInstances = {};
          /**
           * Ready promise. Resolved if Editor.js is ready to work, rejected otherwise
           */
          let onReady, onFail;
          this.isReady = new Promise((resolve, reject) => {
              onReady = resolve;
              onFail = reject;
          });
          Promise.resolve()
              .then(() => __awaiter(this, void 0, void 0, function* () {
              this.configuration = config;
              yield this.validate();
              yield this.init();
              yield this.start();
              logLabeled('I\'m ready! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧', 'log', '', 'color: #E24A75');
              setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                  yield this.render();
                  if (this.configuration.autofocus) {
                      const { BlockManager, Caret } = this.moduleInstances;
                      Caret.setToBlock(BlockManager.blocks[0], Caret.positions.START);
                      BlockManager.highlightCurrentNode();
                  }
                  /**
                   * Remove loader, show content
                   */
                  this.moduleInstances.UI.removeLoader();
                  /**
                   * Resolve this.isReady promise
                   */
                  onReady();
              }), 500);
          }))
              .catch((error) => {
              log(`Editor.js is not ready because of ${error}`, 'error');
              /**
               * Reject this.isReady promise
               */
              onFail(error);
          });
      }
      /**
       * Setting for configuration
       *
       * @param {EditorConfig|string} config - Editor's config to set
       */
      set configuration(config) {
          var _a, _b;
          /**
           * Process zero-configuration or with only holderId
           * Make config object
           */
          if (typeof config !== 'object') {
              config = {
                  holder: config,
              };
          }
          /**
           * If holderId is preset, assign him to holder property and work next only with holder
           */
          deprecationAssert(!!config.holderId, 'config.holderId', 'config.holder');
          if (config.holderId && !config.holder) {
              config.holder = config.holderId;
              config.holderId = null;
          }
          /**
           * Place config into the class property
           *
           * @type {EditorConfig}
           */
          this.config = config;
          /**
           * If holder is empty then set a default value
           */
          if (this.config.holder == null) {
              this.config.holder = 'editorjs';
          }
          if (!this.config.logLevel) {
              this.config.logLevel = LogLevels.VERBOSE;
          }
          setLogLevel(this.config.logLevel);
          /**
           * If default Block's Tool was not passed, use the Paragraph Tool
           */
          deprecationAssert(Boolean(this.config.initialBlock), 'config.initialBlock', 'config.defaultBlock');
          this.config.defaultBlock = this.config.defaultBlock || this.config.initialBlock || 'paragraph';
          /**
           * Height of Editor's bottom area that allows to set focus on the last Block
           *
           * @type {number}
           */
          this.config.minHeight = this.config.minHeight !== undefined ? this.config.minHeight : 300;
          /**
           * Default block type
           * Uses in case when there is no blocks passed
           *
           * @type {{type: (*), data: {text: null}}}
           */
          const defaultBlockData = {
              type: this.config.defaultBlock,
              data: {},
          };
          this.config.placeholder = this.config.placeholder || false;
          this.config.sanitizer = this.config.sanitizer || {
              p: true,
              b: true,
              a: true,
          };
          this.config.hideToolbar = this.config.hideToolbar ? this.config.hideToolbar : false;
          this.config.tools = this.config.tools || {};
          this.config.i18n = this.config.i18n || {};
          this.config.data = this.config.data || {};
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          this.config.onReady = this.config.onReady || (() => { });
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          this.config.onChange = this.config.onChange || (() => { });
          this.config.inlineToolbar = this.config.inlineToolbar !== undefined ? this.config.inlineToolbar : true;
          /**
           * Initialize default Block to pass data to the Renderer
           */
          if (isEmpty(this.config.data)) {
              this.config.data = {};
              this.config.data.blocks = [defaultBlockData];
          }
          else {
              if (!this.config.data.blocks || this.config.data.blocks.length === 0) {
                  this.config.data.blocks = [defaultBlockData];
              }
          }
          this.config.readOnly = this.config.readOnly || false;
          /**
           * Adjust i18n
           */
          if ((_a = config.i18n) === null || _a === void 0 ? void 0 : _a.messages) {
              I18nConstructor.setDictionary(config.i18n.messages);
          }
          /**
           * Text direction. If not set, uses ltr
           */
          this.config.i18n.direction = ((_b = config.i18n) === null || _b === void 0 ? void 0 : _b.direction) || 'ltr';
      }
      /**
       * Returns private property
       *
       * @returns {EditorConfig}
       */
      get configuration() {
          return this.config;
      }
      /**
       * Checks for required fields in Editor's config
       *
       * @returns {Promise<void>}
       */
      validate() {
          return __awaiter(this, void 0, void 0, function* () {
              const { holderId, holder } = this.config;
              if (holderId && holder) {
                  throw Error('«holderId» and «holder» param can\'t assign at the same time.');
              }
              /**
               * Check for a holder element's existence
               */
              if (typeof holder === 'string' && !Dom.get(holder)) {
                  throw Error(`element with ID «${holder}» is missing. Pass correct holder's ID.`);
              }
              if (holder && typeof holder === 'object' && !Dom.isElement(holder)) {
                  throw Error('holder as HTMLElement if provided must be inherit from Element class.');
              }
          });
      }
      /**
       * Initializes modules:
       *  - make and save instances
       *  - configure
       */
      init() {
          /**
           * Make modules instances and save it to the @property this.moduleInstances
           */
          this.constructModules();
          /**
           * Modules configuration
           */
          this.configureModules();
      }
      /**
       * Start Editor!
       *
       * Get list of modules that needs to be prepared and return a sequence (Promise)
       *
       * @returns {Promise<void>}
       */
      start() {
          return __awaiter(this, void 0, void 0, function* () {
              const modulesToPrepare = [
                  'Tools',
                  'UI',
                  'BlockManager',
                  'Paste',
                  'BlockSelection',
                  'RectangleSelection',
                  'CrossBlockSelection',
                  'ReadOnly',
              ];
              yield modulesToPrepare.reduce((promise, module) => promise.then(() => __awaiter(this, void 0, void 0, function* () {
                  // _.log(`Preparing ${module} module`, 'time');
                  try {
                      yield this.moduleInstances[module].prepare();
                  }
                  catch (e) {
                      /**
                       * CriticalError's will not be caught
                       * It is used when Editor is rendering in read-only mode with unsupported plugin
                       */
                      if (e instanceof CriticalError) {
                          throw new Error(e.message);
                      }
                      log(`Module ${module} was skipped because of %o`, 'warn', e);
                  }
                  // _.log(`Preparing ${module} module`, 'timeEnd');
              })), Promise.resolve());
          });
      }
      /**
       * Render initial data
       */
      render() {
          return this.moduleInstances.Renderer.render(this.config.data.blocks);
      }
      /**
       * Make modules instances and save it to the @property this.moduleInstances
       */
      constructModules() {
          Modules.forEach((Module) => {
              /**
               * If module has non-default exports, passed object contains them all and default export as 'default' property
               */
              // const Module = _.isFunction(module) ? module : module.default;
              try {
                  /**
                   * We use class name provided by displayName property
                   *
                   * On build, Babel will transform all Classes to the Functions so, name will always be 'Function'
                   * To prevent this, we use 'babel-plugin-class-display-name' plugin
                   *
                   * @see  https://www.npmjs.com/package/babel-plugin-class-display-name
                   */
                  this.moduleInstances[Module.displayName] = new Module({
                      config: this.configuration,
                  });
              }
              catch (e) {
                  log(`Module ${Module.displayName} skipped because`, 'warn', e);
              }
          });
      }
      /**
       * Modules instances configuration:
       *  - pass other modules to the 'state' property
       *  - ...
       */
      configureModules() {
          for (const name in this.moduleInstances) {
              if (Object.prototype.hasOwnProperty.call(this.moduleInstances, name)) {
                  /**
                   * Module does not need self-instance
                   */
                  this.moduleInstances[name].state = this.getModulesDiff(name);
              }
          }
      }
      /**
       * Return modules without passed name
       *
       * @param {string} name - module for witch modules difference should be calculated
       */
      getModulesDiff(name) {
          const diff = {};
          for (const moduleName in this.moduleInstances) {
              /**
               * Skip module with passed name
               */
              if (moduleName === name) {
                  continue;
              }
              diff[moduleName] = this.moduleInstances[moduleName];
          }
          return diff;
      }
  }

  /**
   * Editor.js
   *
   * Short Description (눈_눈;)
   *
   * @version 2.19.1
   *
   * @license Apache-2.0
   * @author CodeX-Team <https://ifmo.su>
   */
  class EditorJS {
      /**
       * @param {EditorConfig|string|undefined} [configuration] - user configuration
       */
      constructor(configuration) {
          /**
           * Set default onReady function
           */
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          let onReady = () => { };
          /**
           * If `onReady` was passed in `configuration` then redefine onReady function
           */
          if (typeof configuration === 'object' && isFunction(configuration.onReady)) {
              onReady = configuration.onReady;
          }
          /**
           * Create a Editor.js instance
           */
          const editor = new Core(configuration);
          /**
           * We need to export isReady promise in the constructor
           * as it can be used before other API methods are exported
           *
           * @type {Promise<void>}
           */
          this.isReady = editor.isReady.then(() => {
              this.exportAPI(editor);
              onReady();
          });
      }
      /** Editor version */
      static get version() {
          return '2.19.1';
      }
      /**
       * Export external API methods
       *
       * @param {Core} editor — Editor's instance
       */
      exportAPI(editor) {
          const fieldsToExport = ['configuration'];
          const destroy = () => {
              Object.values(editor.moduleInstances)
                  .forEach((moduleInstance) => {
                  if (isFunction(moduleInstance.destroy)) {
                      moduleInstance.destroy();
                  }
              });
              editor = null;
              for (const field in this) {
                  if (Object.prototype.hasOwnProperty.call(this, field)) {
                      delete this[field];
                  }
              }
              Object.setPrototypeOf(this, null);
          };
          fieldsToExport.forEach((field) => {
              this[field] = editor[field];
          });
          this.destroy = destroy;
          Object.setPrototypeOf(this, editor.moduleInstances.API.methods);
          delete this.exportAPI;
          const shorthands = {
              blocks: {
                  clear: 'clear',
                  render: 'render',
              },
              caret: {
                  focus: 'focus',
              },
              events: {
                  on: 'on',
                  off: 'off',
                  emit: 'emit',
              },
              saver: {
                  save: 'save',
              },
          };
          Object.entries(shorthands)
              .forEach(([key, methods]) => {
              Object.entries(methods)
                  .forEach(([name, alias]) => {
                  this[alias] = editor.moduleInstances.API.methods[key][name];
              });
          });
      }
  }
  window.EditorJS = EditorJS;
  window.Paragraph = Paragraph;

}());

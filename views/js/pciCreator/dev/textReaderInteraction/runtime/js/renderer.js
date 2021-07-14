define(
    [
        'taoQtiItem/portableLib/jquery_2_1_1',
        'taoQtiItem/portableLib/lodash',
        'taoQtiItem/portableLib/handlebars',
        'textReaderInteraction/runtime/js/tabs',
        'taoQtiItem/portableLib/OAT/util/html',
        'taoQtiItem/portableLib/jquery.qtip'
    ],
    function ($, _, Handlebars, Tabs, htmlRenderer) {
        'use strict';

        /**
         * Replace all identified relative media urls by the absolute one.
         * For now only images are supported.
         *
         * @param {String} html - the html to parse
         * @param {Object} renderer
         * @returns {String} the html without updated URLs
         */
        var fixMarkupMediaSources = function fixMarkupMediaSources(html, renderer){
            html = html || '';

            return html.replace(/(<img[^>]*src=["'])([^"']+)(["'])/ig, function(substr, $1, $2, $3){
                var resolved = renderer.resolveUrl($2) || $2;
                return $1 + resolved + $3;
            });
        };
        
        return function (options) {
            var self = this;
            var defaultOptions = {
                state : 'sleep',
                templates : {},
                serial : ''
            };
            var currentPage = 0;

            /**
             * Computes the full height of an element, plus its margin.
             * This approach is more reliable than jQuery, as the decimals part is taken into account.
             * @param element
             * @returns {Number}
             */
            function getHeight(element) {
                var style = element.currentStyle || window.getComputedStyle(element);
                var rect = element.getBoundingClientRect();
                var borderBox = style.boxSizing === 'border-box';
                return rect.height + parseFloat(style.marginTop) + parseFloat(style.marginBottom) +
                    (borderBox ? 0 : parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)) +
                    (borderBox ? 0 : parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth));
            }

            /**
             * Computes the extra height of an element: padding, border, margin.
             * This is useful when computing the additional height brought by containers and wrappers.
             * @param element
             * @returns {number}
             */
            function getExtraHeight(element) {
                var style = element.currentStyle || window.getComputedStyle(element);
                return Math.abs(
                    parseFloat(style.marginTop) + parseFloat(style.marginBottom) +
                    parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) +
                    parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth)
                );
            }

            /**
             * Computes the height of the decoration elements that wraps the item viewport.
             * This is useful as we are delegating the final computation of the height to the
             * CSS engine by using the calc() helper.
             * @param {jQuery} $element
             * @returns {Number}
             */
            function getDecorationHeight($element) {
                var $container = $element.closest('.content-wrapper,#item-editor-scoll-container');
                var $box = $element.closest('.grid-row');
                var decorationHeight = 0;

                if ($box.length) {
                    decorationHeight += getHeight($box.get(0)) - getHeight($element.get(0));
                }

                if ($container.length) {
                    decorationHeight += $(window).height() - getHeight($container.get(0));
                }

                $box.parentsUntil($container).each(function() {
                    decorationHeight += getExtraHeight(this);
                });

                return decorationHeight;
            }

            /**
             * Gets the additional height brought by the wrapper.
             * @param {Boolean} multiPages
             * @returns {Number}
             */
            function getWrapperHeight(multiPages) {
                var wrapperHeight = 0;
                if (multiPages) {
                    // arbitrary additional height that comes from the existing implementation
                    // don't known why those values, but that works
                    wrapperHeight += self.options.state === 'question' ? 130 : 25;
                }
                return wrapperHeight;
            }

            /**
             * When the height is set to auto, we need to rewrite it with a computed value.
             * Also please note that the PCI markup is forcing the unit,
             * so we cannot inject safely the value through the template
             * @param {Boolean} multiPages
             */
            function autoHeight(multiPages) {
                var $container = self.options.$container;
                var $pages = $container.find('.tr-pages');
                var $passage = $container.find('.tr-passage');
                var decorationHeight = getDecorationHeight($pages);
                $pages.css('height', 'calc(100vh - ' + decorationHeight + 'px)');
                $passage.css('height', 'calc(100vh - ' + (decorationHeight + getWrapperHeight(multiPages)) + 'px)');
            }

            this.eventNs = 'textReaderInteraction';
            this.options = {};

            this.init = function () {
                var pagesTpl,
                    navTpl;
                _.assign(self.options, defaultOptions, options);

                if (!self.options.templates.pages) {
                    pagesTpl = $('.text-reader-pages-tpl').html().replace("<![CDATA[", "").replace("]]>", "");
                    self.options.templates.pages = Handlebars.compile(pagesTpl);
                }
                if (!self.options.templates.navigation) {
                    navTpl = $('.text-reader-nav-tpl').html().replace("<![CDATA[", "").replace("]]>", "");
                    self.options.templates.navigation = Handlebars.compile(navTpl);
                }
            };

            /**
             * Function sets interaction state.
             * @param {string} state name (e.g. 'question' | 'answer')
             * @return {object} this
             */
            this.setState = function (state) {
                this.options.state = state;
                return this;
            };

            /**
             * Function renders interaction pages.
             * @param {object} data - interaction properties
             * @return {object} this
             */
            this.renderPages = function (data) {
                var templateData = {},
                    $container,
                    $pages,
                    markup,
                    fixedMarkup,
                    decorationHeight;

                this.options.$container.trigger('beforerenderpages.' + self.eventNs);

                //render pages template
                if (self.options.templates.pages) {
                    _.assign(templateData, data, self.getTemplateData(data));

                    markup = self.options.templates.pages(templateData, self.getTemplateOptions());

                    if (self.options.interaction !== 'undefined' && typeof self.options.interaction.renderer !== 'undefined') {
                        fixedMarkup = fixMarkupMediaSources(
                            markup,
                            self.options.interaction.renderer
                        );
                    }

                    $container = this.options.$container.find('.js-page-container')
                        .html(fixedMarkup || markup)
                        .toggleClass('light-mode', !templateData.multiPages);

                    htmlRenderer.render($container);
                }

                //init tabs
                self.tabsManager = new Tabs(this.options.$container.find('.js-page-tabs'), {
                    afterSelect : function (index) {
                        currentPage = parseInt(index, 10);
                        self.updateNav();
                        self.options.$container.trigger('selectpage.' + self.eventNs, index);
                    },
                    beforeCreate : function () {
                        self.tabsManager = this;
                        currentPage = 0;
                        self.options.$container.trigger('createpager.' + self.eventNs);
                    }
                });

                $.each(data.pages, function (key, val) {
                    $('[data-page-id="' + val.id + '"] .js-page-columns-select').val(val.content.length);
                });

                // When the height is set to auto, we need to rewrite it with a computed value.
                // Also please note that the PCI markup is forcing the unit,
                // so we cannot inject safely the value through the template
                if (data.pageHeight === 'auto') {
                    autoHeight(templateData.multiPages);

                    // apply the auto height twice to counter both a sizing issue and a flickering issue
                    _.defer(function() {
                        autoHeight(templateData.multiPages);
                    });
                }

                this.options.$container.trigger('afterrenderpages.' + self.eventNs);

                return this;
            };

            /**
             * Function renders tooltips in pages
             * @return {object} this
             */
            this.renderTooltips = function(data) {
                var tooltipsData = (_.isArray(data.tooltips)) ? data.tooltips : [],
                    $tooltips = this.options.$container.find('.tooltip'),
                    tooltipsContent = {};

                tooltipsData.forEach(function(tooltipData) {
                    tooltipsContent[tooltipData.id] = tooltipData.content;
                });

                $tooltips.each(function() {
                    var $currentTooltip = $(this),
                        currentId = $currentTooltip.data('identifier'),
                        content = tooltipsContent[currentId];

                    if (content && content.trim()) {
                        $currentTooltip.addClass('tooltip-active');
                        $currentTooltip.qtip({
                            overwrite: true,
                            theme: 'default',
                            content: {
                                text: content
                            },
                            position: {
                                target: 'mouse',
                                my: 'bottom center',
                                at: 'top center'
                            }
                        });
                    }
                });

                return this;
            };

            /**
             * Function renders interaction navigation (<i>Prev</i> <i>Next</i> buttons, current page number).
             * @param {object} data - interaction properties
             * @return {object} this
             */
            this.renderNavigation = function (data) {
                var templateData = {};

                //render pages template
                if (self.options.templates.navigation) {
                    _.assign(templateData, data, self.getTemplateData(data));

                    this.options.$container.find('.js-nav-container').html(
                        self.options.templates.navigation(templateData, self.getTemplateOptions())
                    );
                }

                this.updateNav();

                return this;
            };

            /**
             * Function renders whole interaction (pages and navigation)
             * @param {object} data - interaction properties
             * @return {object} - this
             */
            this.renderAll = function (data) {
                this.renderPages(data);
                this.renderTooltips(data);
                this.renderNavigation(data);
                return this;
            };

            /**
             * Function updates page navigation controls (current page number and pager buttons)
             * @return {object} - this
             */
            this.updateNav = function () {
                var tabsNum = this.tabsManager.countTabs(),
                    $prevBtn =  this.options.$container.find('.js-prev-page button'),
                    $nextBtn =  this.options.$container.find('.js-next-page button');

                this.options.$container.find('.js-current-page').text((currentPage + 1));

                $prevBtn.removeAttr('disabled');
                $nextBtn.removeAttr('disabled');

                if (tabsNum === currentPage + 1) {
                    $nextBtn.attr('disabled', 'disabled');
                }
                if (currentPage === 0) {
                    $prevBtn.attr('disabled', 'disabled');
                }
                return this;
            };

            /**
             * Function returns template data (current page number, interaction serial, current state etc.)
             * to pass it in handlebars template together with interaction parameters.
             * @param {object} data - interaction properties
             * @return {object} - template data
             */
            this.getTemplateData = function (data) {
                var multiPages = data.multiPages === 'true' || data.multiPages === true || typeof data.multiPages === 'undefined';
                var pageHeight = data.pageHeight;
                var pageWrapperHeight = pageHeight;

                if (pageHeight !== 'auto') {
                    pageHeight = parseInt(pageHeight, 10);
                    pageWrapperHeight = pageHeight + getWrapperHeight(multiPages);
                }

                return {
                    state : self.options.state,
                    serial : self.options.serial,
                    currentPage : currentPage + 1,
                    pagesNum : data.pages.length,
                    multiPages : multiPages,
                    showTabs : multiPages && (data.pages.length > 1 || data.onePageNavigation) && data.navigation !== 'buttons',
                    showNavigation : multiPages && (data.pages.length > 1 || data.onePageNavigation) && data.navigation !== 'tabs',
                    authoring : self.options.state === 'question',
                    pageHeight: pageHeight,
                    pageWrapperHeight : pageWrapperHeight,
                    showRemovePageButton : data.pages.length > 1 && self.options.state === 'question'
                };
            };

            /**
             * Function returns Handlebars template options (helpers) that will be used when rendering.
             * @returns {object} - Handlebars template options
             */
            this.getTemplateOptions = function () {
                return {
                    helpers : {
                        inc : function (value) {
                            return parseInt(value, 10) + 1;
                        }
                    }
                };
            };

            this.init();
        };
    }
);

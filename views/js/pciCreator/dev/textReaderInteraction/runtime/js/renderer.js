/*global define, _*/
define(
    [
        'IMSGlobal/jquery_2_1_1',
        'OAT/handlebars',
        'textReaderInteraction/runtime/js/tabs',

        // fixme: obviously, this dependency to TAO shouldn't be there
        // it is used to resolve the url of images when the interaction is 'sleep' state.
        // this could be avoided if the interaction content was stored in the markup instead of properties
        'taoQtiItem/qtiCommonRenderer/helpers/PortableElement',

        'OAT/jquery.qtip'
    ],
    function ($, Handlebars, Tabs, PortableElement) {
        'use strict';
        window.jQuery = $;
        return function (options) {
            var self = this,
                defaultOptions = {
                    state : 'sleep',
                    templates : {},
                    serial : ''
                },
                currentPage = 0;

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
                    markup,
                    fixedMarkup;

                this.options.$container.trigger('beforerenderpages.' + self.eventNs);

                //render pages template
                if (self.options.templates.pages) {
                    _.assign(templateData, data, self.getTemplateData(data));

                    markup = self.options.templates.pages(templateData, self.getTemplateOptions());

                    if (self.options.interaction !== 'undefined' && typeof self.options.interaction.renderer !== 'undefined') {
                        fixedMarkup = PortableElement.fixMarkupMediaSources(
                            markup,
                            self.options.interaction.renderer
                        );
                    }

                    this.options.$container.find('.js-page-container').html(fixedMarkup || markup);
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
                            content: {
                                text: content
                            },
                            position: {
                                target: 'event',
                                my: 'bottom center',
                                at: 'top center'
                            },
                            style: {
                                tip: {
                                    corner: true
                                },
                                classes: 'qtip-rounded qtip-shadow'
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
                var pageWrapperHeight;
                if (self.options.state === 'question') {
                    pageWrapperHeight = parseInt(data.pageHeight, 10) + 130;
                } else {
                    pageWrapperHeight = parseInt(data.pageHeight, 10) + 25;
                }

                return {
                    state : self.options.state,
                    serial : self.options.serial,
                    currentPage : currentPage + 1,
                    pagesNum : data.pages.length,
                    showTabs : (data.pages.length > 1 || data.onePageNavigation) && data.navigation !== 'buttons',
                    showNavigation : (data.pages.length > 1 || data.onePageNavigation) && data.navigation !== 'tabs',
                    authoring : self.options.state === 'question',
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
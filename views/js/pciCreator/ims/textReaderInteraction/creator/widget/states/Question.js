/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2015-2021 (original work) Open Assessment Technologies;
 *
 */
define([
    'core/promise',
    'taoQtiItem/qtiCreator/widgets/states/factory',
    'taoQtiItem/qtiCreator/widgets/interactions/states/Question',
    'taoQtiItem/qtiCreator/widgets/helpers/formElement',
    'taoQtiItem/qtiCreator/editor/containerEditor',
    'taoQtiItem/qtiCreator/editor/ckEditor/htmlEditor',
    'textReaderInteraction/creator/js/userTooltips',
    'tpl!textReaderInteraction/creator/tpl/propertiesForm',
    'lodash',
    'jquery',
    'css!textReaderInteraction/creator/css/textReaderInteraction'
], function (
    Promise,
    stateFactory,
    Question,
    formElement,
    containerEditor,
    htmlEditor,
    tooltipManager,
    formTpl,
    _,
    $
) {
    'use strict';
    var stateQuestion = stateFactory.extend(Question, function () {
        var self = this,
            $container = self.widget.$container,
            $form = self.widget.$form,
            interaction = self.widget.element,
            properties = interaction.properties,
            pageIds = _.map(properties.pages, 'id'),
            maxPageId = Math.max.apply(null, pageIds),
            tooltipBuffer;

        //add page event
        $container.on('click.' + interaction.typeIdentifier, '[class*="js-add-page"]', function () {
            var num = properties.pages.length + 1,
                $button = $(this),
                pageData = {
                    label : 'Page ' + num,
                    content : ['page ' + num + ' content'],
                    id : ++maxPageId
                },
                currentPage = 0;

            destroyContainerEditor(containerEditor, $container.find('.tr-passage'));

            if ($button.hasClass('js-add-page-before')) {
                properties.pages.unshift(pageData);
            } else if ($button.hasClass('js-add-page-after')) {
                properties.pages.push(pageData);
                currentPage = properties.pages.length - 1;
            }
            interaction.widgetRenderer.renderAll(properties);
            //go to new page
            interaction.widgetRenderer.tabsManager.index(currentPage);
        });

        //remove page event
        $container.on('click.' + interaction.typeIdentifier, '.js-remove-page', function () {
            var tabNum = $(this).data('page-num');

            destroyContainerEditor(containerEditor, $container.find('.tr-passage'));
            properties.pages.splice(tabNum, 1);
            interaction.widgetRenderer.renderAll(properties);
        });

        //change page layout
        $container.on('change.' + interaction.typeIdentifier, '.js-page-columns-select', function () {
            var numberOfColumns = parseInt($(this).val(), 10),
                currentPageIndex = interaction.widgetRenderer.tabsManager.index(),
                currentCols = interaction.properties.pages[currentPageIndex].content,
                newCols = [],
                $page = $('[data-page-num="' + currentPageIndex + '"]'),
                colNum;

            for (colNum = 0; colNum < numberOfColumns; colNum++) {
                newCols.push(currentCols[colNum] || "");
            }
            newCols[numberOfColumns - 1] += '<br>' + currentCols.slice(numberOfColumns).join('<br>');

            //set editors content
            $.each(newCols, function (key, val) {
                var editor = $page.find('[data-page-col-index="' + key + '"] .container-editor').data('editor');
                if (editor) {
                    editor.setData(val);
                }
            });

            interaction.properties.pages[currentPageIndex].content = newCols;
            interaction.widgetRenderer.renderPages(interaction.properties);
            interaction.widgetRenderer.tabsManager.index(currentPageIndex);
        });

        //Enable page CKEditor on selected tab and disable on the rest tabs.
        $container.on('selectpage.' + interaction.typeIdentifier, function (event, currentPageIndex) {
            var editor,
                pageIndex;

            $container.find('.js-page-column').each(function () {
                pageIndex = parseInt($(this).closest('.tr-page').data('page-num'), 10);
                editor = $(this).find('.container-editor').data('editor');
                if (editor) {
                    editor.setReadOnly(currentPageIndex !== pageIndex);
                }
            });
        });

        //Destroy page CKeditors when page rerenders
        $container.on('beforerenderpages.' + interaction.typeIdentifier, function () {
            destroyContainerEditor(containerEditor, $container.find('.tr-passage'));
        });

        //Init page CKeditors after render
        $container.on('createpager.' + interaction.typeIdentifier, function () {
            initEditors($container, interaction);
        });

        // Add tooltip functionality
        if (!_.isArray(interaction.properties.tooltips)) {
            interaction.properties.tooltips = [];
        }
        this.tooltips = tooltipManager({
            $authoringContainer: $form.find('.tooltip_authoring'),
            $interactionContainer: $container,
            $editableFields: $container.find('.js-page-column'),
            tooltipsData: interaction.properties.tooltips
        });

        this.tooltips.on('beforeDeleteTooltipMarkup', function(tooltipId) {
            // the buffer is needed to retain the column on which the tooltip markup was...
            tooltipBuffer = getTooltipInfos(tooltipId);
        });

        this.tooltips.on('afterDeleteTooltipMarkup', function() {
            // ... as we need to manually trigger the column saving
            if (tooltipBuffer) {
                saveColumn(
                    interaction,
                    tooltipBuffer.pageId,
                    tooltipBuffer.colIndex,
                    tooltipBuffer.colHtml
                );
                tooltipBuffer = null;
            }
        });

        /**
         * Identify the position in the reader (page id and column index) of the given tooltip
         */
        function getTooltipInfos(tooltipId) {
            var $tooltip = $container.find('.tooltip[data-identifier=' + tooltipId + ']'),
                $tooltipColumn = $tooltip.closest('.js-page-column');
            if ($tooltip.length && $tooltipColumn.length) {
                return {
                    pageId: $tooltip.closest('.js-tab-content').data('page-id'),
                    colIndex: $tooltipColumn.data('page-col-index'),
                    colHtml: htmlEditor.getData($tooltipColumn.find('[data-html-editable=true]'))
                };
            } else {
                return false;
            }
        }

        initEditors($container, interaction)
            .then(function() {
                self.tooltips.init();
            })
            .catch(function(err) {
                throw new Error('Error in editors initialisation ' + err.message);
            });


    }, function () {
        var widget = this.widget;
        var $container = widget.$container;
        var interaction = widget.element;
        var creatorContext = widget.getCreatorContext();

        this.tooltips.destroy();

        $container.off('.' + interaction.typeIdentifier);

        destroyContainerEditor(containerEditor, $container.find('.js-page-column'));

        creatorContext.trigger('registerBeforeSaveProcess', new Promise(function(resolve, reject) {
            var assetManager = interaction.renderer.getAssetManager();
            var sources = [];
            var contents = {};
            var promises = [];
            var contentPrefix = 'content-';

            interaction.properties.pages.forEach(function(page) {
                page.content.forEach(function(col) {
                    var elements = $.parseHTML(col, document.implementation.createHTMLDocument('virtual')) || [];
                    elements.forEach(function(element) {
                        /**
                         * better to put it to a container because of
                         * 1. element can be a text node, that doesn't have querySelector
                         * 2. element itself can be an img
                         */
                        var images;
                        var container = document.createElement('div');
                        container.appendChild(element);
                        images = container.querySelectorAll('img');
                        images = [].slice.call(images);
                        images.forEach(function(image) {
                            var src = image.getAttribute('src');
                            // image source is empty exactly after creation
                            if (src) {
                                sources.push(src);
                            }
                        });
                    });
                });
            });

            // make the source list unique
            sources = sources.filter(function (source, i) {
                return sources.indexOf(source) === i;
            });
            promises = sources.map(function(source) {
                var previousContent = interaction.properties[contentPrefix + source];
                // if it was already converted, just get the content
                if (previousContent) {
                    contents[source] = previousContent;
                    return Promise.resolve();
                }
                return toDataUrl(assetManager.resolve(source)).then(function(content) {
                    contents[source] = content;
                });
            });

            return Promise.all(promises).then(function() {
                var content;
                var property;
                // remove all content property
                for (property in interaction.properties) {
                    if (property.startsWith(contentPrefix)) {
                        delete interaction.properties[property];
                    }
                }
                for (content in contents) {
                    interaction.properties[contentPrefix + content] = contents[content];
                }
                resolve();
            }).catch(reject);
        }));
    });

    stateQuestion.prototype.initForm = function () {
        var _widget = this.widget,
            $form = _widget.$form,
            interaction = _widget.element,
            $positionSelect;

        // display/hide the panels according to selected config
        function toggleNavigation(multiPages, navigation) {
            multiPages = multiPages === 'true' || multiPages === true;
            $('.js-navigation-select-panel').toggle(multiPages);
            $('.js-tab-position-panel').toggle(multiPages && navigation !== 'buttons');
            $('.js-button-labels-panel').toggle(multiPages && navigation !== 'tabs');
        }

        //render the form using the form template
        $form.html(formTpl(
            interaction.properties
        ));

        $('.js-page-height-select').val(interaction.properties.pageHeight);
        $('.js-tab-position').val(interaction.properties.tabsPosition);
        $('.js-navigation-select').val(interaction.properties.navigation);

        toggleNavigation(interaction.properties.multiPages, interaction.properties.navigation);

        if (interaction.properties.navigation === 'both') {
            $positionSelect = $('.js-tab-position');
            $('select.js-tab-position option[value="bottom"]').attr('disabled', 'disabled');
            $positionSelect.trigger('change');
        }

        //init form javascript
        formElement.initWidget($form);

        //init data change callbacks
        formElement.setChangeCallbacks($form, interaction, {
            tabsPosition : function (i, value) {
                i.properties.tabsPosition = value;
                i.widgetRenderer.renderAll(i.properties);
            },
            pageHeight : function (i, value) {
                i.properties.pageHeight = value;
                i.widgetRenderer.renderPages(i.properties);
            },
            multiPages: function (i, value) {
                toggleNavigation(value, i.properties.navigation);
                i.properties.multiPages = value;
                i.widgetRenderer.renderAll(i.properties);
            },
            navigation : function (i, value) {
                toggleNavigation(i.properties.multiPages, value);

                if (value === 'buttons') {
                    i.properties.tabsPosition = 'top';
                }

                $('select.js-tab-position option[value="bottom"]').removeAttr('disabled');
                if (value === 'both') {
                    $positionSelect = $('select.js-tab-position');
                    if ($positionSelect.val() === 'bottom') {
                        $positionSelect.val('top');
                    }
                    $('select.js-tab-position option[value="bottom"]').attr('disabled', 'disabled');
                    $positionSelect.trigger('change');
                }

                i.properties.navigation = value;
                i.widgetRenderer.renderAll(i.properties);
            },
            buttonLabelsNext : function (i, value) {
                i.properties.buttonLabels.next = value;
                i.widgetRenderer.renderNavigation(i.properties);
            },
            buttonLabelsPrev : function (i, value) {
                i.properties.buttonLabels.prev = value;
                i.widgetRenderer.renderNavigation(i.properties);
            }
        });
    };
    /**
     * Function initializes the editors on the each page.
     * @param {jQuery DOM element} $container - interaction container
     * @param {object} interaction
     * @returns {undefined}
     */
    function initEditors($container, interaction) {
        $container.attr('data-element-support-figure', 'true');

        const widget = interaction.data('widget'),
            $pages = $container.find('.js-tab-content'),
            editorsReady = [];

        $pages.each(function () {
            const pageId = $(this).data('page-id'),
                pageIndex = $(this).data('page-num');

            $(this).find('.js-page-column').each(function () {
                const $editor = $(this),
                    colIndex = $editor.data('page-col-index');

                editorsReady.push(new Promise(function(resolve) {
                    containerEditor.create($editor, {
                        change: function (text) {
                            saveColumn(interaction, pageId, this.colIndex, text);
                        },
                        markup : interaction.properties.pages[pageIndex].content[colIndex],
                        related : interaction,
                        colIndex : colIndex,
                        highlight: true,
                        areaBroker: widget.getAreaBroker(),
                        qtiInclude: false,
                        flushDeletingWidgetsOnDestroy: true
                    });

                    $editor.on('editorready', function() {
                        resolve();
                    });
                }));
            });
        });

        return Promise.all(editorsReady);
    }

    /**
     * Converts url to data url
     * @param {String} url
     */
    function toDataUrl(url) {
        return new Promise(function(resolve) {
            var xhr = new XMLHttpRequest();
            xhr.onload = function() {
                var reader = new FileReader();
                reader.onloadend = function() {
                    resolve(reader.result);
                }
                reader.readAsDataURL(xhr.response);
            };
            xhr.open('GET', url);
            xhr.responseType = 'blob';
            xhr.send();
        });
    }

    /**
     * Save column content
     * @param {Object} interaction
     * @param {String} pageId
     * @param {String} colIndex
     * @param {String} text
     * @returns {Promise<void>}
     */
    function saveColumn(interaction, pageId, colIndex, text) {
        var pageData = _.find(interaction.properties.pages, function (page) {
            return parseInt(page.id, 10) === parseInt(pageId, 10);
        });
        if (pageData && typeof pageData.content[colIndex] !== 'undefined') {
            pageData.content[colIndex] = text;
        }
    }

    function destroyContainerEditor(containerEditor, $container) {
        //fix for Table widget - content is not saved if it's destroyed while in 'active' state
        $container.find('.widget-table').each(function( idx, elem ) {
            const widget = $(elem).data('widget');
            if (widget && widget.getCurrentState().name !== 'sleep') {
                widget.changeState('sleep');
            }
        });
        containerEditor.destroy($container);
    }

    return stateQuestion;
});

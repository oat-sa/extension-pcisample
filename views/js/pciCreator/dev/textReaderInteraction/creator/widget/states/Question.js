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
 * Copyright (c) 2015 (original work) Open Assessment Technologies;
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
            pageIds = _.pluck(properties.pages, 'id'),
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

            containerEditor.destroy($container.find('.tr-passage'));

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

            containerEditor.destroy($container.find('.tr-passage'));
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
            containerEditor.destroy($container.find('.tr-passage'));
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
        var $container = this.widget.$container,
            interaction = this.widget.element;

        this.tooltips.destroy();

        $container.off('.' + interaction.typeIdentifier);

        containerEditor.destroy($container.find('.js-page-column'));
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
        var widget = interaction.data('widget'),
            $pages = $container.find('.js-tab-content'),
            editorsReady = [];

        $pages.each(function () {
            var pageId = $(this).data('page-id'),
                pageIndex = $(this).data('page-num');

            $(this).find('.js-page-column').each(function () {
                var $editor = $(this),
                    colIndex = $editor.data('page-col-index');

                editorsReady.push(new Promise(function(resolve) {
                    containerEditor.create($editor, {
                        change : function (text) {
                            saveColumn(interaction, pageId, this.colIndex, text);
                        },
                        markup : interaction.properties.pages[pageIndex].content[colIndex],
                        related : interaction,
                        colIndex : colIndex,
                        highlight: true,
                        areaBroker: widget.getAreaBroker()
                    });

                    $editor.on('editorready', function() {
                        resolve();
                    });
                }));
            });
        });

        return Promise.all(editorsReady);
    }

    function saveColumn(interaction, pageId, colIndex, text) {
        var pageData = _.find(interaction.properties.pages, function (page) {
            return parseInt(page.id, 10) === parseInt(pageId, 10);
        });
        if (pageData && typeof pageData.content[colIndex] !== 'undefined') {
            pageData.content[colIndex] = text;
        }
    }

    return stateQuestion;
});

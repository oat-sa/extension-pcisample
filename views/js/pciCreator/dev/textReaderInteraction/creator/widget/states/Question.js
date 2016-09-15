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
    //todo: clean this up
    'taoQtiItem/qtiCreator/widgets/states/factory',
    'taoQtiItem/qtiCreator/widgets/interactions/states/Question',
    'taoQtiItem/qtiCreator/widgets/helpers/formElement',
    'taoQtiItem/qtiCreator/editor/containerEditor',
    'tpl!textReaderInteraction/creator/tpl/propertiesForm',
    'lodash',
    'jquery',
    'taoQtiItem/qtiCreator/widgets/helpers/content',
    'taoQtiItem/qtiCreator/widgets/helpers/textWrapper',
    'tpl!taoQtiItem/qtiCreator/tpl/toolbars/hottext-create', // todo: change this
    'tpl!textReaderInteraction/creator/tpl/tooltip',
    'css!textReaderInteraction/creator/css/textReaderInteraction'
    // 'taoQtiItem/qtiItem/helper/util' // for build identifier
], function (
    stateFactory,
    Question,
    formElement,
    containerEditor,
    formTpl,
    _,
    $,
    htmlContentHelper,
    textWrapper,
    hottextTpl,
    tooltipTpl
) {
    'use strict';
    var stateQuestion = stateFactory.extend(Question, function () {
        var that = this,
            $container = that.widget.$container,
            interaction = that.widget.element,
            properties = interaction.properties,
            pageIds = _.pluck(properties.pages, 'id'),
            maxPageId = Math.max.apply(null, pageIds);

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
                $page = $('[data-page-num="' + currentPageIndex + '"]');

            for (var colNum = 0; colNum < numberOfColumns; colNum++) {
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

        initEditors($container, interaction);
        initTextWrapper($container);

    }, function () {
        var $container = this.widget.$container,
            interaction = this.widget.element;

        $container.off('.' + interaction.typeIdentifier);

        containerEditor.destroy($container.find('.js-page-column'));
    });

    stateQuestion.prototype.initForm = function () {
        var _widget = this.widget,
            $form = _widget.$form,
            interaction = _widget.element,
            response = interaction.getResponseDeclaration();

        var $container = _widget.$container,
            $tooltips = $container.find('dl.tooltip'),
            tooltips = [];

        $tooltips.each(function () {
            tooltips.push({
                term: $(this).find('dt').text(),
                desc: $(this).find('dd').text()
            });
        });

        //render the form using the form template
        // $form.html(formTpl(_.merge(
        //     interaction.properties,
        //     {
        //         tooltips: tooltips
        //     }
        // )));
        $form.html(formTpl(
            interaction.properties
        ));


        $('.js-page-height-select').val(interaction.properties.pageHeight);
        $('.js-tab-position').val(interaction.properties.tabsPosition);
        $('.js-navigation-select').val(interaction.properties.navigation);

        $('.js-tab-position-panel').toggle(interaction.properties.navigation !== 'buttons');
        $('.js-button-labels-panel').toggle(interaction.properties.navigation !== 'tabs');

        if (interaction.properties.navigation === 'both') {
            var $positionSelect = $('.js-tab-position');
            $('select.js-tab-position option[value="bottom"]').attr('disabled', 'disabled');
            $positionSelect.trigger('change');
        }

        //init form javascript
        formElement.initWidget($form);

        //init data change callbacks
        formElement.setChangeCallbacks($form, interaction, {
            tabsPosition : function (interaction, value) {
                interaction.properties.tabsPosition = value;
                interaction.widgetRenderer.renderAll(interaction.properties);
            },
            pageHeight : function (interaction, value) {
                interaction.properties.pageHeight = value;
                interaction.widgetRenderer.renderPages(interaction.properties);
            },
            navigation : function (interaction, value) {
                $('.js-tab-position-panel').toggle(value !== 'buttons');
                $('.js-button-labels-panel').toggle(value !== 'tabs');

                if (value === 'buttons') {
                    interaction.properties.tabsPosition = 'top';
                }

                $('select.js-tab-position option[value="bottom"]').removeAttr('disabled');
                if (value === 'both') {
                    var $positionSelect = $('select.js-tab-position');
                    if ($positionSelect.val() == 'bottom') {
                        $positionSelect.val('top');
                    }
                    $('select.js-tab-position option[value="bottom"]').attr('disabled', 'disabled');
                    $positionSelect.trigger('change');
                }

                interaction.properties.navigation = value;
                interaction.widgetRenderer.renderAll(interaction.properties);
            },
            buttonLabelsNext : function (interaction, value) {
                interaction.properties.buttonLabels.next = value;
                interaction.widgetRenderer.renderNavigation(interaction.properties);
            },
            buttonLabelsPrev : function (interaction, value) {
                interaction.properties.buttonLabels.prev = value;
                interaction.widgetRenderer.renderNavigation(interaction.properties);
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
        var $pages = $container.find('.js-tab-content');

        $pages.each(function () {
            var pageId = $(this).data('page-id'),
                pageIndex = $(this).data('page-num');

            $(this).find('.js-page-column').each(function () {
                var colIndex = $(this).data('page-col-index');

                containerEditor.create($(this), {
                    change : function (text) {
                        console.log('change cb triggered');
                        var pageData = _.find(interaction.properties.pages, function (page) {
                            return page.id === pageId;
                        });
                        if (pageData && typeof pageData.content[this.colIndex] !== 'undefined') {
                            pageData.content[this.colIndex] = text;
                        }
                    },
                    markup : interaction.properties.pages[pageIndex].content[colIndex],
                    related : interaction,
                    colIndex : colIndex
                });
            });
        });
    }

    function initTextWrapper($container) {
        var $editable = $container.find('.js-page-column'),
            // todo: inject this
            gapModel = {
                toolbarTpl : hottextTpl
                /*
                ,
                afterCreate : function(interactionWidget, newHottextWidget, text){

                    newHottextWidget.element.body(text);
                    newHottextWidget.$container.find('.hottext-content').html(text);//add this manually the first time
                    newHottextWidget.changeState('choice');
                }
                 */
            },
            $toolbar = $(gapModel.toolbarTpl());

        $toolbar.show(); // todo: necessary?

        $toolbar.on('mousedown', function(e){
            var $selectionWrapper = $toolbar.parent(),
                text = $selectionWrapper.text().trim(),
                $tooltip = $(tooltipTpl({
                    term: text
                }));

            e.stopPropagation(); // prevent rewrapping
            $toolbar.detach();



            // $selectionWrapper
            //     .removeAttr('id')
            //     .addClass('widget-box')
            //     .attr('data-new', true);

            $selectionWrapper.replaceWith($tooltip);
            textWrapper.destroy($editable); // todo: this works ?


            // textWrapper.unwrap($editable); // todo: this works ?

            // htmlContentHelper.createElements(interaction.getBody(), $editable, htmlEditor.getData($editable), function(newGapWidget){
            //
            //     newGapWidget.changeState('question');
            //     textWrapper.create($editable);
            //     gapModel.afterCreate(widget, newGapWidget, _.escape(text));
            // });

        }).on('mouseup', function preventRewrapping(e){
            e.stopPropagation();
        });


        $editable.on('editorready.wrapper', function addTextWrapperFunctionnality(e) {
            var $target = $(e.target);
            textWrapper.create($target);

        }).on('wrapped.wrapper', function displayToolbar(e, $selectionWrapper){
            $selectionWrapper.append($toolbar);

        }).on('beforeunwrap.wrapper', function hideToolbar() {
            $toolbar.detach();
        });
    }





    return stateQuestion;
});

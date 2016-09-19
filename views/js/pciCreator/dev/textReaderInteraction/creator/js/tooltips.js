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
 * Copyright (c) 2016 (original work) Open Assessment Technologies;
 *
 */
define([
    'lodash',
    'jquery',
    'core/eventifier',
    'taoQtiItem/qtiCreator/widgets/helpers/textWrapper',
    'tpl!textReaderInteraction/creator/tpl/tooltip',
    'tpl!textReaderInteraction/creator/tpl/tooltip-create',
    'tpl!textReaderInteraction/creator/tpl/tooltip-authoring'
], function (
    _,
    $,
    eventifier,
    textWrapper,
    markupTpl,
    createButtonTpl,
    authoringTpl
) {
    'use strict';

    function buildId(tooltipsData) {
        var id,
            existingIds = tooltipsData.map(function(tooltip) {
                return tooltip.id;
            });

        do {
            id = 'tltp_' + _.random(10000);
        } while (existingIds.indexOf(id) !== -1);

        return id;
    }

    return function tooltipManagerFactory(options) {
        var tooltipManager,
            ns = '.tooltipsManager',
            tooltipsData = options.tooltipsData,
            $authoringContainer = options.$authoringContainer,
            $editableFields = options.$editableFields;

        tooltipManager = _.merge(eventifier(), {

            _initToolbar: function initToolbar() {
                var self = this,
                    $toolbar = $(createButtonTpl());

                $toolbar.show();

                $toolbar.on('mousedown', function(e){
                    var $selectionWrapper = $toolbar.parent();
                    e.stopPropagation(); // prevent rewrapping //todo: useful ?

                    self._createTooltip($selectionWrapper);
                    self._renderForm();

                    $toolbar.detach();
                    textWrapper.destroy($editableFields);
                    textWrapper.unwrap($editableFields);

                }).on('mouseup', function preventRewrapping(e){
                    e.stopPropagation(); // useful ?
                });

                // add text wrapper functionnality to editable fields
                $editableFields.on('editorready.wrapper', function addTextWrapperFunctionality(e) {
                    var $target = $(e.target);
                    textWrapper.create($target);

                }).on('wrapped.wrapper', function displayToolbar(e, $selectionWrapper){
                    $selectionWrapper.append($toolbar);

                }).on('beforeunwrap.wrapper', function hideToolbar() {
                    $toolbar.detach();
                });
            },

            _createTooltip: function _createTooltip($selectionWrapper) {
                var tooltipId = buildId(tooltipsData),
                    label = $selectionWrapper.text().trim(),
                    createdTooltip = {
                        id: tooltipId,
                        label: label,
                        content: ''
                    };

                // create in markup
                $selectionWrapper.replaceWith(
                    $(markupTpl(createdTooltip))
                );

                // create in model
                tooltipsData.push(createdTooltip);

                this.trigger('tooltipCreated' + ns, tooltipsData, createdTooltip);

                // todo: protect markup / add 'widget-box' class ?
            },

            _renderForm: function() {
                var self = this,
                    $inputFields;

                $authoringContainer.empty();
                $authoringContainer.append(
                    authoringTpl({
                        tooltips: tooltipsData
                    })
                );

                $inputFields = $authoringContainer.find('textarea.tooltip-content-edit');

                if ($inputFields.length) {
                    $inputFields.off(ns);
                    $inputFields.on('keyup' + ns, _.debounce(function(e) {
                        var $tooltip = $(e.target),
                            tooltipId = $tooltip.attr('name'),
                            tooltipContent = $tooltip.val();

                        self._updateTooltipContent(tooltipId, tooltipContent);
                    }));
                }
            },

            _updateTooltipContent: function(tooltipId, tooltipContent) {
                var updatedTooltip = _.find(tooltipsData, function (tooltip) {
                    return tooltipId === tooltip.id;
                });
                if (updatedTooltip && typeof updatedTooltip.content) {
                    updatedTooltip.content = tooltipContent;
                }
                this.trigger('contentChange' + ns, tooltipsData, updatedTooltip);
            },

            init: function() {
                this._initToolbar();
                this._renderForm();
            },

            destroy: function() {
                //todo: implement this properly
            }
        });

        return tooltipManager;
    };
});

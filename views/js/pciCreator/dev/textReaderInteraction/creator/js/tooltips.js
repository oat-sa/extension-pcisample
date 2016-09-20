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
            $interactionContainer = options.$interactionContainer,
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
                $editableFields.each(function() {
                    textWrapper.create($(this));
                });

                $editableFields.off(ns);
                $editableFields.on('wrapped' + ns, function displayToolbar(e, $selectionWrapper){
                    $selectionWrapper.append($toolbar);

                }).on('beforeunwrap' + ns, function hideToolbar() {
                    $toolbar.detach();
                });
            },

            _renderForm: function() {
                var self = this,
                    $inputFields,
                    $removeLinks;

                $authoringContainer.empty();
                $authoringContainer.append(
                    authoringTpl({
                        tooltips: tooltipsData
                    })
                );

                $inputFields = $authoringContainer.find('.tooltip-content-edit');
                $inputFields.on('keyup' + ns, _.debounce(function(e) {
                    var $tooltip = $(e.target),
                        tooltipId = $tooltip.closest('.tooltip-edit').data('identifier'),
                        tooltipContent = $tooltip.val();

                    self._updateTooltipContent(tooltipId, tooltipContent);
                }));

                $removeLinks = $authoringContainer.find('.tooltip-delete');
                $removeLinks.on('click' + ns, function(e) {
                    var tooltipId = $(e.target).closest('.tooltip-edit').data('identifier');
                    self._deleteTooltip(tooltipId);
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

                this._renderForm();

                this.trigger('tooltipCreated', createdTooltip, tooltipsData);
            },

            _updateTooltipContent: function(tooltipId, tooltipContent) {
                var updatedTooltip = _.find(tooltipsData, function (tooltip) {
                    return tooltipId === tooltip.id;
                });
                if (updatedTooltip && typeof updatedTooltip.content) {
                    updatedTooltip.content = tooltipContent;
                }
                this.trigger('tooltipChange', updatedTooltip, tooltipsData);
            },

            _deleteTooltip: function(tooltipId) {
                var deletedTooltip,
                    deletedTooltipIndex;

                // remove from markup
                this._deleteTooltipMarkup(tooltipId);

                // remove from model
                deletedTooltipIndex = _.findIndex(tooltipsData, function(tooltip) {
                    return tooltipId === tooltip.id;
                });

                if (deletedTooltipIndex !== -1) {
                    deletedTooltip = tooltipsData.splice(deletedTooltipIndex, 1)[0];

                    this.trigger('tooltipDeleted', deletedTooltip, tooltipsData);
                    this._renderForm();
                }
            },

            _deleteTooltipMarkup: function(tooltipId) {
                var $tooltip = $interactionContainer.find('[data-identifier=' + tooltipId + ']');

                if ($tooltip.length) {
                    this.trigger('beforeDeleteTooltipMarkup', tooltipId);

                    $tooltip.replaceWith($tooltip.text());

                    this.trigger('afterDeleteTooltipMarkup', tooltipId);
                }
            },

            _syncMarkupAndModel: function() {
                var self = this,
                    idsInMarkup = [],
                    idsInModel = tooltipsData.map(function(data) {
                        return data.id;
                    }),
                    removedFromModel,
                    $tooltips = $interactionContainer.find('.tooltip');

                if ($tooltips.length) {
                    $tooltips.each(function () {
                        var tooltipId = $(this).attr('data-identifier');
                        if (tooltipId) {
                            idsInMarkup.push(tooltipId);
                        }
                    });
                }
                // remove orphan entries from model
                removedFromModel = _.remove(tooltipsData, function(tooltip) {
                    return (idsInMarkup.indexOf(tooltip.id) === -1);
                });
                if (removedFromModel.length > 0) {
                    this._renderForm();
                }

                // remove orphan markup
                idsInMarkup.forEach(function(id) {
                    if (idsInModel.indexOf(id) === -1) {
                        self._deleteTooltipMarkup(id);
                    }
                });
            },

            init: function() {
                var self = this;

                this._syncMarkupAndModel();
                this._initToolbar();
                this._renderForm();

                // handle tooltip markup suppression by user
                $interactionContainer.on('keyup' + ns, _.debounce(function() {
                    self._syncMarkupAndModel();
                }));
            },

            destroy: function() {
                $editableFields.off(ns);
                $interactionContainer.off(ns);
                $authoringContainer.empty();
            }
        });
        return tooltipManager;
    };
});

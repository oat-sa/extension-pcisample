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
    'lib/uuid',
    'core/eventifier',
    'taoQtiItem/qtiCreator/widgets/helpers/textWrapper',
    'tpl!textReaderInteraction/creator/tpl/userTooltips/markup',
    'tpl!textReaderInteraction/creator/tpl/userTooltips/authoring'
], function (
    _,
    $,
    uuid,
    eventifier,
    textWrapper,
    markupTpl,
    authoringTpl
) {
    'use strict';

    function buildId(tooltipsData) {
        var id,
            existingIds = tooltipsData.map(function(tooltip) {
                return tooltip.id;
            });

        do {
            id = 'tltp_' + uuid();
        } while (existingIds.indexOf(id) !== -1);

        return id;
    }

    /**
     * @param {Object} options
     * @param {Array} options.tooltipsData - the model of the tooltips, with the following structure:
     * @param {String} options.tooltipsData[x].id
     * @param {String} options.tooltipsData[x].label - only used to identify the tooltip in the authoring form
     * @param {String} options.tooltipsData[x].content
     * @param {jQuery} options.$authoringContainer - where to insert the authoring form. Will be emptied.
     * @param {jQuery} options.$interactionContainer - element containing the tooltip markup
     * @param {jQuery} options.$editableFields - editor element that will enabled tooltip creation
     *
     */
    return function tooltipManagerFactory(options) {
        var tooltipManager,
            ns = '.tooltipsManager',

            tooltipsData            = (_.isArray(options.tooltipsData)) ? options.tooltipsData : [],
            $authoringContainer     = options.$authoringContainer,
            $interactionContainer   = options.$interactionContainer,
            $editableFields         = options.$editableFields;

        tooltipManager = eventifier({

            /**
             * Prevent tooltip partial selection and edition in editor
             * @param {Boolean} isProtectionWanted - shall tooltips be protected or not ?
             * @private
             */
            _toggleTooltipProtection: function _toggleTooltipProtection(isProtectionWanted) {
                var $tooltips = $interactionContainer.find('.tooltip');

                $tooltips.each(function() {
                    if (isProtectionWanted) {
                        $(this).attr('contenteditable', false);
                    } else {
                        $(this).removeAttr('contenteditable');
                    }
                });
            },
            _protectTooltips: function _protectTooltips() {
                this._toggleTooltipProtection(true);
            },
            _unprotectTooltips: function _unprotectTooltips() {
                this._toggleTooltipProtection(false);
            },

            /**
             * Render the authoring form based on the model
             * @private
             */
            _renderForm: function _renderForm() {
                var self = this,
                    $inputFields,
                    $removeLinks;

                $authoringContainer.empty();
                $authoringContainer.append(
                    authoringTpl({
                        tooltips: tooltipsData
                    })
                );

                // attach behaviour to the tooltip content authoring field
                $inputFields = $authoringContainer.find('.tooltip-content-edit');
                $inputFields.on('keyup' + ns, _.debounce(function(e) {
                    var $tooltip = $(e.target),
                        tooltipId = $tooltip.closest('.tooltip-edit').data('identifier'),
                        tooltipContent = _.escape($tooltip.val()).trim();

                    self._updateTooltipContent(tooltipId, tooltipContent);
                }, 500));

                // attach behaviour to the delete tooltip button
                $removeLinks = $authoringContainer.find('.tooltip-delete');
                $removeLinks.on('click' + ns, function(e) {
                    var tooltipId = $(e.target).closest('.tooltip-edit').data('identifier');
                    self._deleteTooltip(tooltipId);
                });
            },

            /**
             * Update the model when a tooltip content has been modified (usually by the user in the authoring form)
             * @private
             */
            _updateTooltipContent: function _updateTooltipContent(tooltipId, tooltipContent) {
                var updatedTooltip = _.find(tooltipsData, function (tooltip) {
                    return tooltipId === tooltip.id;
                });
                if (updatedTooltip) {
                    updatedTooltip.content = tooltipContent;
                }
                this.trigger('tooltipChange', updatedTooltip, tooltipsData);
            },

            /**
             * Destroy the tooltip markup and the associated model entry
             * @private
             */
            _deleteTooltip: function _deleteTooltip(tooltipId) {
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

            /**
             * Notify listeners before and after the actual markup deletion. This is useful if the listeners needs
             * to do something with the markup before its removal (like identifying the position of the deleted tooltip)
             * @private
             */
            _deleteTooltipMarkup: function _deleteTooltipMarkup(tooltipId) {
                var $tooltip = $interactionContainer.find('.tooltip[data-identifier=' + tooltipId + ']');

                if ($tooltip.length) {
                    this.trigger('beforeDeleteTooltipMarkup', tooltipId);

                    $tooltip.replaceWith($tooltip.text());

                    this.trigger('afterDeleteTooltipMarkup', tooltipId);
                }
            },

            /**
             * Ensure consistency between existing tooltip markup and the model, who can easily get out of sync:
             * a user deleting some markup is the most common case
             * @private
             */
            _syncMarkupAndModel: function _syncMarkupAndModel() {
                var idsInMarkup = [],
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

                // create missing model entry
                idsInMarkup.forEach(function(id) {
                    var $tooltip;
                    if (idsInModel.indexOf(id) === -1) {
                        $tooltip = $interactionContainer.find('.tooltip[data-identifier=' + id + ']');
                        if ($tooltip.length) {
                            tooltipsData.push({
                                id: id,
                                label: $tooltip.text(),
                                content: ''
                            });
                        }
                    }
                });
            },

            /**
             * Activate the tooltip functionality
             */
            init: function init() {
                var self = this;

                this._syncMarkupAndModel();
                this._protectTooltips();
                this._renderForm();

                // handle tooltip markup suppression by user
                $interactionContainer.on('keyup' + ns, _.debounce(function() {
                    self._syncMarkupAndModel();
                }, 500));
            },

            /**
             * Among other cases, this should be called in the destroy function of an interaction widget using the tooltips
             */
            destroy: function destroy() {
                this._unprotectTooltips();
                textWrapper.destroy($editableFields);
                $editableFields.off(ns);
                $interactionContainer.off(ns);
                $authoringContainer.empty();
            }
        });
        return tooltipManager;
    };
});

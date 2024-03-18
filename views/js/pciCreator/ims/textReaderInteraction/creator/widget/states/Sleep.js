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
 * Copyright (c) 2024 (original work) Open Assessment Technologies;
 *
 */
define([
    'core/promise',
    'taoQtiItem/qtiCreator/widgets/states/factory',
    'taoQtiItem/qtiCreator/widgets/interactions/states/Sleep',
    'textReaderInteraction/creator/js/xincludeLoader',
], function (
    Promise,
    stateFactory,
    Sleep,
    xincludeLoader,
) {
    'use strict';
    return stateFactory.extend(
        Sleep,
        function () {
            const widget = this.widget;
            const interaction = widget.element;
            return xincludeLoader.loadByElementPages(interaction.properties.pages, interaction.renderer.getOption('baseUrl'))
            .then(pagesWithInclusionsResolved => {
                interaction.properties.pages = pagesWithInclusionsResolved;
                interaction.widgetRenderer.renderAll(interaction.properties);
            });
        },
        function () {},
    );
});

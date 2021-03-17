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
    'qtiCustomInteractionContext',
    'taoQtiItem/portableLib/jquery_2_1_1',
    'textReaderInteraction/runtime/js/renderer',
    'css!textReaderInteraction/runtime/css/jquery.qtip',
    'css!textReaderInteraction/runtime/css/textReaderInteraction'
], function (qtiCustomInteractionContext, $, Renderer) {
    'use strict';
    /**
     * Factory for textReaderInteraction
     * @param {JQueryElement} $container
     * @param {Object} properties
     * @param {Object|undefined} state
     */
    var textReaderInteractionFactory = function textReaderInteractionFactory($container, properties, state) {
        // instanciate renderer and render it to the container
        var widgetRenderer = new Renderer({
            $container: $container
        });
        widgetRenderer.renderAll(properties);

        // add navigation event listener
        $container.on('click', '.js-prev-page, .js-next-page', function () {
            var $button = $(this),
                direction = $button.hasClass('js-next-page') ? 1 : -1,
                currentPage = widgetRenderer.tabsManager.index(),
                index = currentPage + direction;

            if (index >= 0 && config.properties.pages.length > index) {
                widgetRenderer.tabsManager.index(index);
            }
        });

        // restore previous state
        if (state && typeof state.index === 'number') {
            widgetRenderer.tabsManager.index(state.index);
        }

        return {
            /**
             * Returns with interaction response
             * @returns {Object}
             */
            getResponse: function getResponse() {
                return { base: { boolean: true } };
            },

            /**
             * Returns with interaction state
             * @returns {Object}
             */
            getState: function getState() {
                return { index: widgetRenderer.tabsManager.index() };
            },

            /**
             * Interaction destroy function
             */
            oncompleted: function () {
                $container.off().empty();
            }
        };
    };

    /**
     * Register interaction
     */
    qtiCustomInteractionContext.register({
        typeIdentifier: 'textReaderInteraction',
        /**
         * Get PCI instance
         * @param {HTMLElement} dom
         * @param {Object} config
         * @param {Object} config.properties
         * @param {() => void} config.onready
         * @param {Object|undefined} state
         */
        getInstance: function (dom, config, state) {
            var properties = config.properties || {};

            // cast properties if necessary
            ['pages', 'buttonLabels', 'tooltips'].forEach(propertyName => {
                if (typeof properties[propertyName] === 'string') {
                    try {
                        properties[propertyName] = JSON.parse(properties[propertyName]);
                    } catch (e) {}
                }
            });
            properties.multiPages = Boolean(properties.multiPages);
            properties.pageHeight = parseInt(properties.pageHeight, 10);

            // instanciate PCI
            var pciInstance = textReaderInteractionFactory($(dom), properties, state);

            // call onready
            config.onready(pciInstance);
        }
    });
});

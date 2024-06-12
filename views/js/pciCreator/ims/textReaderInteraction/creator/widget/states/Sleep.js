define([
    'core/promise',
    'taoQtiItem/qtiCreator/widgets/states/factory',
    'taoQtiItem/qtiCreator/widgets/interactions/states/Sleep',
    'taoQtiItem/portableLib/OAT/xincludeLoader',
], function (
    Promise,
    stateFactory,
    Sleep,
    xincludeLoader
) {
    'use strict';

    function removeMediaDataAttributes(pages) {
        pages.forEach(page => {
            page.content.forEach(contentItem => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = contentItem;
                const mediaObjects = tempDiv.querySelectorAll('object[type*="video"], object[type*="audio"]');
                mediaObjects.forEach(obj => {
                    obj.removeAttribute('data');
                });
                page.content = [tempDiv.innerHTML];
            });
        });
        return pages;
    }

    return stateFactory.extend(
        Sleep,
        function () {
            const widget = this.widget;
            const interaction = widget.element;
            const pages = structuredClone(interaction.properties.pages);
            return xincludeLoader.loadByElementPages(pages, interaction.renderer.getOption('baseUrl'))
                .then(pagesWithInclusionsResolved => {
                    let properties = structuredClone(interaction.properties);
                    properties.pages = removeMediaDataAttributes(pagesWithInclusionsResolved);
                    interaction.widgetRenderer.renderAll(properties);
                });
        },
        function () {}
    );
});

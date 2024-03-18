define(['jquery'], function ($) {
    'use strict';

    function convertXMLToHTML(xmlNode) {
        const htmlNode = document.createElement(xmlNode.nodeName);
        Array.from(xmlNode.attributes).forEach(attr => {
            htmlNode.setAttribute(attr.name, attr.value);
        });
        xmlNode.childNodes.forEach(childNode => {
            if (childNode.nodeType === Node.ELEMENT_NODE) {
                htmlNode.appendChild(convertXMLToHTML(childNode));
            } else if (childNode.nodeType === Node.TEXT_NODE) {
                htmlNode.appendChild(document.createTextNode(childNode.nodeValue));
            }
        });

        return htmlNode;
    }

    function parseXmlToDom(xmlString) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "application/xml");

        return convertXMLToHTML(xmlDoc.documentElement);
    }

    function loadXIncludeElement($xiIncludeElement, baseUrl) {
        const href = $xiIncludeElement.attr('href');

        return new Promise((resolve, reject) => {
            if (!href || !baseUrl) {
                return reject(new Error('href or baseUrl is missing'));
            }

            const fileUrl = `text!${baseUrl}${href}`;
            require.undef(fileUrl);
            require([fileUrl], stimulusXml => {
                const data = parseXmlToDom(stimulusXml);
                resolve(data);
            }, () => {
                reject(new Error('File not found'));
            });
        });
    }

    function processContentItem(contentItem, baseUrl) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = contentItem;
        const xiIncludeElements = tempDiv.querySelectorAll('xi\\:include');

        const xiIncludePromises = Array.from(xiIncludeElements).map(xiElement => {
            return loadXIncludeElement($(xiElement), baseUrl).then(newContent => {
                xiElement.replaceWith(newContent);
            });
        });

        return Promise.all(xiIncludePromises).then(() => tempDiv.innerHTML);
    }

    return {
        name: 'xincludeLoader',
        loadXIncludeElement,
        parseXmlToDom,
        loadByElementPages(pages, baseUrl) {
            return Promise.all(pages.map(page => {
                const contentPromises = page.content.map(contentItem => processContentItem(contentItem, baseUrl));
                return Promise.all(contentPromises).then(updatedContentItems => {
                    page.content = updatedContentItems;
                    return page;
                });
            }));
        }
    };
});
